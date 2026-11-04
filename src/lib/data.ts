import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { alternateStorageBucket, db, firebaseApp, requireDb, requireStorage } from "./firebase";
import {
  defaultSettings,
  normalizeSettings,
  type GalleryItem,
  type Inquiry,
  type InquiryReply,
  type InquiryType,
  type Product,
  type SiteSettings,
} from "./models";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const FIRESTORE_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Firebase does not expose an AbortSignal for Firestore/Storage calls. If the
 * database or bucket is disabled, the SDK can retry for a long time and leave a
 * form stuck on "Sending…". Race the SDK promise against a clear timeout so the
 * UI can show an actionable error instead.
 */
function withTimeout<T>(promise: Promise<T>, message: string, ms = FIRESTORE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const READ_TIMEOUT = "Firestore did not respond. Check that the database is enabled and that you are online.";
const WRITE_TIMEOUT = "Firestore did not respond. The change may not have been saved; refresh before retrying.";

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type GalleryInput = Omit<GalleryItem, "id" | "createdAt">;
export type InquiryInput = Omit<Inquiry, "id" | "createdAt" | "status" | "replyCount" | "lastReplyAt">;
export type ReplyInput = Omit<InquiryReply, "id" | "sentAt">;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    title_en: text(data.title_en),
    title_fr: text(data.title_fr),
    description_en: text(data.description_en),
    description_fr: text(data.description_fr),
    spec_en: text(data.spec_en),
    spec_fr: text(data.spec_fr),
    imageUrl: text(data.imageUrl),
    category: text(data.category),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function toGalleryItem(id: string, data: DocumentData): GalleryItem {
  return {
    id,
    imageUrl: text(data.imageUrl),
    caption_en: text(data.caption_en),
    caption_fr: text(data.caption_fr),
    order: typeof data.order === "number" ? data.order : 0,
    createdAt: data.createdAt ?? null,
  };
}

function toInquiry(id: string, data: DocumentData): Inquiry {
  return {
    id,
    fullName: text(data.fullName),
    businessEmail: text(data.businessEmail),
    company: text(data.company),
    inquiryType: (["general", "quote", "compliance"] as InquiryType[]).includes(data.inquiryType)
      ? (data.inquiryType as InquiryType)
      : "general",
    message: text(data.message),
    consent: data.consent === true,
    status: data.status === "replied" || (typeof data.replyCount === "number" && data.replyCount > 0) ? "replied" : "new",
    replyCount: typeof data.replyCount === "number" ? data.replyCount : 0,
    lastReplyAt: data.lastReplyAt ?? null,
    createdAt: data.createdAt ?? null,
  };
}

function toInquiryReply(id: string, data: DocumentData): InquiryReply {
  return {
    id,
    subject: text(data.subject),
    message: text(data.message),
    to: text(data.to),
    from: text(data.from),
    sentBy: text(data.sentBy),
    sentAt: data.sentAt ?? null,
  };
}

function millis(value: unknown): number {
  const timestamp = value as { toMillis?: () => number } | null | undefined;
  return typeof timestamp?.toMillis === "function" ? timestamp.toMillis() : 0;
}

/* ---------------------------------- images --------------------------------- */

function missingBucketError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message = error instanceof Error ? error.message : "";
  return (
    code.includes("storage/bucket-not-found") ||
    code.includes("storage/unknown") ||
    /bucket.{0,30}(not found|does not exist)|404 not found/i.test(message)
  );
}

async function putImage(bucket: FirebaseStorage, path: string, file: File): Promise<string> {
  const objectRef = ref(bucket, path);
  await withTimeout(
    uploadBytes(objectRef, file, { contentType: file.type }),
    "The image upload timed out. Check Firebase Storage and your connection, then try again.",
    UPLOAD_TIMEOUT_MS,
  );
  return getDownloadURL(objectRef);
}

export async function uploadImage(folder: "products" | "gallery", file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 6 MB or smaller.");

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName || "image"}`;

  try {
    return await putImage(requireStorage(), path, file);
  } catch (error) {
    // A new project uses .firebasestorage.app while an older one uses
    // .appspot.com. If the configured bucket does not exist, retry once with
    // the other name so a console copy/paste mismatch does not break uploads.
    if (!firebaseApp || !alternateStorageBucket || !missingBucketError(error)) throw error;
    console.warn(`Storage bucket not found; retrying with ${alternateStorageBucket}.`);
    return putImage(getStorage(firebaseApp, alternateStorageBucket), path, file);
  }
}

/* --------------------------------- products -------------------------------- */

export async function fetchProducts(): Promise<Product[]> {
  if (!db) return [];
  const snapshot = await withTimeout(getDocs(collection(db, "products")), READ_TIMEOUT);
  return snapshot.docs
    .map((item) => toProduct(item.id, item.data()))
    .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
}

export async function createProduct(input: ProductInput): Promise<string> {
  const created = await withTimeout(
    addDoc(collection(requireDb(), "products"), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    WRITE_TIMEOUT,
  );
  return created.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await withTimeout(
    updateDoc(doc(requireDb(), "products", id), { ...input, updatedAt: serverTimestamp() }),
    WRITE_TIMEOUT,
  );
}

export async function removeProduct(id: string): Promise<void> {
  await withTimeout(deleteDoc(doc(requireDb(), "products", id)), WRITE_TIMEOUT);
}

/* ---------------------------------- gallery -------------------------------- */

export async function fetchGallery(): Promise<GalleryItem[]> {
  if (!db) return [];
  const snapshot = await withTimeout(getDocs(collection(db, "gallery")), READ_TIMEOUT);
  return snapshot.docs
    .map((item) => toGalleryItem(item.id, item.data()))
    .sort((a, b) => a.order - b.order || millis(b.createdAt) - millis(a.createdAt));
}

export async function createGalleryItem(input: GalleryInput): Promise<string> {
  const created = await withTimeout(
    addDoc(collection(requireDb(), "gallery"), {
      ...input,
      createdAt: serverTimestamp(),
    }),
    WRITE_TIMEOUT,
  );
  return created.id;
}

export async function updateGalleryItem(id: string, input: Partial<GalleryInput>): Promise<void> {
  await withTimeout(updateDoc(doc(requireDb(), "gallery", id), input), WRITE_TIMEOUT);
}

export async function removeGalleryItem(id: string): Promise<void> {
  await withTimeout(deleteDoc(doc(requireDb(), "gallery", id)), WRITE_TIMEOUT);
}

export async function saveGalleryOrder(items: GalleryItem[]): Promise<void> {
  const database = requireDb();
  const batch = writeBatch(database);
  items.forEach((item, index) => {
    batch.update(doc(database, "gallery", item.id), { order: index });
  });
  await withTimeout(batch.commit(), WRITE_TIMEOUT);
}

/* --------------------------------- inquiries ------------------------------- */

export async function createInquiry(input: InquiryInput): Promise<void> {
  await withTimeout(
    addDoc(collection(requireDb(), "inquiries"), {
      ...input,
      status: "new",
      replyCount: 0,
      createdAt: serverTimestamp(),
    }),
    "The inquiry could not be saved because Firestore did not respond. Please email us instead.",
  );
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  if (!db) return [];
  const snapshot = await withTimeout(getDocs(collection(db, "inquiries")), READ_TIMEOUT);
  return snapshot.docs
    .map((item) => toInquiry(item.id, item.data()))
    .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
}

export async function fetchInquiryReplies(inquiryId: string): Promise<InquiryReply[]> {
  if (!db) return [];
  const snapshot = await withTimeout(getDocs(collection(db, "inquiries", inquiryId, "replies")), READ_TIMEOUT);
  return snapshot.docs
    .map((item) => toInquiryReply(item.id, item.data()))
    .sort((a, b) => millis(a.sentAt) - millis(b.sentAt));
}

/** Records a reply after the server confirms the email was sent. */
export async function recordInquiryReply(inquiryId: string, input: ReplyInput): Promise<void> {
  const database = requireDb();
  await withTimeout(
    addDoc(collection(database, "inquiries", inquiryId, "replies"), {
      ...input,
      sentAt: serverTimestamp(),
    }),
    WRITE_TIMEOUT,
  );
  await withTimeout(
    updateDoc(doc(database, "inquiries", inquiryId), {
      status: "replied",
      replyCount: increment(1),
      lastReplyAt: serverTimestamp(),
    }),
    WRITE_TIMEOUT,
  );
}

export async function setInquiryStatus(inquiryId: string, status: "new" | "replied"): Promise<void> {
  await withTimeout(updateDoc(doc(requireDb(), "inquiries", inquiryId), { status }), WRITE_TIMEOUT);
}

/* --------------------------------- settings -------------------------------- */

export async function fetchSettings(): Promise<SiteSettings> {
  if (!db) return defaultSettings;
  const snapshot = await withTimeout(getDoc(doc(db, "settings", "site")), READ_TIMEOUT);
  return snapshot.exists()
    ? normalizeSettings({ ...defaultSettings, ...(snapshot.data() as Partial<SiteSettings>) })
    : defaultSettings;
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const { updatedAt: _ignored, ...values } = settings;
  await withTimeout(
    setDoc(doc(requireDb(), "settings", "site"), { ...values, updatedAt: serverTimestamp() }, { merge: true }),
    WRITE_TIMEOUT,
  );
}

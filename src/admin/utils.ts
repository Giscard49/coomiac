import type { Timestamp } from "firebase/firestore";

export function formatDate(value?: Timestamp | null): string {
  if (!value) return "—";
  try {
    return value.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Friendly, actionable messages for Firestore/Storage/server failures. */
export function errorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const raw = error instanceof Error ? error.message : "";

  if (code.includes("permission-denied")) {
    return "Firestore denied this request. Sign in again and make sure the published rules allow your admin account.";
  }
  if (code.includes("unauthenticated")) return "Your session has expired. Please sign in again.";
  if (code.includes("unavailable")) return "Firebase is unreachable. Check your connection and try again.";
  if (code.includes("failed-precondition")) {
    return "Firestore needs setup or an index before it can complete this request. Create the database or index in Firebase Console, then retry.";
  }
  if (code.includes("resource-exhausted")) return "Firebase is busy right now. Please try again in a moment.";
  if (code.includes("not-found")) return "That record no longer exists. Refresh the list and try again.";
  if (code.includes("already-exists")) return "That record already exists.";

  if (code.includes("storage/unauthorized")) {
    return "Storage denied the upload. Publish storage.rules and confirm your account has an admins/{uid} document.";
  }
  if (code.includes("storage/retry-limit-exceeded")) {
    return "The upload timed out. Try a smaller image or check your connection.";
  }
  if (code.includes("storage/quota-exceeded")) {
    return "The Firebase Storage quota is full. Free space or upgrade the Firebase plan, then retry.";
  }
  if (code.includes("storage/unknown")) {
    return "Storage could not accept the upload. Enable Firebase Storage and check VITE_FIREBASE_STORAGE_BUCKET in .env.";
  }
  if (code.includes("storage/canceled")) return "The upload was canceled.";

  if (code.includes("auth/")) {
    return "Authentication failed. Sign in again and retry.";
  }

  if (!code) return raw || "Something went wrong. Please try again.";
  return `Firebase could not complete that request (${code}). Please try again.`;
}

/** Raw technical detail for the collapsible "Technical details" block. */
export function errorDetail(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

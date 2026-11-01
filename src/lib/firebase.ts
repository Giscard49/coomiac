import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase client configuration.
 *
 * These keys are public by design (they identify the project, they do not grant
 * admin access). Access control is enforced by Firestore/Storage rules.
 * The OpenAI key is NOT here — it lives only on the server (api/translate.ts).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

if (import.meta.env.DEV) {
  console.log("ENV CHECK:", {
    apiKey: firebaseConfig.apiKey?.slice(0, 10),
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId?.slice(0, 28),
  });
}

const requiredEnv = [
  ["apiKey", "VITE_FIREBASE_API_KEY"],
  ["authDomain", "VITE_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "VITE_FIREBASE_PROJECT_ID"],
  ["storageBucket", "VITE_FIREBASE_STORAGE_BUCKET"],
  ["appId", "VITE_FIREBASE_APP_ID"],
] as const;

/** Env var names that still need a value, used by the admin setup screen. */
export const missingFirebaseEnv = requiredEnv
  .filter(([key]) => !firebaseConfig[key])
  .map(([, envName]) => envName);

export const isFirebaseConfigured = missingFirebaseEnv.length === 0;

function createApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  try {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase failed to initialize", error);
    return null;
  }
}

const app = createApp();

export const firebaseApp = app;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

/**
 * New Firebase projects use `<project>.firebasestorage.app`; older projects use
 * `<project>.appspot.com`. Uploads retry with the other name if the configured
 * bucket does not exist, so a console copy/paste mismatch cannot break the
 * gallery.
 */
export const alternateStorageBucket = (() => {
  const bucket = firebaseConfig.storageBucket;
  const projectId = firebaseConfig.projectId;
  if (!bucket || !projectId) return null;
  if (bucket.endsWith(".appspot.com")) return `${projectId}.firebasestorage.app`;
  if (bucket.endsWith(".firebasestorage.app")) return `${projectId}.appspot.com`;
  return null;
})();

export function requireDb(): Firestore {
  if (!db) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* keys to .env or .env.local.");
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) throw new Error("Firebase Storage is not configured. Add the VITE_FIREBASE_* keys to .env or .env.local.");
  return storage;
}

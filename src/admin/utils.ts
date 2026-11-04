import type { Timestamp } from "firebase/firestore";

type AdminLang = "en" | "fr";

export function formatDate(value?: Timestamp | null, lang: AdminLang = "en"): string {
  if (!value) return "—";
  try {
    return value.toDate().toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

const messages = {
  en: {
    permissionDenied:
      "Firestore denied this request. Sign in again and make sure the published rules allow your admin account.",
    unauthenticated: "Your session has expired. Please sign in again.",
    unavailable: "Firebase is unreachable. Check your connection and try again.",
    failedPrecondition:
      "Firestore needs setup or an index before it can complete this request. Create the database or index in Firebase Console, then retry.",
    resourceExhausted: "Firebase is busy right now. Please try again in a moment.",
    notFound: "That record no longer exists. Refresh the list and try again.",
    alreadyExists: "That record already exists.",
    storageUnauthorized:
      "Storage denied the upload. Publish storage.rules and confirm your account has an admins/{uid} document.",
    storageRetry:
      "The upload timed out. Try a smaller image or check your connection.",
    storageQuota:
      "The Firebase Storage quota is full. Free space or upgrade the Firebase plan, then retry.",
    storageUnknown:
      "Storage could not accept the upload. Enable Firebase Storage and check VITE_FIREBASE_STORAGE_BUCKET in .env.",
    storageCanceled: "The upload was canceled.",
    auth: "Authentication failed. Sign in again and retry.",
    generic: "Something went wrong. Please try again.",
    firebase: (code: string) =>
      `Firebase could not complete that request (${code}). Please try again.`,
  },
  fr: {
    permissionDenied:
      "Firestore a refusé cette requête. Reconnectez-vous et vérifiez que les règles publiées autorisent votre compte administrateur.",
    unauthenticated: "Votre session a expiré. Reconnectez-vous.",
    unavailable: "Firebase est inaccessible. Vérifiez votre connexion et réessayez.",
    failedPrecondition:
      "Firestore nécessite une configuration ou un index avant de traiter cette requête. Créez la base de données ou l'index dans Firebase Console, puis réessayez.",
    resourceExhausted: "Firebase est momentanément surchargé. Réessayez dans un instant.",
    notFound: "Cet enregistrement n'existe plus. Actualisez la liste et réessayez.",
    alreadyExists: "Cet enregistrement existe déjà.",
    storageUnauthorized:
      "Storage a refusé l'envoi. Publiez storage.rules et vérifiez que votre compte possède un document admins/{uid}.",
    storageRetry:
      "L'envoi a expiré. Essayez une image plus légère ou vérifiez votre connexion.",
    storageQuota:
      "Le quota Firebase Storage est plein. Libérez de l'espace ou changez d'offre Firebase, puis réessayez.",
    storageUnknown:
      "Storage n'a pas pu accepter l'envoi. Activez Firebase Storage et vérifiez VITE_FIREBASE_STORAGE_BUCKET dans .env.",
    storageCanceled: "L'envoi a été annulé.",
    auth: "L'authentification a échoué. Reconnectez-vous et réessayez.",
    generic: "Une erreur s'est produite. Réessayez.",
    firebase: (code: string) =>
      `Firebase n'a pas pu traiter cette requête (${code}). Réessayez.`,
  },
} as const;

/** Friendly, actionable messages for Firestore/Storage/server failures. */
export function errorMessage(error: unknown, lang: AdminLang = "en"): string {
  const text = messages[lang];
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const raw = error instanceof Error ? error.message : "";

  if (code.includes("permission-denied")) return text.permissionDenied;
  if (code.includes("unauthenticated")) return text.unauthenticated;
  if (code.includes("unavailable")) return text.unavailable;
  if (code.includes("failed-precondition")) return text.failedPrecondition;
  if (code.includes("resource-exhausted")) return text.resourceExhausted;
  if (code.includes("not-found")) return text.notFound;
  if (code.includes("already-exists")) return text.alreadyExists;

  if (code.includes("storage/unauthorized")) return text.storageUnauthorized;
  if (code.includes("storage/retry-limit-exceeded")) return text.storageRetry;
  if (code.includes("storage/quota-exceeded")) return text.storageQuota;
  if (code.includes("storage/unknown")) return text.storageUnknown;
  if (code.includes("storage/canceled")) return text.storageCanceled;

  if (code.includes("auth/")) return text.auth;

  if (!code) return raw || text.generic;
  return text.firebase(code);
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

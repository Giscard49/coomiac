export type AuthErrorInfo = {
  code: string;
  message: string;
  /** Optional setup hint shown only after a failed sign-in attempt. */
  help?: string;
};

const ADMIN_EMAIL = "coomiac@admin.com";

const CREDENTIAL_HELP =
  `MANUAL ACTION REQUIRED if this is the first sign-in: go to Firebase Console → Authentication → Users → Add user → ${ADMIN_EMAIL}. ` +
  "Then create the Firestore document admins/{your-uid} so the account is authorized.";

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code ?? "");
  }
  return "";
}

/**
 * Turns Firebase Auth errors into short, client-safe messages.
 * Raw Firebase/Google text must never be shown in the sign-in form.
 */
export function getAuthError(error: unknown): AuthErrorInfo {
  const code = errorCode(error);

  if (code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
    return { code, message: "Wrong email or password.", help: CREDENTIAL_HELP };
  }
  if (code === "auth/wrong-password" || code === "auth/user-not-found") {
    // Kept for older Firebase SDKs. Do not reveal whether the email exists.
    return { code, message: "Wrong email or password.", help: CREDENTIAL_HELP };
  }
  if (code.startsWith("auth/api-key-not-valid")) {
    const project = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
    const key = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
    const loaded = project
      ? `The app loaded project ${project}${key ? ` with a key beginning ${key.slice(0, 10)}…` : ""}. `
      : "";
    return {
      code,
      message: "Authentication service is being configured, please try in 2 minutes.",
      help:
        `${loaded}Google still rejected the key. In Firebase Console → Project settings → General, copy the current Web API Key into VITE_FIREBASE_API_KEY, then restart npm run dev. In Google Cloud Console, confirm that Identity Toolkit API is enabled and allowed by the key.`,
    };
  }
  if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
    return {
      code,
      message: "Email/password sign-in is not enabled for this project.",
      help: `Enable it in Firebase Console → Authentication → Sign-in method → Email/Password. Then add ${ADMIN_EMAIL} under Users.`,
    };
  }
  if (code === "auth/invalid-email") {
    return { code, message: "That email address is not valid." };
  }
  if (code === "auth/missing-password") {
    return { code, message: "Enter your password." };
  }
  if (code === "auth/too-many-requests") {
    return { code, message: "Too many attempts. Please wait a moment and try again." };
  }
  if (code === "auth/user-disabled") {
    return { code, message: "This account has been disabled. Contact the project owner." };
  }
  if (code === "auth/network-request-failed") {
    return { code, message: "Network error. Check your connection and try again." };
  }
  if (code === "auth/internal-error") {
    return {
      code,
      message: "Firebase could not complete the sign-in. Please try again.",
      help: "If this continues, confirm that Authentication and Firestore are enabled for the coomiac project.",
    };
  }

  return {
    code,
    message: "Sign-in could not be completed. Please try again.",
    help: code ? "Open the browser console for the technical error code." : undefined,
  };
}

export function authErrorMessage(error: unknown): string {
  return getAuthError(error).message;
}

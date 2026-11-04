export type AuthErrorInfo = {
  code: string;
  message: string;
  /** Optional setup hint shown only after a failed sign-in attempt. */
  help?: string;
};

type AuthLang = "en" | "fr";

const ADMIN_EMAIL = "coomiac@admin.com";

const CREDENTIAL_HELP: Record<AuthLang, string> = {
  en: "Please enter the correct Email or password",
  fr: "Veuillez saisir l'e-mail ou le mot de passe correct",
};

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
export function getAuthError(error: unknown, lang: AuthLang = "en"): AuthErrorInfo {
  const code = errorCode(error);
  const fr = lang === "fr";

  if (code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
    return {
      code,
      message: fr ? "E-mail ou mot de passe incorrect." : "Wrong email or password.",
      help: CREDENTIAL_HELP[lang],
    };
  }
  if (code === "auth/wrong-password" || code === "auth/user-not-found") {
    // Kept for older Firebase SDKs. Do not reveal whether the email exists.
    return {
      code,
      message: fr ? "E-mail ou mot de passe incorrect." : "Wrong email or password.",
      help: CREDENTIAL_HELP[lang],
    };
  }
  if (code.startsWith("auth/api-key-not-valid")) {
    const project = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
    const key = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
    const loaded = project
      ? fr
        ? `L'application a chargé le projet ${project}${key ? ` avec une clé commençant par ${key.slice(0, 10)}…` : ""}. `
        : `The app loaded project ${project}${key ? ` with a key beginning ${key.slice(0, 10)}…` : ""}. `
      : "";
    return {
      code,
      message: fr
        ? "Le service d'authentification est en cours de configuration. Réessayez dans 2 minutes."
        : "Authentication service is being configured, please try in 2 minutes.",
      help: fr
        ? `${loaded}Google a encore refusé la clé. Dans Firebase Console → Paramètres du projet → Général, copiez la clé Web API actuelle dans VITE_FIREBASE_API_KEY, puis redémarrez npm run dev. Dans Google Cloud Console, vérifiez que l'API Identity Toolkit est activée et autorisée par la clé.`
        : `${loaded}Google still rejected the key. In Firebase Console → Project settings → General, copy the current Web API Key into VITE_FIREBASE_API_KEY, then restart npm run dev. In Google Cloud Console, confirm that Identity Toolkit API is enabled and allowed by the key.`,
    };
  }
  if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
    return {
      code,
      message: fr
        ? "La connexion par e-mail/mot de passe n'est pas activée pour ce projet."
        : "Email/password sign-in is not enabled for this project.",
      help: fr
        ? `Activez-la dans Firebase Console → Authentication → Méthode de connexion → E-mail/Mot de passe. Ajoutez ensuite ${ADMIN_EMAIL} dans Users.`
        : `Enable it in Firebase Console → Authentication → Sign-in method → Email/Password. Then add ${ADMIN_EMAIL} under Users.`,
    };
  }
  if (code === "auth/invalid-email") {
    return { code, message: fr ? "Cette adresse e-mail n'est pas valide." : "That email address is not valid." };
  }
  if (code === "auth/missing-password") {
    return { code, message: fr ? "Saisissez votre mot de passe." : "Enter your password." };
  }
  if (code === "auth/too-many-requests") {
    return {
      code,
      message: fr
        ? "Trop de tentatives. Patientez un instant puis réessayez."
        : "Too many attempts. Please wait a moment and try again.",
    };
  }
  if (code === "auth/user-disabled") {
    return {
      code,
      message: fr
        ? "Ce compte a été désactivé. Contactez le propriétaire du projet."
        : "This account has been disabled. Contact the project owner.",
    };
  }
  if (code === "auth/network-request-failed") {
    return {
      code,
      message: fr
        ? "Erreur réseau. Vérifiez votre connexion puis réessayez."
        : "Network error. Check your connection and try again.",
    };
  }
  if (code === "auth/internal-error") {
    return {
      code,
      message: fr
        ? "Firebase n'a pas pu terminer la connexion. Réessayez."
        : "Firebase could not complete the sign-in. Please try again.",
      help: fr
        ? "Si le problème persiste, vérifiez que Authentication et Firestore sont activés pour le projet coomiac."
        : "If this continues, confirm that Authentication and Firestore are enabled for the coomiac project.",
    };
  }

  return {
    code,
    message: fr
      ? "La connexion n'a pas pu être terminée. Réessayez."
      : "Sign-in could not be completed. Please try again.",
    help: code
      ? fr
        ? "Ouvrez la console du navigateur pour obtenir le code d'erreur technique."
        : "Open the browser console for the technical error code."
      : undefined,
  };
}

export function authErrorMessage(error: unknown, lang: AuthLang = "en"): string {
  return getAuthError(error, lang).message;
}

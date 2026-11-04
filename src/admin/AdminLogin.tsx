import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "../lib/firebase";
import { getAuthError, type AuthErrorInfo } from "../lib/authError";
import { Arrow, AppButton } from "../components/ui";
import { AdminLangToggle, useAdminI18n } from "./i18n";

export default function AdminLogin({
  navigate,
  notice,
}: {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  notice?: string;
}) {
  const { lang, t } = useAdminI18n();
  const [error, setError] = useState<AuthErrorInfo | null>(notice ? { code: "notice", message: notice } : null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setError({
        code: "auth/not-initialized",
        message:
          lang === "fr"
            ? "L'authentification n'est pas initialisée. Vérifiez les variables d'environnement Firebase et redémarrez l'application."
            : "Authentication is not initialized. Check the Firebase environment variables and restart the app.",
      });
      return;
    }

    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, String(data.get("email") ?? "").trim(), String(data.get("password") ?? ""));
      navigate("/admin", { replace: true });
    } catch (signInError) {
      if (import.meta.env.DEV) console.error("[admin-login]", signInError);
      setError(getAuthError(signInError, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <button className="brand" onClick={() => navigate("/")} aria-label={t.login.backAria}>
        <span className="brand-mark"><span>CP</span></span>
        <span><b>COOMIAC</b><small>PROJET · ADMIN</small></span>
      </button>
      <AdminLangToggle className="login-lang-toggle" />

      {!isFirebaseConfigured ? (
        <div className="admin-panel admin-setup">
          <span className="eyebrow">{t.login.setupRequired}</span>
          <h1>{t.login.connectFirebase}</h1>
          <p>
            {t.login.setupPrefix} <code>.env</code> {t.login.setupOr} <code>.env.local</code>
            {t.login.setupSuffix}
          </p>
          <ul className="config-list">
            {missingFirebaseEnv.map((name) => <li key={name}><code>{name}</code></li>)}
          </ul>
          <p className="muted">
            {t.login.copyPrefix} <code>.env.example</code> {t.login.copyTo} <code>.env</code>{" "}
            {t.login.copySuffix}
          </p>
          <AppButton kind="outline" onClick={() => navigate("/")}>{t.common.backWebsite} <Arrow /></AppButton>
        </div>
      ) : (
        <form onSubmit={submit}>
          <span className="eyebrow">{t.login.protectedArea}</span>
          <h1>{t.login.signIn}</h1>
          <p>{t.login.signInBody}</p>
          <label>
            {t.common.email}
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t.login.emailPlaceholder}
            />
          </label>
          <label>
            {t.common.password}
            <input type="password" name="password" required autoComplete="current-password" placeholder={t.login.passwordPlaceholder} />
          </label>
          <AppButton type="submit" disabled={busy}>
            {busy ? <><span className="login-spinner" aria-hidden="true" /> {t.login.signingIn}</> : <>{t.login.signInButton} <Arrow /></>}
          </AppButton>
          {error && (
            <div className="login-alert" role="alert" aria-live="polite">
              <b>{error.message}</b>
              {error.help && <span>{error.help}</span>}
            </div>
          )}
          <small>{t.login.restrictedNote}</small>
        </form>
      )}
    </div>
  );
}

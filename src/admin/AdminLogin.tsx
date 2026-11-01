import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "../lib/firebase";
import { getAuthError, type AuthErrorInfo } from "../lib/authError";
import { Arrow, AppButton } from "../components/ui";

export default function AdminLogin({
  navigate,
  notice,
}: {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  notice?: string;
}) {
  const [error, setError] = useState<AuthErrorInfo | null>(notice ? { code: "notice", message: notice } : null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setError({
        code: "auth/not-initialized",
        message: "Authentication is not initialized. Check the Firebase environment variables and restart the app.",
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
      setError(getAuthError(signInError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <button className="brand" onClick={() => navigate("/")} aria-label="Back to COOMIAC PROJET">
        <span className="brand-mark"><span>CP</span></span>
        <span><b>COOMIAC</b><small>PROJET · ADMIN</small></span>
      </button>

      {!isFirebaseConfigured ? (
        <div className="admin-panel admin-setup">
          <span className="eyebrow">Setup required</span>
          <h1>Connect Firebase</h1>
          <p>
            The admin console is ready. Add the Firebase project keys to <code>.env</code> (or <code>.env.local</code>), restart the dev
            server, then reload this page.
          </p>
          <ul className="config-list">
            {missingFirebaseEnv.map((name) => <li key={name}><code>{name}</code></li>)}
          </ul>
          <p className="muted">
            Copy <code>.env.example</code> to <code>.env</code> and paste the values from your Firebase console
            (Project settings → Your apps).
          </p>
          <AppButton kind="outline" onClick={() => navigate("/")}>Back to website <Arrow /></AppButton>
        </div>
      ) : (
        <form onSubmit={submit}>
          <span className="eyebrow">Protected area</span>
          <h1>Admin sign in</h1>
          <p>Sign in with your COOMIAC PROJET administrator account.</p>
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="coomiac@admin.com"
            />
          </label>
          <label>
            Password
            <input type="password" name="password" required autoComplete="current-password" placeholder="Your password" />
          </label>
          <AppButton type="submit" disabled={busy}>
            {busy ? <><span className="login-spinner" aria-hidden="true" /> Signing in…</> : <>Sign in <Arrow /></>}
          </AppButton>
          {error && (
            <div className="login-alert" role="alert" aria-live="polite">
              <b>{error.message}</b>
              {error.help && <span>{error.help}</span>}
            </div>
          )}
          <small>Access is restricted to authorized COOMIAC PROJET staff.</small>
        </form>
      )}
    </div>
  );
}

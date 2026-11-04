import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import { authErrorMessage } from "../lib/authError";
import { AppButton } from "../components/ui";
import { errorDetail, errorMessage } from "./utils";
import AdminLogin from "./AdminLogin";
import OverviewAdmin from "./OverviewAdmin";
import ProductsAdmin from "./ProductsAdmin";
import GalleryAdmin from "./GalleryAdmin";
import InboxAdmin from "./InboxAdmin";
import { AdminLangProvider, AdminLangToggle, useAdminI18n } from "./i18n";

type AdminPage = "overview" | "products" | "gallery" | "inbox";

const navigation: { page: AdminPage; path: string; label: "overview" | "messages" | "products" | "gallery" }[] = [
  { page: "overview", path: "/admin", label: "overview" },
  { page: "inbox", path: "/admin/messages", label: "messages" },
  { page: "products", path: "/admin/products", label: "products" },
  { page: "gallery", path: "/admin/photo-gallery", label: "gallery" },
];

function routeFor(path: string): AdminPage {
  if (path === "/admin/products") return "products";
  if (path === "/admin/photo-gallery") return "gallery";
  // Older bookmarks pointed at the former translation screen.
  if (path === "/admin/messages" || path === "/admin/translations") return "inbox";
  return "overview";
}

type AdminAppProps = {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
};

export default function AdminApp(props: AdminAppProps) {
  return (
    <AdminLangProvider>
      <AdminAppContent {...props} />
    </AdminLangProvider>
  );
}

function AdminAppContent({ path, navigate, dark, setDark }: AdminAppProps) {
  const { lang, t } = useAdminI18n();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authError, setAuthError] = useState("");
  const [access, setAccess] = useState<"checking" | "granted" | "denied" | "error">("checking");
  const [accessError, setAccessError] = useState("");
  const [accessErrorDetail, setAccessErrorDetail] = useState("");
  const page = routeFor(path);
  const isLoginPath = path === "/admin/login" || path === "/admin/login/";

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(
      auth,
      (next) => setUser(next),
      (error) => {
        setAuthError(authErrorMessage(error, lang));
        setUser(null);
      },
    );
  }, [lang]);

  // Firestore is the source of truth for admin access. A Firebase account alone
  // is not enough: the seed script adds /admins/{uid}.
  useEffect(() => {
    if (!user || !db) {
      setAccess("checking");
      return;
    }
    let alive = true;
    setAccess("checking");
    setAccessError("");
    setAccessErrorDetail("");
    getDoc(doc(db, "admins", user.uid))
      .then((snapshot) => {
        if (!alive) return;
        setAccess(snapshot.exists() ? "granted" : "denied");
      })
      .catch((error) => {
        if (!alive) return;
        setAccess("error");
        setAccessError(errorMessage(error, lang));
        setAccessErrorDetail(errorDetail(error));
      });
    return () => {
      alive = false;
    };
  }, [user, lang]);

  useEffect(() => {
    document.title = user
      ? `${t.headings[page].title} · ${t.shell.adminSuffix}`
      : `${t.login.signIn} · COOMIAC PROJET`;
    document.documentElement.lang = lang;
  }, [page, user, lang, t]);

  useEffect(() => {
    if (user && isLoginPath) navigate("/admin", { replace: true });
  }, [user, isLoginPath, navigate]);

  // Any /admin/* URL except the sign-in page is private. Send signed-out
  // visitors to the login screen instead of rendering a protected shell.
  useEffect(() => {
    if (user === null && !isLoginPath) navigate("/admin/login", { replace: true });
  }, [user, isLoginPath, navigate]);

  const signOutAdmin = async () => {
    if (auth) await signOut(auth);
    navigate("/admin/login", { replace: true });
  };

  if (!isFirebaseConfigured) {
    return <AdminLogin navigate={navigate} />;
  }

  if (user === undefined) {
    return (
      <div className="admin-loading">
        <span className="eyebrow">COOMIAC PROJET</span>
        <p>{t.shell.loadingWorkspace}</p>
      </div>
    );
  }

  if (!user) {
    if (!isLoginPath) {
      return (
        <div className="admin-loading">
          <span className="eyebrow">COOMIAC PROJET</span>
          <p>{t.shell.redirecting}</p>
        </div>
      );
    }
    return <AdminLogin navigate={navigate} notice={authError} />;
  }

  if (access === "checking") {
    return (
      <div className="admin-loading">
        <span className="eyebrow">COOMIAC PROJET</span>
        <p>{t.shell.checkingAccess}</p>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="admin-login">
        <div className="admin-panel admin-setup">
          <span className="eyebrow">{t.access.restricted}</span>
          <h1>{t.access.notAuthorized}</h1>
          <p>
            <b>{user.email}</b> {t.access.notAuthorizedSuffix}
          </p>
          <div className="admin-help">
            <p><b>{t.access.manualAction}</b></p>
            <ol>
              <li>{t.access.stepOpen}</li>
              <li>
                {t.access.stepCreatePrefix} <code>{t.access.stepCreateCollection}</code>
                {t.access.stepCreateSuffix}
              </li>
              <li>
                {t.access.stepIdPrefix} <code>{user.uid}</code>.
              </li>
              <li>
                {t.access.stepEmailPrefix} <code>{t.access.stepEmailField}</code>{" "}
                {t.access.stepEmailSuffix} <code>{user.email}</code>.
              </li>
            </ol>
            <p>
              {t.access.seedPrefix} <code>npm run seed:admin</code> {t.access.seedMiddle}{" "}
              <code>firestore.rules</code> {t.access.seedSuffix}
            </p>
          </div>
          <div className="admin-actions">
            <AppButton kind="outline" onClick={() => void signOutAdmin()}>{t.common.signOut}</AppButton>
            <AppButton kind="ghost" onClick={() => navigate("/")}>{t.common.backWebsite}</AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (access === "error") {
    return (
      <div className="admin-login">
        <div className="admin-panel admin-setup">
          <span className="eyebrow">{t.access.connectionProblem}</span>
          <h1>{t.access.cannotVerify}</h1>
          <p>{accessError}</p>
          <div className="admin-help">
            <p>{t.access.checkItems}</p>
            <ul>
              <li><b>{t.access.firestoreDatabase}</b> {t.access.firestoreDbSuffix}</li>
              <li><code>{t.access.rules}</code> {t.access.rulesSuffix}</li>
              <li>
                {t.access.accountDocPrefix} <code>admins/{user.uid}</code>
                {t.access.accountDocSuffix}
              </li>
            </ul>
          </div>
          <details className="error-details">
            <summary>{t.common.technicalDetails}</summary>
            <code>{accessErrorDetail}</code>
          </details>
          <div className="admin-actions">
            <AppButton onClick={() => window.location.reload()}>{t.common.retry}</AppButton>
            <AppButton kind="outline" onClick={() => void signOutAdmin()}>{t.common.signOut}</AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside>
        <button className="brand" onClick={() => navigate("/")} aria-label={t.shell.backPublic}>
          <span className="brand-mark"><span>CP</span></span>
          <span><b>COOMIAC</b><small>PROJET · ADMIN</small></span>
        </button>

        <nav aria-label={t.nav.label}>
          {navigation.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              {t.nav[item.label]}
            </button>
          ))}
        </nav>

        <div className="admin-account">
          <small>{user.email ?? t.common.signedIn}</small>
          <button className="logout" onClick={() => void signOutAdmin()}>{t.common.signOut}</button>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <span className="eyebrow">{t.shell.workspace}</span>
            <h1>{t.headings[page].title}</h1>
            <p className="muted">{t.headings[page].subtitle}</p>
          </div>
          <div className="admin-header-actions">
            <AdminLangToggle />
            <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label={t.shell.toggleDark}>
              {dark ? t.common.light : t.common.dark}
            </button>
            <AppButton kind="outline" small onClick={() => navigate("/")}>{t.common.viewSite}</AppButton>
          </div>
        </header>

        {page === "overview" && <OverviewAdmin navigate={navigate} />}
        {page === "inbox" && <InboxAdmin />}
        {page === "products" && <ProductsAdmin />}
        {page === "gallery" && <GalleryAdmin />}
      </main>
    </div>
  );
}

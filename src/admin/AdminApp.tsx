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
import TranslationAdmin from "./TranslationAdmin";

type AdminPage = "overview" | "products" | "gallery" | "translation";

const navigation: { page: AdminPage; path: string; label: string }[] = [
  { page: "overview", path: "/admin", label: "Overview" },
  { page: "products", path: "/admin/products", label: "Products" },
  { page: "gallery", path: "/admin/photo-gallery", label: "Photo gallery" },
  { page: "translation", path: "/admin/translations", label: "Translation" },
];

const headings: Record<AdminPage, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your catalogue, gallery and incoming inquiries at a glance." },
  products: { title: "Products", subtitle: "Publish and translate the gold products shown on the public site." },
  gallery: { title: "Photo gallery", subtitle: "Manage the photographs displayed in the public gallery." },
  translation: { title: "Translation", subtitle: "English to French service status and automatic translation rules." },
};

function routeFor(path: string): AdminPage {
  if (path === "/admin/products") return "products";
  if (path === "/admin/photo-gallery") return "gallery";
  if (path === "/admin/translations") return "translation";
  return "overview";
}

export default function AdminApp({
  path,
  navigate,
  dark,
  setDark,
}: {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
}) {
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
        setAuthError(authErrorMessage(error));
        setUser(null);
      },
    );
  }, []);

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
        setAccessError(errorMessage(error));
        setAccessErrorDetail(errorDetail(error));
      });
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    document.title = user ? `${headings[page].title} · COOMIAC Admin` : "Admin sign in · COOMIAC PROJET";
  }, [page, user]);

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
        <p>Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    if (!isLoginPath) {
      return (
        <div className="admin-loading">
          <span className="eyebrow">COOMIAC PROJET</span>
          <p>Redirecting to sign in…</p>
        </div>
      );
    }
    return <AdminLogin navigate={navigate} notice={authError} />;
  }

  if (access === "checking") {
    return (
      <div className="admin-loading">
        <span className="eyebrow">COOMIAC PROJET</span>
        <p>Checking access…</p>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="admin-login">
        <div className="admin-panel admin-setup">
          <span className="eyebrow">Restricted area</span>
          <h1>Account not authorized</h1>
          <p>
            <b>{user.email}</b> is signed in, but there is no administrator document for this account.
          </p>
          <div className="admin-help">
            <p><b>MANUAL ACTION REQUIRED</b></p>
            <ol>
              <li>Open Firebase Console → Firestore Database.</li>
              <li>Create or open the <code>admins</code> collection.</li>
              <li>Add a document whose ID is exactly <code>{user.uid}</code>.</li>
              <li>Add an <code>email</code> field containing <code>{user.email}</code>.</li>
            </ol>
            <p>
              Or run <code>npm run seed:admin</code> with a service account. The published{" "}
              <code>firestore.rules</code> then allow this account into the console.
            </p>
          </div>
          <div className="admin-actions">
            <AppButton kind="outline" onClick={() => void signOutAdmin()}>Sign out</AppButton>
            <AppButton kind="ghost" onClick={() => navigate("/")}>Back to website</AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (access === "error") {
    return (
      <div className="admin-login">
        <div className="admin-panel admin-setup">
          <span className="eyebrow">Connection problem</span>
          <h1>Could not verify access</h1>
          <p>{errorMessage(accessError)}</p>
          <div className="admin-help">
            <p>Check these Firebase Console items, then retry:</p>
            <ul>
              <li><b>Firestore Database</b> is created for the project.</li>
              <li><code>firestore.rules</code> is published.</li>
              <li>Your account has an <code>admins/{user.uid}</code> document.</li>
            </ul>
          </div>
          <details className="error-details">
            <summary>Technical details</summary>
            <code>{accessErrorDetail}</code>
          </details>
          <div className="admin-actions">
            <AppButton onClick={() => window.location.reload()}>Retry</AppButton>
            <AppButton kind="outline" onClick={() => void signOutAdmin()}>Sign out</AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside>
        <button className="brand" onClick={() => navigate("/")} aria-label="Back to the public website">
          <span className="brand-mark"><span>CP</span></span>
          <span><b>COOMIAC</b><small>PROJET · ADMIN</small></span>
        </button>

        <nav aria-label="Admin sections">
          {navigation.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-account">
          <small>{user.email ?? "Signed in"}</small>
          <button className="logout" onClick={() => void signOutAdmin()}>Sign out</button>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>{headings[page].title}</h1>
            <p className="muted">{headings[page].subtitle}</p>
          </div>
          <div className="admin-header-actions">
            <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
              {dark ? "Light" : "Dark"}
            </button>
            <AppButton kind="outline" small onClick={() => navigate("/")}>View site</AppButton>
          </div>
        </header>

        {page === "overview" && <OverviewAdmin />}
        {page === "products" && <ProductsAdmin />}
        {page === "gallery" && <GalleryAdmin />}
        {page === "translation" && <TranslationAdmin />}
      </main>
    </div>
  );
}

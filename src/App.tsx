import { FormEvent, lazy, Suspense, useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png";
import logoLight from "./assets/logo-light.png";
import { photos } from "./assets/photos";
import { Arrow, AppButton } from "./components/ui";
import { photoCredits } from "./assets/photoCredits";
import { createInquiry } from "./lib/data";
import { useGallery, useProducts, useSiteSettings } from "./lib/hooks";
import {
  categoryLabel,
  galleryCaption,
  productDescription,
  productSpec,
  productTitle,
  whatsappLink,
  type GalleryItem,
  type InquiryType,
  type Lang,
  type Product,
  type SiteSettings,
} from "./lib/models";

const AdminApp = lazy(() => import("./admin/AdminApp"));

type Page =
  | "home"
  | "about"
  | "products"
  | "gallery"
  | "certifications"
  | "sourcing"
  | "buy"
  | "faqs"
  | "contact";

const pages: Page[] = ["home", "about", "products", "gallery", "certifications", "sourcing", "buy", "faqs", "contact"];

/** Reads the current URL without trailing slashes, so direct links never crash the app. */
function readPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function toPage(path: string): Page {
  const slug = path.replace(/^\/+/, "").toLowerCase();
  return pages.includes(slug as Page) ? (slug as Page) : "home";
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

/** Storage can be unavailable in private/embedded contexts, so never let it crash the app. */
function readStored(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function readDarkPreference(): boolean {
  return readStored("theme") !== "light";
}

function readLangPreference(): Lang {
  const stored = readStored("lang");
  if (stored === "en" || stored === "fr") return stored;
  const browser = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  return browser.startsWith("fr") ? "fr" : "en";
}

const pageCopy: Record<Exclude<Page, "home">, { en: [string, string]; fr: [string, string] }> = {
  about: {
    en: [
      "Rooted in Walikale. Built for international trade.",
      "COOMIAC PROJET is a cooperative based in Walikale, North Kivu, bringing responsibly sourced coltan, cassiterite, copper, cobalt and gold to qualified buyers around the world.",
    ],
    fr: [
      "Ancrée à Walikale. Bâtie pour le commerce international.",
      "COOMIAC PROJET est une coopérative basée à Walikale, au Nord-Kivu, qui rapproche le coltan, la cassitérite, le cuivre, le cobalt et l'or — issus d'un approvisionnement responsable — des acheteurs qualifiés du monde entier.",
    ],
  },
  products: {
    en: [
      "Five minerals. One trusted source.",
      "Explore the minerals we prepare for qualified buyers. Contact our team for current availability, assays, volumes and pricing.",
    ],
    fr: [
      "Cinq minéraux. Une source de confiance.",
      "Découvrez les minéraux que nous préparons pour des acheteurs qualifiés. Contactez notre équipe pour la disponibilité actuelle, les analyses, les volumes et les prix.",
    ],
  },
  gallery: {
    en: [
      "Inside the operation",
      "A rare view of Walikale, the workings and the people behind our supply chain.",
    ],
    fr: [
      "Au cœur des opérations",
      "Un regard rare sur Walikale, les sites d'exploitation et les femmes et les hommes derrière notre chaîne d'approvisionnement.",
    ],
  },
  certifications: {
    en: [
      "Evidence before promises.",
      "Trust is built on evidence. Our registration, licences, assay and export file is shared with qualified buyers.",
    ],
    fr: [
      "Des preuves avant les promesses.",
      "La confiance repose sur des preuves. Notre dossier d'enregistrement, de licences, d'analyses et d'exportation est partagé avec les acheteurs qualifiés.",
    ],
  },
  sourcing: {
    en: [
      "Responsible sourcing, made tangible.",
      "A working commitment to traceability, due diligence, respect for communities and continuous improvement.",
    ],
    fr: [
      "Un approvisionnement responsable, concret.",
      "Un engagement opérationnel pour la traçabilité, le devoir de diligence, le respect des communautés et l'amélioration continue.",
    ],
  },
  buy: {
    en: [
      "A clear path to qualified trade",
      "Every inquiry follows a structured review before commercial terms are confirmed.",
    ],
    fr: [
      "Un parcours clair vers un commerce qualifié",
      "Chaque demande suit un examen structuré avant la confirmation des conditions commerciales.",
    ],
  },
  faqs: {
    en: [
      "Frequently asked questions",
      "Direct answers for buyers, refiners and responsible sourcing partners.",
    ],
    fr: [
      "Questions fréquentes",
      "Des réponses directes pour les acheteurs, les affineurs et les partenaires d'approvisionnement responsable.",
    ],
  },
  contact: {
    en: [
      "Start a qualified conversation",
      "Tell us which mineral you need, your volume, destination and compliance requirements.",
    ],
    fr: [
      "Commençons un échange qualifié",
      "Présentez-nous le minéral recherché, votre volume, la destination et vos exigences de conformité.",
    ],
  },
};

const faqs = [
  {
    en: [
      "Which minerals do you supply?",
      "We supply coltan (tantalum), cassiterite (tin), copper, cobalt and gold from eastern DR Congo. Availability, grades and volumes are confirmed per lot.",
    ],
    fr: [
      "Quels minéraux fournissez-vous ?",
      "Nous fournissons du coltan (tantale), de la cassitérite (étain), du cuivre, du cobalt et de l'or de l'est de la RD Congo. La disponibilité, les teneurs et les volumes sont confirmés par lot.",
    ],
  },
  {
    en: [
      "Can you confirm grades and quantities?",
      "Yes. Share your specifications and our team will confirm the available lot, its assay results, packaging and volume for your inquiry.",
    ],
    fr: [
      "Pouvez-vous confirmer les teneurs et les quantités ?",
      "Oui. Partagez vos spécifications et notre équipe confirmera le lot disponible, ses analyses, son conditionnement et son volume.",
    ],
  },
  {
    en: [
      "What documents can buyers review?",
      "Cooperative registration, operating licences, lot assay reports and export documentation are available to qualified buyers on request.",
    ],
    fr: [
      "Quels documents les acheteurs peuvent-ils consulter ?",
      "L'enregistrement de la coopérative, les licences d'exploitation, les rapports d'analyse des lots et les documents d'exportation sont disponibles sur demande pour les acheteurs qualifiés.",
    ],
  },
  {
    en: [
      "How does buyer onboarding work?",
      "We review your organization, intended use, destination, compliance profile and commercial requirements before proceeding.",
    ],
    fr: [
      "Comment se déroule l'intégration d'un acheteur ?",
      "Nous examinons votre organisation, l'usage prévu, la destination, le profil de conformité et les besoins commerciaux avant de poursuivre.",
    ],
  },
  {
    en: [
      "Where are the products prepared?",
      "Lots are assembled and prepared in North Kivu. Export routing, Incoterms and inspection arrangements are agreed for each transaction.",
    ],
    fr: [
      "Où les produits sont-ils préparés ?",
      "Les lots sont assemblés et préparés au Nord-Kivu. L'acheminement à l'exportation, les Incoterms et les modalités d'inspection sont définis pour chaque transaction.",
    ],
  },
];

const copy = {
  en: {
    home: "Home",
    about: "About",
    products: "Minerals",
    gallery: "Gallery",
    certifications: "Certifications",
    sourcing: "Responsible sourcing",
    buy: "How to buy",
    faqs: "FAQs",
    contact: "Contact",
    admin: "Admin",
  },
  fr: {
    home: "Accueil",
    about: "À propos",
    products: "Minéraux",
    gallery: "Galerie",
    certifications: "Certifications",
    sourcing: "Approvisionnement responsable",
    buy: "Comment acheter",
    faqs: "FAQ",
    contact: "Contact",
    admin: "Admin",
  },
};

/* ---------------------------------- icons ---------------------------------- */

function Icon({ name }: { name: "mail" | "phone" | "pin" | "whatsapp" | "check" | "close" | "chevron" }) {
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.45 0 .08 5.37.08 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a11.9 11.9 0 0 0 5.82 1.48h.01c6.59 0 11.96-5.37 11.96-11.96 0-3.2-1.25-6.21-3.49-8.41ZM12.05 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.69.97.99-3.6-.23-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.89-9.9 9.89Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z" />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2.5" y="4.5" width="19" height="15" rx="1" />
        <path d="m3 6 9 7 9-7" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4.5 3h3l1.7 4.3-2.1 1.6a12.5 12.5 0 0 0 6 6l1.6-2.1L19 14.5v3a3 3 0 0 1-3.2 3A15.5 15.5 0 0 1 1.5 6.2 3 3 0 0 1 4.5 3Z" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m4 12.5 5 5 11-11" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M5 5l14 14M19 5 5 19" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/* ------------------------------- small pieces ------------------------------ */

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion${open ? " is-open" : ""}`}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <b aria-hidden="true">{open ? "−" : "+"}</b>
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/* ---------------------------------- app ------------------------------------ */

function App() {
  const [path, setPath] = useState<string>(readPath);
  const [dark, setDark] = useState<boolean>(readDarkPreference);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#11110f" : "#f5f3ed");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* storage blocked — theme still applies for this visit */
    }
  }, [dark]);

  useEffect(() => {
    const handle = () => setPath(readPath());
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  const navigate = (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    setPath(readPath());
  };

  if (isAdminPath(path)) {
    return (
      <Suspense
        fallback={
          <div className="admin-loading">
            <span className="eyebrow">COOMIAC PROJET</span>
            <p>Loading secure workspace…</p>
          </div>
        }
      >
        <AdminApp path={path} navigate={navigate} dark={dark} setDark={setDark} />
      </Suspense>
    );
  }

  return <PublicSite path={path} navigate={navigate} dark={dark} setDark={setDark} />;
}

function PublicSite({
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
  const [lang, setLang] = useState<Lang>(readLangPreference);
  const [menu, setMenu] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const settings = useSiteSettings();
  const { products } = useProducts();
  const { gallery } = useGallery();
  const t = copy[lang];
  const page = toPage(path);
  const en = lang === "en";

  useBodyLock(menu || Boolean(selected));

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* storage blocked */
    }
  }, [lang]);

  useEffect(() => {
    document.title =
      page === "home"
        ? en
          ? "COOMIAC PROJET — Minerals from Walikale, DR Congo"
          : "COOMIAC PROJET — Minéraux de Walikale, RDC"
        : `${pageCopy[page][lang][0]} · COOMIAC PROJET`;
  }, [page, lang, en]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const navigatePage = (next: Page, anchor?: string) => {
    navigate(next === "home" ? "/" : `/${next}`);
    setMenu(false);
    setTimeout(
      () =>
        anchor
          ? document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" })
          : window.scrollTo({ top: 0, behavior: "auto" }),
      0,
    );
  };

  const requestQuote = (name: string) => {
    setQuoteProduct(name);
    navigatePage("contact", "inquiry");
  };

  const openProduct = (product: Product) => {
    setSelected(product);
  };

  const nav: Page[] = ["home", "about", "products", "certifications", "sourcing", "buy", "faqs", "contact"];
  const whatsapp = whatsappLink(
    settings,
    en
      ? "Hello COOMIAC PROJET, I would like to discuss your minerals and current availability."
      : "Bonjour COOMIAC PROJET, je souhaite discuter de vos minéraux et de la disponibilité actuelle.",
  );
  const phoneHref = `tel:${settings.phone.replace(/[^\d+]/g, "")}`;

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="header">
        <button className="brand" onClick={() => navigatePage("home")} aria-label="COOMIAC PROJET home">
          <img
            className="brand-logo"
            src={dark ? logoLight : logo}
            alt="COOMIAC PROJET Walikale"
            width="150"
            height="81"
            decoding="async"
          />
        </button>

        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation" id="site-nav">
          <div className="nav-head">
            <span className="eyebrow">COOMIAC PROJET</span>
            <button className="nav-close" onClick={() => setMenu(false)} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
          {nav.map((item, index) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              aria-current={page === item ? "page" : undefined}
              onClick={() => navigatePage(item)}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <span>{t[item]}</span>
            </button>
          ))}
          <div className="nav-contact">
            <a href={`mailto:${settings.email}`}><Icon name="mail" /> {settings.email}</a>
            <a href={phoneHref}><Icon name="phone" /> {settings.phone}</a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
              <Icon name="whatsapp" /> WhatsApp
            </a>
          </div>
        </nav>

        <div className="header-actions">
          <button
            className="utility"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label={en ? "Passer en français" : "Switch to English"}
            title={en ? "Passer en français" : "Switch to English"}
          >
            {en ? "FR" : "EN"}
          </button>
          <button
            className="utility theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? "☼" : "◐"}
          </button>
          <a className="header-cta" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" />
            <span>{en ? "WhatsApp" : "WhatsApp"}</span>
          </a>
          <button
            className="menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="site-nav"
          >
            <span className={menu ? "burger open" : "burger"} aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>

      <div className={menu ? "nav-scrim open" : "nav-scrim"} onClick={() => setMenu(false)} aria-hidden="true" />

      <main id="main" key={page}>
        {page !== "home" && <GenericHero page={page} lang={lang} />}
        {page === "home" && (
          <Home
            lang={lang}
            navigate={navigatePage}
            products={products}
            gallery={gallery}
            openProduct={openProduct}
            requestQuote={requestQuote}
            settings={settings}
          />
        )}
        {page === "about" && <About lang={lang} navigate={navigatePage} />}
        {page === "products" && (
          <Products lang={lang} products={products} openProduct={openProduct} requestQuote={requestQuote} settings={settings} />
        )}
        {page === "gallery" && <GalleryPage lang={lang} navigate={navigatePage} gallery={gallery} />}
        {page === "certifications" && <Certifications lang={lang} navigate={navigatePage} />}
        {page === "sourcing" && <Sourcing lang={lang} />}
        {page === "buy" && <Buy lang={lang} navigate={navigatePage} />}
        {page === "faqs" && <Faqs lang={lang} />}
        {page === "contact" && (
          <Contact lang={lang} prefill={quoteProduct} settings={settings} products={products} />
        )}
      </main>

      {whatsapp && (
        <a
          className="whatsapp-float"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={en ? "Chat with us on WhatsApp" : "Discuter avec nous sur WhatsApp"}
        >
          <Icon name="whatsapp" />
          <span className="whatsapp-label">{en ? "Chat with us" : "Écrivez-nous"}</span>
        </a>
      )}

      <Footer lang={lang} navigate={navigate} settings={settings} />

      {selected && (
        <ProductDialog
          product={selected}
          lang={lang}
          settings={settings}
          onClose={() => setSelected(null)}
          onQuote={(name) => {
            setSelected(null);
            requestQuote(name);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------- home ----------------------------------- */

function Home({
  lang,
  navigate,
  products,
  gallery,
  openProduct,
  requestQuote,
  settings,
}: {
  lang: Lang;
  navigate: (page: Page, anchor?: string) => void;
  products: Product[];
  gallery: GalleryItem[];
  openProduct: (product: Product) => void;
  requestQuote: (name: string) => void;
  settings: SiteSettings;
}) {
  const en = lang === "en";
  const heroWhatsapp = whatsappLink(
    settings,
    en
      ? "Hello COOMIAC PROJET, I would like to know more about your minerals and current opportunities."
      : "Bonjour COOMIAC PROJET, je souhaite en savoir plus sur vos minéraux et les opportunités actuelles.",
  );

  return (
    <>
      <section className="hero">
        <img className="hero-media" src={photos.walikale} alt="" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <span className="eyebrow">{en ? "Walikale · North Kivu · DR Congo" : "Walikale · Nord-Kivu · RD Congo"}</span>
          <h1>{en ? "The Congo's minerals, prepared for the world." : "Les minéraux du Congo, préparés pour le monde."}</h1>
          <p>
            {en
              ? "Five minerals. One cooperative source. Traceable, documented and prepared with care for buyers who expect precision."
              : "Cinq minéraux. Une source coopérative. Traçables, documentés et préparés avec soin pour des acheteurs qui exigent la précision."}
          </p>
          <div className="button-row">
            <AppButton onClick={() => navigate("products")}>
              {en ? "Explore the minerals" : "Découvrir les minéraux"} <Arrow />
            </AppButton>
            <AppButton kind="outline" onClick={() => navigate("contact")}>
              {en ? "Talk to our team" : "Parler à notre équipe"}
            </AppButton>
          </div>
          <ul className="hero-stats">
            <li><strong>05</strong><span>{en ? "minerals" : "minéraux"}</span></li>
            <li><strong>Walikale</strong><span>{en ? "North Kivu · DRC" : "Nord-Kivu · RDC"}</span></li>
            <li><strong>{en ? "Traceable" : "Traçable"}</strong><span>{en ? "documents on request" : "documents sur demande"}</span></li>
          </ul>
        </div>
        {heroWhatsapp && (
          <a className="hero-contact" href={heroWhatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" />
            <span>{en ? "Direct line to Walikale" : "Ligne directe vers Walikale"}</span>
          </a>
        )}
      </section>

      <div className="mineral-strip" aria-label={en ? "Our minerals" : "Nos minéraux"}>
        {products.map((product) => (
          <button key={product.id} onClick={() => openProduct(product)}>
            <span>{productTitle(product, lang)}</span>
            <small>{productSpec(product, lang).split("·")[0]?.trim() || categoryLabel(product.category, lang)}</small>
          </button>
        ))}
      </div>

      <section className="intro split">
        <SectionTitle
          eyebrow={en ? "Our cooperative" : "Notre coopérative"}
          title={en ? "Local value. International discipline." : "Valeur locale. Rigueur internationale."}
        />
        <div>
          <p className="lead">
            {en
              ? "We connect the minerals of eastern DR Congo with the standards of international trade — from the first conversation to the final export file."
              : "Nous relions les minéraux de l'est de la RD Congo aux standards du commerce international — de la première conversation au dossier d'exportation final."}
          </p>
          <p>
            {en
              ? "Our team works hand in hand with producers in Walikale, pairing deep local knowledge with the documentation, discretion and delivery discipline that serious buyers expect."
              : "Notre équipe travaille main dans la main avec les producteurs de Walikale, alliant une connaissance profonde du terrain à la rigueur documentaire, à la discrétion et à la discipline logistique attendues par les acheteurs sérieux."}
          </p>
          <ul className="tick-list">
            <li><Icon name="check" /> {en ? "Direct from the cooperative" : "Directement de la coopérative"}</li>
            <li><Icon name="check" /> {en ? "Bilingual team, EN / FR" : "Équipe bilingue, EN / FR"}</li>
            <li><Icon name="check" /> {en ? "Lot-level assay and origin file" : "Analyses et origine par lot"}</li>
          </ul>
          <button className="text-link" onClick={() => navigate("about")}>
            {en ? "Discover our approach" : "Découvrir notre approche"} <Arrow />
          </button>
        </div>
      </section>

      <section className="feature">
        <div className="feature-media">
          <img src={photos.coltanMine} alt={en ? "Coltan workings in North Kivu" : "Exploitation de coltan au Nord-Kivu"} loading="lazy" />
        </div>
        <div className="feature-content">
          <span className="eyebrow">{en ? "Why COOMIAC PROJET" : "Pourquoi COOMIAC PROJET"}</span>
          <h2>{en ? "One accountable partner, from pit to port." : "Un partenaire responsable, de la fosse au port."}</h2>
          <p>
            {en
              ? "Sourcing, sorting, documentation and logistics coordination under one roof — so you deal with one team instead of a chain of intermediaries."
              : "Approvisionnement, tri, documentation et coordination logistique sous un même toit — vous traitez avec une seule équipe plutôt qu'avec une chaîne d'intermédiaires."}
          </p>
          <ol className="feature-steps">
            <li><b>01</b><div><strong>{en ? "Sourcing" : "Approvisionnement"}</strong><span>{en ? "Working relationships across the Walikale belt." : "Relations de travail dans toute la ceinture de Walikale."}</span></div></li>
            <li><b>02</b><div><strong>{en ? "Preparation" : "Préparation"}</strong><span>{en ? "Sorting, bagging and lot assembly with photo records." : "Tri, conditionnement et constitution des lots avec photos."}</span></div></li>
            <li><b>03</b><div><strong>{en ? "Documentation" : "Documentation"}</strong><span>{en ? "Assays, origin, licences and export paperwork." : "Analyses, origine, licences et documents d'exportation."}</span></div></li>
          </ol>
          <AppButton onClick={() => requestQuote(products[0] ? productTitle(products[0], lang) : "Coltan")}>
            {en ? "Request current availability" : "Demander la disponibilité"} <Arrow />
          </AppButton>
        </div>
      </section>

      <section className="home-minerals">
        <div className="section-head">
          <SectionTitle
            eyebrow={en ? "The portfolio" : "Le portefeuille"}
            title={en ? "Five minerals, handled with precision." : "Cinq minéraux, traités avec précision."}
            text={
              en
                ? "Tap a mineral to see its documentation and request a quote."
                : "Touchez un minéral pour découvrir sa documentation et demander un devis."
            }
          />
          <button className="text-link" onClick={() => navigate("products")}>
            {en ? "All minerals" : "Tous les minéraux"} <Arrow />
          </button>
        </div>
        <div className="mineral-rail">
          {products.map((product) => (
            <button className="rail-card" key={product.id} onClick={() => openProduct(product)}>
              <span className="rail-media">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={productTitle(product, lang)} loading="lazy" decoding="async" />
                ) : (
                  <span className="photo-placeholder">{productTitle(product, lang)}</span>
                )}
              </span>
              <span className="rail-body">
                <small>{categoryLabel(product.category, lang)}</small>
                <strong>{productTitle(product, lang)}</strong>
                <em>{productSpec(product, lang)}</em>
                <span className="rail-link">{en ? "View details" : "Voir les détails"} <Arrow /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <Metrics lang={lang} />

      <section className="home-trust">
        <SectionTitle
          eyebrow={en ? "Built for trust" : "Fondé sur la confiance"}
          title={en ? "Assurance, at every step." : "La confiance, à chaque étape."}
          text={
            en
              ? "A disciplined framework for provenance, documentation and long-term partnership."
              : "Un cadre rigoureux pour la provenance, la documentation et le partenariat durable."
          }
        />
        <div className="three-grid">
          {[
            [
              en ? "Responsible sourcing" : "Approvisionnement responsable",
              en ? "Traceability and due diligence guide every step, from pit to export." : "La traçabilité et la diligence guident chaque étape, de l'extraction à l'exportation.",
              "sourcing" as Page,
            ],
            [
              en ? "Verified documents" : "Documents vérifiés",
              en ? "Registration, licences, assays and export records available on request." : "Enregistrement, licences, analyses et documents d'exportation disponibles sur demande.",
              "certifications" as Page,
            ],
            [
              en ? "Structured buying" : "Achat structuré",
              en ? "Qualification, verification, terms — then execution." : "Qualification, vérification, conditions — puis exécution.",
              "buy" as Page,
            ],
          ].map((item, index) => (
            <article className="trust-card" key={String(item[0])}>
              <span>0{index + 1}</span>
              <h3>{item[0]}</h3>
              <p>{item[1]}</p>
              <button className="circle-link" onClick={() => navigate(item[2] as Page)} aria-label={`Open ${item[0]}`}>
                <Arrow />
              </button>
            </article>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="home-gallery">
          <div className="section-head">
            <SectionTitle
              eyebrow={en ? "Gallery" : "Galerie"}
              title={en ? "A rare view of the work behind the minerals." : "Un regard rare sur le travail derrière les minéraux."}
              text={en ? "From the sites of Walikale to the people who make responsible sourcing possible." : "Des sites de Walikale aux femmes et aux hommes qui rendent l'approvisionnement responsable possible."}
            />
            <button className="text-link" onClick={() => navigate("gallery")}>
              {en ? "View the gallery" : "Voir la galerie"} <Arrow />
            </button>
          </div>
          <div className="home-gallery-grid">
            {gallery.slice(0, 4).map((item) => (
              <figure key={item.id}>
                <img src={item.imageUrl} alt={galleryCaption(item, lang) || "COOMIAC PROJET gallery photograph"} loading="lazy" />
                {galleryCaption(item, lang) && <figcaption>{galleryCaption(item, lang)}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="faq-preview split">
        <SectionTitle eyebrow="FAQ" title={en ? "Clarity from the first question." : "La clarté dès la première question."} />
        <div>
          {faqs.slice(0, 3).map((faq, index) => (
            <Accordion key={index} question={faq[lang][0]} answer={faq[lang][1]} />
          ))}
          <button className="text-link" onClick={() => navigate("faqs")}>
            {en ? "View all questions" : "Voir toutes les questions"} <Arrow />
          </button>
        </div>
      </section>

      <ContactBand lang={lang} navigate={navigate} settings={settings} />
    </>
  );
}

/* ------------------------------- page pieces ------------------------------- */

function GenericHero({ page, lang }: { page: Exclude<Page, "home">; lang: Lang }) {
  const content = pageCopy[page][lang];
  return (
    <section className={`page-hero page-hero-${page}`}>
      <span className="eyebrow">COOMIAC PROJET · {copy[lang][page]}</span>
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
    </section>
  );
}

function About({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const values = en
    ? [
        ["Provenance", "We know where each lot comes from and record it."],
        ["Discretion", "Commercial conversations stay confidential and professional."],
        ["Partnership", "We build long-term relationships, not one-off transactions."],
      ]
    : [
        ["Provenance", "Nous savons d'où vient chaque lot et le documentons."],
        ["Discrétion", "Les échanges commerciaux restent confidentiels et professionnels."],
        ["Partenariat", "Nous construisons des relations durables, pas des transactions isolées."],
      ];
  return (
    <>
      <section className="content-section split">
        <SectionTitle
          eyebrow={en ? "Our purpose" : "Notre raison d'être"}
          title={en ? "Local value. International standards." : "Valeur locale. Standards internationaux."}
        />
        <div>
          <p className="lead">
            {en
              ? "Our ambition is to create a clear, responsible bridge between Congolese mineral production and the world's most discerning buyers."
              : "Notre ambition est de créer un pont clair et responsable entre la production minérale congolaise et les acheteurs les plus exigeants au monde."}
          </p>
          <p>
            {en
              ? "Our team works hand in hand with producers in Walikale, combining an intimate knowledge of the land with the documentation, discretion and discipline that international trade demands."
              : "Notre équipe travaille main dans la main avec les producteurs de Walikale, alliant une connaissance intime du terrain à la rigueur documentaire, à la discrétion et à la discipline qu'exige le commerce international."}
          </p>
          <div className="inline-cta">
            <AppButton onClick={() => navigate("products")}>
              {en ? "Our minerals" : "Nos minéraux"} <Arrow />
            </AppButton>
            <button className="text-link" onClick={() => navigate("contact")}>{en ? "Contact the team" : "Contacter l'équipe"} <Arrow /></button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="three-grid value-grid">
          {values.map((value, index) => (
            <article className="trust-card" key={value[0]}>
              <span>0{index + 1}</span>
              <h3>{value[0]}</h3>
              <p>{value[1]}</p>
            </article>
          ))}
        </div>
      </section>

      <Metrics lang={lang} />
    </>
  );
}

function Metrics({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <section className="metrics">
      <div><strong>05</strong><span>{en ? "minerals exported" : "minéraux exportés"}</span></div>
      <div><strong>Walikale</strong><span>{en ? "cooperative base" : "base de la coopérative"}</span></div>
      <div><strong>DRC</strong><span>{en ? "country of origin" : "pays d'origine"}</span></div>
      <div><strong>EN / FR</strong><span>{en ? "languages spoken" : "langues parlées"}</span></div>
    </section>
  );
}

function Products({
  lang,
  products,
  openProduct,
  requestQuote,
  settings,
}: {
  lang: Lang;
  products: Product[];
  openProduct: (product: Product) => void;
  requestQuote: (name: string) => void;
  settings: SiteSettings;
}) {
  const [filter, setFilter] = useState("All");
  const en = lang === "en";
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products],
  );
  const visible = products.filter((product) => filter === "All" || product.category === filter);

  return (
    <section className="listing-section">
      <div className="filters">
        {categories.map((category) => (
          <button
            className={filter === category ? "selected" : ""}
            key={category}
            onClick={() => setFilter(category)}
          >
            {category === "All" ? (en ? "All minerals" : "Tous les minéraux") : categoryLabel(category, lang)}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {visible.map((product) => {
          const title = productTitle(product, lang);
          const whatsapp = whatsappLink(
            settings,
            en
              ? `Hello COOMIAC PROJET, I would like current availability and assay details for ${title}.`
              : `Bonjour COOMIAC PROJET, je souhaite connaître la disponibilité actuelle et les analyses pour ${title}.`,
          );
          return (
            <article className="product-card" key={product.id}>
              <button className="product-media" onClick={() => openProduct(product)} aria-label={`${en ? "View" : "Voir"} ${title}`}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={title} loading="lazy" decoding="async" />
                ) : (
                  <span className="photo-placeholder">{title}</span>
                )}
                <span className="product-tag">{categoryLabel(product.category, lang)}</span>
                <span className="product-zoom">{en ? "Quick view" : "Aperçu"}</span>
              </button>
              <div className="product-body">
                <h3>{title}</h3>
                <p className="product-spec">{productSpec(product, lang)}</p>
                <p>{productDescription(product, lang)}</p>
                <div className="product-actions">
                  <AppButton small onClick={() => requestQuote(title)}>
                    {en ? "Request a quote" : "Demander un devis"} <Arrow />
                  </AppButton>
                  {whatsapp && (
                    <a className="product-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="gallery-empty">{en ? "No minerals in this category yet." : "Aucun minéral dans cette catégorie pour le moment."}</p>
      )}
    </section>
  );
}

function ProductDialog({
  product,
  lang,
  settings,
  onClose,
  onQuote,
}: {
  product: Product;
  lang: Lang;
  settings: SiteSettings;
  onClose: () => void;
  onQuote: (name: string) => void;
}) {
  const en = lang === "en";
  const title = productTitle(product, lang);
  const whatsapp = whatsappLink(
    settings,
    en
      ? `Hello COOMIAC PROJET, I would like current availability and assay details for ${title}.`
      : `Bonjour COOMIAC PROJET, je souhaite connaître la disponibilité actuelle et les analyses pour ${title}.`,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal-card product-dialog">
        <button className="modal-close" onClick={onClose} aria-label={en ? "Close" : "Fermer"}>
          <Icon name="close" />
        </button>
        <div className="modal-media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={title} />
          ) : (
            <div className="photo-placeholder">{title}</div>
          )}
          <span className="product-tag">{categoryLabel(product.category, lang)}</span>
        </div>
        <div className="modal-body">
          <span className="eyebrow">{en ? "Mineral" : "Minéral"}</span>
          <h2 id="product-dialog-title">{title}</h2>
          <p className="product-spec large">{productSpec(product, lang)}</p>
          <p>{productDescription(product, lang)}</p>
          <ul className="tick-list">
            <li><Icon name="check" /> {en ? "Origin: Walikale, North Kivu, DR Congo" : "Origine : Walikale, Nord-Kivu, RD Congo"}</li>
            <li><Icon name="check" /> {en ? "Lot assay and origin documents on request" : "Analyses et documents d'origine sur demande"}</li>
            <li><Icon name="check" /> {en ? "Export packaging agreed per order" : "Conditionnement export convenu par commande"}</li>
          </ul>
          <div className="button-row">
            <AppButton onClick={() => onQuote(title)}>
              {en ? "Request a quote" : "Demander un devis"} <Arrow />
            </AppButton>
            {whatsapp && (
              <a className="btn btn-outline" href={whatsapp} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryPage({ lang, navigate, gallery }: { lang: Lang; navigate: (page: Page) => void; gallery: GalleryItem[] }) {
  const en = lang === "en";
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((current) => (current === null ? null : (current + 1) % gallery.length));
      if (event.key === "ArrowLeft") setActive((current) => (current === null ? null : (current - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, gallery.length]);

  const item = active === null ? null : gallery[active];

  useBodyLock(active !== null);

  return (
    <section className="content-section">
      {gallery.length > 0 ? (
        <div className="public-gallery">
          {gallery.map((photo, index) => {
            const caption = galleryCaption(photo, lang);
            return (
              <figure key={photo.id} className={`gallery-item gallery-item-${index % 6}`}>
                <button onClick={() => setActive(index)} aria-label={`${en ? "Open photo" : "Ouvrir la photo"} ${index + 1}`}>
                  <img src={photo.imageUrl} alt={caption || "COOMIAC PROJET gallery photograph"} loading="lazy" />
                  <span className="gallery-zoom" aria-hidden="true">＋</span>
                </button>
                {caption && <figcaption>{caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      ) : (
        <p className="gallery-empty">
          {en ? "New photography from Walikale is on its way." : "De nouvelles photographies de Walikale arrivent bientôt."}
        </p>
      )}

      <div className="doc-cta">
        <div>
          <h2>{en ? "Need lot-specific photos?" : "Besoin de photos d'un lot précis ?"}</h2>
          <p>
            {en
              ? "Ask your account contact for current images, assay documents and packing details for the lot you are considering."
              : "Demandez à votre contact les images actuelles, les documents d'analyse et les détails d'emballage du lot qui vous intéresse."}
          </p>
        </div>
        <AppButton onClick={() => navigate("contact")}>{en ? "Contact the team" : "Contacter l'équipe"} <Arrow /></AppButton>
      </div>

      <details className="photo-credits">
        <summary>{en ? "Photo sources & credits" : "Sources et crédits des photos"}</summary>
        <p>
          {en
            ? "Every built-in photograph is a real photograph, not AI-generated. Most are sourced from Wikimedia Commons; the Coltan photo is supplied by COOMIAC PROJET. Open a linked photo to see its author, license and original file."
            : "Chaque photographie intégrée est une photographie réelle, non générée par IA. La plupart proviennent de Wikimedia Commons ; la photo du coltan est fournie par COOMIAC PROJET. Ouvrez une photo liée pour voir son auteur, sa licence et le fichier d'origine."}
        </p>
        <div className="photo-credits-grid">
          {photoCredits.map((credit) => {
            const content = (
              <>
                <img src={credit.thumb} alt="" loading="lazy" width="240" height="180" />
                <span>
                  <b>{en ? credit.title_en : credit.title_fr}</b>
                  <small>{credit.author} · {credit.license}</small>
                  <em>{credit.file}</em>
                </span>
              </>
            );
            return credit.sourceUrl ? (
              <a key={credit.id} href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{content}</a>
            ) : (
              <div className="photo-credit" key={credit.id}>{content}</div>
            );
          })}
        </div>
      </details>

      {item && (
        <div className="modal lightbox" role="dialog" aria-modal="true" aria-label={galleryCaption(item, lang) || "Gallery photo"}>
          <button className="modal-close" onClick={() => setActive(null)} aria-label={en ? "Close" : "Fermer"}>
            <Icon name="close" />
          </button>
          <button
            className="lightbox-nav prev"
            onClick={() => setActive((current) => (current === null ? null : (current - 1 + gallery.length) % gallery.length))}
            aria-label={en ? "Previous photo" : "Photo précédente"}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <figure>
            <img src={item.imageUrl} alt={galleryCaption(item, lang) || "COOMIAC PROJET gallery photograph"} />
            <figcaption>
              <span>{galleryCaption(item, lang)}</span>
              <small>{active! + 1} / {gallery.length}</small>
            </figcaption>
          </figure>
          <button
            className="lightbox-nav next"
            onClick={() => setActive((current) => (current === null ? null : (current + 1) % gallery.length))}
            aria-label={en ? "Next photo" : "Photo suivante"}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </section>
  );
}

function Certifications({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const docs: [string, string][] = en
    ? [
        ["Cooperative registration", "Official registration of COOMIAC PROJET as a cooperative in North Kivu."],
        ["Operating licences", "Sourcing, trading and export licences for the current operating period."],
        ["Lot assay reports", "Independent assay results for each lot, provided with the commercial offer."],
        ["Export documentation", "Export permits, certificates of origin and customs paperwork for the shipment."],
      ]
    : [
        ["Enregistrement de la coopérative", "Enregistrement officiel de COOMIAC PROJET en tant que coopérative au Nord-Kivu."],
        ["Licences d'exploitation", "Licences d'approvisionnement, de commerce et d'exportation pour la période en cours."],
        ["Rapports d'analyse des lots", "Résultats d'analyse indépendants pour chaque lot, fournis avec l'offre commerciale."],
        ["Documents d'exportation", "Permis d'exportation, certificats d'origine et documents douaniers de l'expédition."],
      ];

  return (
    <section className="content-section">
      <div className="doc-grid">
        {docs.map((doc, index) => (
          <article className="doc-card" key={doc[0]}>
            <span className="doc-icon">0{index + 1}</span>
            <div>
              <h3>{doc[0]}</h3>
              <p>{doc[1]}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="doc-cta">
        <div>
          <h2>{en ? "Need our documents?" : "Besoin de nos documents ?"}</h2>
          <p>
            {en
              ? "Qualified buyers can request the current registration, licensing, assay and export file for their transaction."
              : "Les acheteurs qualifiés peuvent demander le dossier actuel d'enregistrement, de licences, d'analyses et d'exportation pour leur transaction."}
          </p>
        </div>
        <AppButton onClick={() => navigate("contact")}>{en ? "Request documents" : "Demander les documents"} <Arrow /></AppButton>
      </div>
    </section>
  );
}

function Sourcing({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const items = en
    ? [
        ["Traceability", "Record origin and chain-of-custody information at lot level."],
        ["Due diligence", "Review risks, counterparties and supporting evidence."],
        ["People & communities", "Promote dignity, safety and respectful local engagement."],
        ["Continuous improvement", "Document gaps, corrective actions and progress."],
      ]
    : [
        ["Traçabilité", "Consigner l'origine et la chaîne de contrôle au niveau du lot."],
        ["Devoir de diligence", "Examiner les risques, les contreparties et les preuves."],
        ["Personnes et communautés", "Promouvoir la dignité, la sécurité et l'engagement local respectueux."],
        ["Amélioration continue", "Documenter les écarts, les actions correctives et les progrès."],
      ];

  return (
    <>
      <section className="content-section">
        <div className="steps-grid">
          {items.map((item, index) => (
            <article key={item[0]}>
              <span>0{index + 1}</span>
              <h3>{item[0]}</h3>
              <p>{item[1]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="split-note">
        <div>
          <span className="eyebrow">{en ? "Our commitment" : "Notre engagement"}</span>
          <h2>{en ? "Trust is earned lot by lot." : "La confiance se gagne lot par lot."}</h2>
        </div>
        <p>
          {en
            ? "We align our practices with recognised due-diligence expectations for conflict-affected and high-risk areas. Buyers receive the information they need to conduct their own review with confidence."
            : "Nous alignons nos pratiques sur les attentes reconnues en matière de diligence raisonnable pour les zones de conflit et à haut risque. Les acheteurs reçoivent les informations nécessaires pour mener leur propre examen en confiance."}
        </p>
      </section>
    </>
  );
}

function Buy({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const steps = en
    ? [
        ["Submit an inquiry", "Share the mineral, your company, destination, volume range and intended use."],
        ["Qualification", "Counterparty and compliance information is reviewed."],
        ["Lot verification", "Available lot, photos, assay and documents are validated."],
        ["Commercial terms", "Both parties review pricing, delivery and contract terms."],
        ["Execution", "Approved logistics, export, payment and handover processes begin."],
      ]
    : [
        ["Envoyer une demande", "Indiquez le minéral, l'entreprise, la destination, le volume et l'usage prévu."],
        ["Qualification", "Les informations de contrepartie et de conformité sont examinées."],
        ["Vérification du lot", "Le lot, les photos, l'analyse et les documents sont validés."],
        ["Conditions commerciales", "Les parties examinent les prix, la livraison et le contrat."],
        ["Exécution", "Les processus approuvés de logistique, d'exportation, de paiement et de transfert débutent."],
      ];

  return (
    <section className="content-section">
      <div className="buy-steps">
        {steps.map((step, index) => (
          <article key={step[0]}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div><h3>{step[0]}</h3><p>{step[1]}</p></div>
          </article>
        ))}
      </div>
      <AppButton onClick={() => navigate("contact")}>{en ? "Begin an inquiry" : "Démarrer une demande"} <Arrow /></AppButton>
    </section>
  );
}

function Faqs({ lang }: { lang: Lang }) {
  return (
    <section className="narrow-section">
      {faqs.map((faq, index) => (
        <Accordion key={index} question={faq[lang][0]} answer={faq[lang][1]} />
      ))}
    </section>
  );
}

/* --------------------------------- contact --------------------------------- */

function Contact({
  lang,
  prefill,
  settings,
  products,
}: {
  lang: Lang;
  prefill: string;
  settings: SiteSettings;
  products: Product[];
}) {
  const en = lang === "en";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [productChoice, setProductChoice] = useState(prefill);
  const [message, setMessage] = useState(
    prefill
      ? en
        ? `I would like a qualified quote for ${prefill}.`
        : `Je souhaite un devis qualifié pour ${prefill}.`
      : "",
  );
  const [inquiryType, setInquiryType] = useState<InquiryType>(prefill ? "quote" : "general");
  const phoneHref = `tel:${settings.phone.replace(/[^\d+]/g, "")}`;
  const whatsapp = whatsappLink(
    settings,
    en
      ? "Hello COOMIAC PROJET, I would like to discuss a qualified mineral inquiry."
      : "Bonjour COOMIAC PROJET, je souhaite discuter d'une demande qualifiée de minéraux.",
  );

  const chooseProduct = (value: string) => {
    setProductChoice(value);
    if (value) {
      setInquiryType("quote");
      if (!message.trim()) {
        setMessage(
          en ? `I would like a qualified quote for ${value}.` : `Je souhaite un devis qualifié pour ${value}.`,
        );
      }
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const choice = productChoice.trim();
    const detail = message.trim();
    const fullMessage = [choice ? `${en ? "Mineral" : "Minéral"}: ${choice}` : "", detail]
      .filter(Boolean)
      .join("\n\n");
    setStatus("loading");
    try {
      await createInquiry({
        fullName: String(data.get("name") ?? "").trim(),
        businessEmail: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        inquiryType,
        message: fullMessage,
        consent: data.get("consent") === "on",
      });
      form.reset();
      setMessage("");
      setProductChoice("");
      setInquiryType("general");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="contact-layout" id="inquiry">
      <aside className="contact-aside">
        <span className="eyebrow">{en ? "Direct contact" : "Contact direct"}</span>
        <h2>{en ? "Business starts with a clear conversation." : "Les affaires commencent par un échange clair."}</h2>

        <div className="contact-cards">
          <a className="contact-card" href={`mailto:${settings.email}`}>
            <span className="contact-icon"><Icon name="mail" /></span>
            <span><small>{en ? "Email" : "E-mail"}</small><b>{settings.email}</b></span>
          </a>
          <a className="contact-card" href={phoneHref}>
            <span className="contact-icon"><Icon name="phone" /></span>
            <span><small>{en ? "Phone" : "Téléphone"}</small><b>{settings.phone}</b></span>
          </a>
          {whatsapp && (
            <a className="contact-card highlight" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <span className="contact-icon"><Icon name="whatsapp" /></span>
              <span><small>WhatsApp</small><b>{en ? "Message us directly" : "Écrivez-nous directement"}</b></span>
            </a>
          )}
        </div>

        <p className="contact-address">
          <Icon name="pin" />
          <span>{en ? settings.address_en : settings.address_fr}</span>
        </p>
        <p className="micro">
          {en
            ? "We reply within two business days, in English or French. Commercial information is treated confidentially."
            : "Nous répondons sous deux jours ouvrés, en anglais ou en français. Les informations commerciales sont traitées de manière confidentielle."}
        </p>
      </aside>

      {status === "success" ? (
        <div className="form contact-success" role="status">
          <span className="success-mark"><Icon name="check" /></span>
          <h2>{en ? "Your inquiry has been received." : "Votre demande a bien été reçue."}</h2>
          <p>
            {en
              ? "Thank you — our team will review your request and reply within two business days."
              : "Merci — notre équipe examinera votre demande et vous répondra sous deux jours ouvrés."}
          </p>
          <div className="button-row">
            <AppButton onClick={() => setStatus("idle")}>{en ? "Send another inquiry" : "Envoyer une autre demande"} <Arrow /></AppButton>
            {whatsapp && (
              <a className="btn btn-outline" href={whatsapp} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <div className="field-row">
            <label>
              {en ? "Full name" : "Nom complet"}
              <input required name="name" maxLength={120} placeholder={en ? "Your name" : "Votre nom"} autoComplete="name" />
            </label>
            <label>
              {en ? "Business email" : "E-mail professionnel"}
              <input required type="email" name="email" maxLength={200} placeholder="name@company.com" autoComplete="email" />
            </label>
          </div>
          <label>
            {en ? "Company" : "Entreprise"}
            <input required name="company" maxLength={160} placeholder={en ? "Company name" : "Nom de l'entreprise"} autoComplete="organization" />
          </label>
          <div className="field-row">
            <label>
              {en ? "Inquiry type" : "Type de demande"}
              <select name="type" value={inquiryType} onChange={(event) => setInquiryType(event.target.value as InquiryType)}>
                <option value="general">{en ? "General partnership" : "Partenariat général"}</option>
                <option value="quote">{en ? "Product quote" : "Devis produit"}</option>
                <option value="compliance">{en ? "Compliance & documents" : "Conformité et documents"}</option>
              </select>
            </label>
            <label>
              {en ? "Mineral of interest" : "Minéral concerné"}
              <select name="product" value={productChoice} onChange={(event) => chooseProduct(event.target.value)}>
                <option value="">{en ? "Not sure yet" : "Pas encore décidé"}</option>
                {products.map((product) => (
                  <option key={product.id} value={productTitle(product, lang)}>{productTitle(product, lang)}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            {en ? "Message" : "Message"}
            <textarea
              required
              rows={5}
              maxLength={4000}
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                en
                  ? "Tell us about the mineral, volume, destination and timeline you have in mind."
                  : "Précisez le minéral, le volume, la destination et le calendrier envisagé."
              }
            />
          </label>
          <label className="check">
            <input type="checkbox" required name="consent" />
            <span>
              {en
                ? "I confirm that the information is accurate and I consent to being contacted."
                : "Je confirme l'exactitude des informations et j'accepte d'être contacté."}
            </span>
          </label>
          <AppButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? (en ? "Sending…" : "Envoi…") : (en ? "Send inquiry" : "Envoyer la demande")} <Arrow />
          </AppButton>
          {status === "error" && (
            <p className="error" role="alert">
              {en ? "We couldn't send your inquiry. Please email " : "Nous n'avons pas pu envoyer votre demande. Écrivez à "}
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              {en ? " or message us on WhatsApp." : " ou contactez-nous sur WhatsApp."}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function ContactBand({ lang, navigate, settings }: { lang: Lang; navigate: (page: Page) => void; settings: SiteSettings }) {
  const en = lang === "en";
  const whatsapp = whatsappLink(
    settings,
    en ? "Hello COOMIAC PROJET, I would like to discuss a mineral inquiry." : "Bonjour COOMIAC PROJET, je souhaite discuter d'une demande de minéraux.",
  );
  return (
    <section className="contact-band">
      <div>
        <span className="eyebrow">{en ? "Next step" : "Prochaine étape"}</span>
        <h2>{en ? "Tell us what you need. We'll take it from there." : "Dites-nous ce dont vous avez besoin. Nous prenons le relais."}</h2>
        <p>{settings.email} · {settings.phone}</p>
      </div>
      <div className="button-row">
        <AppButton onClick={() => navigate("contact")}>{en ? "Start an inquiry" : "Démarrer une demande"} <Arrow /></AppButton>
        {whatsapp && (
          <a className="btn btn-outline" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" /> WhatsApp
          </a>
        )}
      </div>
      <img src={photos.cathode} alt="" aria-hidden="true" />
    </section>
  );
}

/* --------------------------------- footer ---------------------------------- */

function Footer({ lang, navigate, settings }: { lang: Lang; navigate: (to: string) => void; settings: SiteSettings }) {
  const en = lang === "en";
  const explore: Page[] = ["about", "products", "gallery", "sourcing", "buy"];
  const information: (Page | "admin")[] = ["certifications", "faqs", "contact", "admin"];
  const whatsapp = whatsappLink(settings, en ? "Hello COOMIAC PROJET." : "Bonjour COOMIAC PROJET.");

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <span className="brand-mark"><span>CP</span></span>
          <h2>COOMIAC<br />PROJET</h2>
          <p>{en ? "Minerals from Walikale, North Kivu, DR Congo — sourced responsibly, documented properly." : "Minéraux de Walikale, Nord-Kivu, RD Congo — approvisionnés de manière responsable, documentés avec rigueur."}</p>
          <a className="footer-mail" href={`mailto:${settings.email}`}>{settings.email}</a>
        </div>
        <div>
          <b>{en ? "Explore" : "Explorer"}</b>
          {explore.map((page) => (
            <button key={page} onClick={() => navigate(`/${page}`)}>{copy[lang][page]}</button>
          ))}
        </div>
        <div>
          <b>{en ? "Information" : "Informations"}</b>
          {information.map((page) => (
            <button key={page} onClick={() => navigate(page === "admin" ? "/admin" : `/${page}`)}>{copy[lang][page]}</button>
          ))}
        </div>
        <div className="footer-contact">
          <b>{en ? "Contact" : "Contact"}</b>
          <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" /> {settings.phone}</a>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" /> WhatsApp</a>}
          <span className="footer-address"><Icon name="pin" /> {en ? settings.address_en : settings.address_fr}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 COOMIAC PROJET</span>
        <span>{en ? "Walikale · North Kivu · DR Congo" : "Walikale · Nord-Kivu · RD Congo"}</span>
      </div>
    </footer>
  );
}

export default App;

import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import logo from "./assets/logo.png";
import logoLight from "./assets/logo-light.png";
import { Arrow, AppButton } from "./components/ui";
import { createInquiry } from "./lib/data";
import { useGallery, useProducts, useSiteSettings } from "./lib/hooks";
import {
  galleryCaption,
  productDescription,
  productTitle,
  whatsappLink,
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
function readDarkPreference(): boolean {
  try {
    return localStorage.getItem("theme") !== "light";
  } catch {
    return true;
  }
}

const stockHero = "https://images.unsplash.com/photo-1762463176312-1757d5125c85?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1800&auto=format";
const stockDetail = "https://images.unsplash.com/photo-1762463176417-2c5e63767bd2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1000&auto=format";

const copy = {
  en: {
    home: "Home", about: "About", products: "Gold Products", gallery: "Gallery", certifications: "Certifications",
    sourcing: "Responsible Sourcing", buy: "How to Buy", faqs: "FAQs", contact: "Contact", admin: "Admin",
  },
  fr: {
    home: "Accueil", about: "À propos", products: "Produits aurifères", gallery: "Galerie", certifications: "Certifications",
    sourcing: "Approvisionnement responsable", buy: "Comment acheter", faqs: "FAQ", contact: "Contact", admin: "Admin",
  },
};

const pageCopy: Record<Exclude<Page, "home">, { en: [string, string]; fr: [string, string] }> = {
  about: {
    en: ["Rooted in the land. Built for international trust.", "COOMIAC PROJET is a gold cooperative in Walikale, North Kivu, created to bring local production to qualified international buyers with clarity and care."],
    fr: ["Ancrée dans la terre. Bâtie pour la confiance internationale.", "COOMIAC PROJET est une coopérative aurifère de Walikale, au Nord-Kivu, créée pour rapprocher la production locale des acheteurs internationaux qualifiés, avec clarté et exigence."],
  },
  products: {
    en: ["Gold, prepared for serious buyers.", "Explore the formats we prepare for qualified buyers. Contact our team for current availability, assay details, volumes, and pricing."],
    fr: ["Un or préparé pour des acheteurs exigeants.", "Découvrez les formats que nous préparons pour des acheteurs qualifiés. Contactez notre équipe pour la disponibilité actuelle, les analyses, les volumes et les prix."],
  },
  gallery: {
    en: ["Inside the operation", "A rare view of Walikale: gold lots, working sites, and the people behind the supply chain."],
    fr: ["Au cœur des opérations", "Un regard rare sur Walikale : lots d'or, sites d'exploitation et acteurs de la chaîne d'approvisionnement."],
  },
  certifications: {
    en: ["Evidence before promises.", "Trust is built on evidence. Our registration, licensing, assay, and export file is shared with qualified buyers."],
    fr: ["Des preuves avant les promesses.", "La confiance repose sur des preuves. Notre dossier d'enregistrement, de licences, d'analyse et d'exportation est partagé avec les acheteurs qualifiés."],
  },
  sourcing: {
    en: ["Responsible sourcing, made tangible.", "A working commitment to traceability, due diligence, community respect, and continuous improvement."],
    fr: ["Un approvisionnement responsable, concret.", "Un engagement opérationnel pour la traçabilité, le devoir de diligence, le respect des communautés et l'amélioration continue."],
  },
  buy: {
    en: ["A clear path to qualified trade", "Every inquiry follows a structured review before commercial terms are confirmed."],
    fr: ["Un parcours clair vers un commerce qualifié", "Chaque demande suit un examen structuré avant la confirmation des conditions commerciales."],
  },
  faqs: {
    en: ["Frequently asked questions", "Direct answers for prospective buyers, refiners, and responsible sourcing partners."],
    fr: ["Questions fréquentes", "Des réponses directes pour les acheteurs, affineurs et partenaires d'approvisionnement responsable."],
  },
  contact: {
    en: ["Start a qualified conversation", "Tell us about your organization, requirements, destination, and compliance needs."],
    fr: ["Commençons un échange qualifié", "Présentez-nous votre organisation, vos besoins, la destination et vos exigences de conformité."],
  },
};

const faqs = [
  {
    en: ["Can you confirm current stock or purity?", "Stock and purity vary by lot. Share your requirements and our team will confirm the available lot, assay results, and pricing for your inquiry."],
    fr: ["Pouvez-vous confirmer le stock ou la pureté ?", "Le stock et la pureté varient selon le lot. Partagez vos besoins et notre équipe confirmera le lot disponible, les résultats d'analyse et les prix."],
  },
  {
    en: ["What documents can buyers review?", "Registration, operating licenses, lot assay reports, and export documentation are available to qualified buyers on request."],
    fr: ["Quels documents les acheteurs peuvent-ils consulter ?", "L'enregistrement, les licences d'exploitation, les rapports d'analyse des lots et les documents d'exportation sont disponibles sur demande pour les acheteurs qualifiés."],
  },
  {
    en: ["How does buyer onboarding work?", "We review your organization, intended use, destination, compliance profile, and commercial requirements before proceeding."],
    fr: ["Comment fonctionne l'intégration d'un acheteur ?", "Nous examinons votre organisation, l'usage prévu, la destination, le profil de conformité et les besoins commerciaux avant de poursuivre."],
  },
  {
    en: ["How are product photos handled?", "Photographs in the gallery are supplied by the COOMIAC PROJET team. Ask your account contact for current lot photos and assay documents."],
    fr: ["Comment les photos de produits sont-elles gérées ?", "Les photographies de la galerie sont fournies par l'équipe COOMIAC PROJET. Demandez à votre contact les photos du lot en cours et les documents d'analyse."],
  },
];

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
  const [lang, setLang] = useState<Lang>("en");
  const [menu, setMenu] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState("");
  const settings = useSiteSettings();
  const t = copy[lang];
  const page = toPage(path);
  const en = lang === "en";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.title =
      page === "home"
        ? en
          ? "COOMIAC PROJET — Gold from Walikale, DR Congo"
          : "COOMIAC PROJET — Or de Walikale, RDC"
        : `${pageCopy[page][lang][0]} · COOMIAC PROJET`;
  }, [page, lang, en]);

  const navigatePage = (next: Page, anchor?: string) => {
    navigate(next === "home" ? "/" : `/${next}`);
    setMenu(false);
    setTimeout(
      () =>
        anchor
          ? document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" })
          : window.scrollTo({ top: 0, behavior: "smooth" }),
      0,
    );
  };

  const requestQuote = (name: string) => {
    setQuoteProduct(name);
    navigatePage("contact", "inquiry");
  };

  const nav: Page[] = ["home", "about", "products", "certifications", "sourcing", "buy", "faqs", "contact"];
  const whatsapp = whatsappLink(
    settings,
    en
      ? "Hello COOMIAC PROJET, I would like to know more about your gold products and opportunities."
      : "Bonjour COOMIAC PROJET, je souhaite en savoir plus sur vos produits aurifères et vos opportunités.",
  );

  return (
    <div className="app">
      <header className="header">
        <button className="brand" onClick={() => navigatePage("home")} aria-label="COOMIAC PROJET home">
          <img
            className="brand-logo"
            src={dark ? logoLight : logo}
            alt="COOMIAC PROJET WALIKALE"
            width="150"
            height="81"
            decoding="async"
          />
        </button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {nav.map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              aria-current={page === item ? "page" : undefined}
              onClick={() => navigatePage(item)}
            >
              {t[item]}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="utility"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label={en ? "Passer en français" : "Switch to English"}
          >
            {en ? "FR" : "EN"}
          </button>
          <button
            className="utility"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
          >
            {dark ? "☼" : "◐"}
          </button>
          <button
            className="menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
          >
            {menu ? "×" : "☰"}
          </button>
        </div>
      </header>

      <main>
        {page !== "home" && <GenericHero page={page} lang={lang} />}
        {page === "home" && <Home lang={lang} navigate={navigatePage} requestQuote={requestQuote} />}
        {page === "about" && <About lang={lang} />}
        {page === "products" && <Products lang={lang} requestQuote={requestQuote} />}
        {page === "gallery" && <GalleryPage lang={lang} navigate={navigatePage} />}
        {page === "certifications" && <Certifications lang={lang} navigate={navigatePage} />}
        {page === "sourcing" && <Sourcing lang={lang} />}
        {page === "buy" && <Buy lang={lang} navigate={navigatePage} />}
        {page === "faqs" && <Faqs lang={lang} />}
        {page === "contact" && <Contact lang={lang} prefill={quoteProduct} settings={settings} />}
      </main>

      {whatsapp && (
        <a
          className="whatsapp-float"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.45 0 .08 5.37.08 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a11.9 11.9 0 0 0 5.82 1.48h.01c6.59 0 11.96-5.37 11.96-11.96 0-3.2-1.25-6.21-3.49-8.41ZM12.05 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.69.97.99-3.6-.23-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.89-9.9 9.89Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z" />
          </svg>
        </a>
      )}

      <Footer lang={lang} navigate={navigate} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function Home({
  lang,
  navigate,
  requestQuote,
}: {
  lang: Lang;
  navigate: (page: Page, anchor?: string) => void;
  requestQuote: (name: string) => void;
}) {
  const en = lang === "en";
  const { gallery } = useGallery();

  return (
    <>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.94) 0%, rgba(5,5,5,.58) 58%, rgba(5,5,5,.18) 100%), url(${stockHero})`,
        }}
      >
        <div className="hero-content">
          <span className="eyebrow">{en ? "Walikale · North Kivu · DR Congo" : "Walikale · Nord-Kivu · RD Congo"}</span>
          <h1>{en ? "Exceptional gold, from the heart of the Congo." : "Un or d'exception, au cœur du Congo."}</h1>
          <p>
            {en
              ? "A cooperative-led source for discerning buyers — traceable, documented, and prepared with care for the world market."
              : "Une source coopérative pour des acheteurs exigeants — traçable, documentée et préparée avec soin pour le marché mondial."}
          </p>
          <div className="button-row">
            <AppButton onClick={() => navigate("products")}>{en ? "Explore Gold" : "Découvrir l'or"} <Arrow /></AppButton>
            <AppButton kind="outline" onClick={() => navigate("contact")}>{en ? "Contact Us" : "Nous contacter"}</AppButton>
          </div>
        </div>
        <div className="hero-index"><span>01</span><i></i><small>{en ? "Provenance · Clarity · Partnership" : "Provenance · Clarté · Partenariat"}</small></div>
      </section>

      <section className="intro split">
        <SectionTitle
          eyebrow={en ? "Our cooperative" : "Notre coopérative"}
          title={en ? "Rooted in Walikale. Ready for the world." : "Ancrée à Walikale. Prête pour le monde."}
        />
        <div>
          <p className="lead">
            {en
              ? "We bring the integrity of Congolese gold production to the standards of international trade."
              : "Nous portons l'intégrité de la production aurifère congolaise aux standards du commerce international."}
          </p>
          <p>
            {en
              ? "From the first conversation to the final export file, our team pairs deep local knowledge with the documentation, discretion, and delivery discipline that serious buyers expect."
              : "De la première conversation au dossier d'exportation final, notre équipe allie une connaissance profonde du terrain à la rigueur documentaire, à la discrétion et à la discipline logistique attendues par les acheteurs sérieux."}
          </p>
          <button className="text-link" onClick={() => navigate("about")}>{en ? "Discover our approach" : "Découvrir notre approche"} <Arrow /></button>
        </div>
      </section>

      <section className="product-feature">
        <div className="feature-image" style={{ backgroundImage: `url(${stockDetail})` }} />
        <div className="feature-content">
          <span className="eyebrow">{en ? "Product inquiries" : "Demandes produits"}</span>
          <h2>{en ? "Gold lots, presented with precision." : "Des lots d'or présentés avec précision."}</h2>
          <p>
            {en
              ? "Every commercial discussion begins with understanding your requirements. We then match you with the right lot, the supporting assay and origin documents, and clear delivery terms."
              : "Chaque échange commercial commence par la compréhension de vos besoins. Nous vous proposons ensuite le lot adapté, les documents d'analyse et d'origine, et des conditions de livraison claires."}
          </p>
          <AppButton onClick={() => requestQuote("Gold Doré")}>{en ? "Request a quote" : "Demander un devis"} <Arrow /></AppButton>
        </div>
      </section>

      <section className="home-trust">
        <SectionTitle
          eyebrow={en ? "Built for trust" : "Fondé sur la confiance"}
          title={en ? "Assurance, at every step." : "La confiance, à chaque étape."}
          text={en ? "A disciplined framework for provenance, documentation, and long-term partnership." : "Un cadre rigoureux pour la provenance, la documentation et le partenariat durable."}
        />
        <div className="three-grid">
          {[
            [en ? "Responsible sourcing" : "Approvisionnement responsable", en ? "Traceability and due diligence guide every step, from pit to export." : "La traçabilité et la diligence guident chaque étape, de l'extraction à l'exportation.", "sourcing" as Page],
            [en ? "Verified documents" : "Documents vérifiés", en ? "Registration, licensing, assay, and export records available on request." : "Enregistrement, licences, analyses et documents d'exportation disponibles sur demande.", "certifications" as Page],
            [en ? "Structured buying" : "Achat structuré", en ? "Qualification, verification, terms, then execution." : "Qualification, vérification, conditions, puis exécution.", "buy" as Page],
          ].map((item, index) => (
            <article className="trust-card" key={String(item[0])}>
              <span>0{index + 1}</span>
              <h3>{item[0]}</h3>
              <p>{item[1]}</p>
              <button className="circle-link" onClick={() => navigate(item[2] as Page)} aria-label={`Open ${item[0]}`}><Arrow /></button>
            </article>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="home-gallery">
          <SectionTitle
            eyebrow={en ? "Gallery" : "Galerie"}
            title={en ? "A rare view of the work behind the gold." : "Un regard rare sur le travail derrière l'or."}
            text={en ? "From the sites of Walikale to the people who make responsible sourcing possible." : "Des sites de Walikale aux femmes et aux hommes qui rendent l'approvisionnement responsable possible."}
          />
          <div className="home-gallery-grid">
            {gallery.slice(0, 4).map((item) => (
              <figure key={item.id}>
                <img src={item.imageUrl} alt={galleryCaption(item, lang) || "COOMIAC PROJET gallery photograph"} loading="lazy" />
                {galleryCaption(item, lang) && <figcaption>{galleryCaption(item, lang)}</figcaption>}
              </figure>
            ))}
          </div>
          <button className="text-link" onClick={() => navigate("gallery")}>{en ? "View the gallery" : "Voir la galerie"} <Arrow /></button>
        </section>
      )}

      <section className="faq-preview split">
        <SectionTitle eyebrow="FAQ" title={en ? "Clarity from the first question." : "La clarté dès la première question."} />
        <div>
          {faqs.slice(0, 3).map((faq, index) => <Accordion key={index} question={faq[lang][0]} answer={faq[lang][1]} />)}
          <button className="text-link" onClick={() => navigate("faqs")}>{en ? "View all questions" : "Voir toutes les questions"} <Arrow /></button>
        </div>
      </section>
    </>
  );
}

function GenericHero({ page, lang }: { page: Exclude<Page, "home">; lang: Lang }) {
  const content = pageCopy[page][lang];
  return (
    <section className="page-hero">
      <span className="eyebrow">COOMIAC PROJET · {copy[lang][page]}</span>
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
    </section>
  );
}

function About({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <>
      <section className="content-section split">
        <SectionTitle
          eyebrow={en ? "Our purpose" : "Notre raison d'être"}
          title={en ? "Local value. International discipline." : "Valeur locale. Rigueur internationale."}
        />
        <div>
          <p className="lead">
            {en
              ? "Our ambition is to create a clear, responsible bridge between Congolese gold production and the world's most discerning buyers."
              : "Notre ambition est de créer un pont clair et responsable entre la production aurifère congolaise et les acheteurs les plus exigeants au monde."}
          </p>
          <p>
            {en
              ? "Our team works hand in hand with producers in Walikale, combining an intimate knowledge of the land with the documentation, discretion, and discipline that international trade demands."
              : "Notre équipe travaille main dans la main avec les producteurs de Walikale, alliant une connaissance intime du terrain à la rigueur documentaire, à la discrétion et à la discipline qu'exige le commerce international."}
          </p>
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
      <div><strong>DRC</strong><span>{en ? "Country of operation" : "Pays d'activité"}</span></div>
      <div><strong>Walikale</strong><span>{en ? "Cooperative base" : "Base de la coopérative"}</span></div>
      <div><strong>Gold</strong><span>{en ? "Core export focus" : "Cœur de l'activité d'export"}</span></div>
    </section>
  );
}

function Products({ lang, requestQuote }: { lang: Lang; requestQuote: (name: string) => void }) {
  const [filter, setFilter] = useState("All");
  const { products } = useProducts();
  const en = lang === "en";
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))];
  const visible: Product[] = products.filter((product) => filter === "All" || product.category === filter);

  return (
    <section className="listing-section">
      <div className="filters">
        {categories.map((category) => (
          <button className={filter === category ? "selected" : ""} key={category} onClick={() => setFilter(category)}>
            {category === "All" ? (en ? "All products" : "Tous les produits") : category}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {visible.map((product) => {
          const title = productTitle(product, lang);
          return (
            <article className="product-card" key={product.id}>
              {product.imageUrl ? (
                <img
                  className="product-img"
                  src={product.imageUrl}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="photo-placeholder">{product.category || "COOMIAC PROJET"}</div>
              )}
              <div className="product-body">
                <span className="eyebrow">{product.category}</span>
                <h3>{title}</h3>
                <p>{productDescription(product, lang)}</p>
                <AppButton onClick={() => requestQuote(title)}>{en ? "Request a Quote" : "Demander un devis"} <Arrow /></AppButton>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GalleryPage({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const { gallery, loading } = useGallery();

  return (
    <section className="content-section">
      {gallery.length > 0 ? (
        <div className="public-gallery">
          {gallery.map((item) => {
            const caption = galleryCaption(item, lang);
            return (
              <figure key={item.id}>
                <img src={item.imageUrl} alt={caption || "COOMIAC PROJET gallery photograph"} loading="lazy" />
                {caption && <figcaption>{caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      ) : (
        <p className="gallery-empty">
          {loading
            ? en ? "Loading gallery…" : "Chargement de la galerie…"
            : en ? "New photography from Walikale is on its way." : "De nouvelles photographies de Walikale arrivent bientôt."}
        </p>
      )}

      <div className="doc-cta">
        <div>
          <h2>{en ? "Need lot-specific photos?" : "Besoin de photos d'un lot précis ?"}</h2>
          <p>
            {en
              ? "Ask your account contact for current images, assay documents, and packing details for the lot you are considering."
              : "Demandez à votre contact les images actuelles, les documents d'analyse et les détails d'emballage du lot qui vous intéresse."}
          </p>
        </div>
        <AppButton onClick={() => navigate("contact")}>{en ? "Contact the team" : "Contacter l'équipe"} <Arrow /></AppButton>
      </div>
    </section>
  );
}

function Certifications({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const docs: [string, string][] = en
    ? [
        ["Cooperative registration", "Official registration of COOMIAC PROJET as a gold cooperative in North Kivu."],
        ["Operating licenses", "Sourcing, trading, and export licenses for the current operating period."],
        ["Lot assay reports", "Independent assay results for each lot, provided with the commercial offer."],
        ["Export documentation", "Export permits, certificates of origin, and customs paperwork for the shipment."],
      ]
    : [
        ["Enregistrement de la coopérative", "Enregistrement officiel de COOMIAC PROJET en tant que coopérative aurifère au Nord-Kivu."],
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
              ? "Qualified buyers can request the current registration, licensing, assay, and export file for their transaction."
              : "Les acheteurs qualifiés peuvent demander le dossier actuel d'enregistrement, de licences, d'analyse et d'exportation pour leur transaction."}
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
        ["Due diligence", "Review risks, counterparties, and supporting evidence."],
        ["People & communities", "Promote dignity, safety, and respectful local engagement."],
        ["Continuous improvement", "Document gaps, corrective actions, and progress."],
      ]
    : [
        ["Traçabilité", "Consigner l'origine et la chaîne de contrôle au niveau du lot."],
        ["Devoir de diligence", "Examiner les risques, les contreparties et les preuves."],
        ["Personnes et communautés", "Promouvoir la dignité, la sécurité et l'engagement local respectueux."],
        ["Amélioration continue", "Documenter les écarts, les actions correctives et les progrès."],
      ];

  return (
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
  );
}

function Buy({ lang, navigate }: { lang: Lang; navigate: (page: Page) => void }) {
  const en = lang === "en";
  const steps = en
    ? [
        ["Submit an inquiry", "Share your company, destination, volume range, and intended use."],
        ["Qualification", "Counterparty and compliance information is reviewed."],
        ["Lot verification", "Available lot, photos, assay, and documents are validated."],
        ["Commercial terms", "Both parties review pricing, delivery, and contract terms."],
        ["Execution", "Approved logistics, export, payment, and handover processes begin."],
      ]
    : [
        ["Envoyer une demande", "Indiquez l'entreprise, la destination, le volume et l'usage prévu."],
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

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion">
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}

function Faqs({ lang }: { lang: Lang }) {
  return (
    <section className="narrow-section">
      {faqs.map((faq, index) => <Accordion key={index} question={faq[lang][0]} answer={faq[lang][1]} />)}
    </section>
  );
}

function Contact({ lang, prefill, settings }: { lang: Lang; prefill: string; settings: SiteSettings }) {
  const en = lang === "en";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const phoneHref = `tel:${settings.phone.replace(/[^\d+]/g, "")}`;
  const whatsapp = whatsappLink(
    settings,
    en
      ? "Hello COOMIAC PROJET, I would like to discuss a qualified gold inquiry."
      : "Bonjour COOMIAC PROJET, je souhaite discuter d'une demande qualifiée concernant l'or.",
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    try {
      await createInquiry({
        fullName: String(data.get("name") ?? "").trim(),
        businessEmail: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        inquiryType: (String(data.get("type") ?? "general") as InquiryType),
        message: String(data.get("message") ?? "").trim(),
        consent: data.get("consent") === "on",
      });
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="contact-layout" id="inquiry">
      <div className="contact-aside">
        <span className="eyebrow">{en ? "Direct contact" : "Contact direct"}</span>
        <h2>{en ? "Business starts with a clear conversation." : "Les affaires commencent par un échange clair."}</h2>
        <a href={`mailto:${settings.email}`}>{settings.email}</a>
        <a href={phoneHref}>{settings.phone}</a>
        {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp <Arrow /></a>}
        <p className="micro">{en ? settings.address_en : settings.address_fr}</p>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="field-row">
          <label>{en ? "Full name" : "Nom complet"}
            <input required name="name" maxLength={120} placeholder={en ? "Your name" : "Votre nom"} />
          </label>
          <label>{en ? "Business email" : "E-mail professionnel"}
            <input required type="email" name="email" maxLength={200} placeholder="name@company.com" />
          </label>
        </div>
        <label>{en ? "Company" : "Entreprise"}
          <input required name="company" maxLength={160} placeholder={en ? "Company name" : "Nom de l'entreprise"} />
        </label>
        <label>{en ? "Inquiry type" : "Type de demande"}
          <select name="type" defaultValue={prefill ? "quote" : "general"}>
            <option value="general">{en ? "General partnership" : "Partenariat général"}</option>
            <option value="quote">{en ? `Product quote${prefill ? ` · ${prefill}` : ""}` : `Devis produit${prefill ? ` · ${prefill}` : ""}`}</option>
            <option value="compliance">{en ? "Compliance & documents" : "Conformité et documents"}</option>
          </select>
        </label>
        <label>{en ? "Message" : "Message"}
          <textarea
            required
            rows={5}
            maxLength={4000}
            name="message"
            defaultValue={prefill ? (en ? `I would like a qualified quote for ${prefill}.` : `Je souhaite un devis qualifié pour ${prefill}.`) : ""}
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
        {status === "success" && (
          <p className="success">
            {en
              ? "Thank you — your inquiry has been received. Our team will reply within two business days."
              : "Merci — votre demande a bien été reçue. Notre équipe vous répondra sous deux jours ouvrés."}
          </p>
        )}
        {status === "error" && (
          <p className="error" role="alert">
            {en ? "We couldn't send your inquiry. Please email " : "Nous n'avons pas pu envoyer votre demande. Écrivez à "}
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            {en ? " or message us on WhatsApp." : " ou contactez-nous sur WhatsApp."}
          </p>
        )}
      </form>
    </section>
  );
}

function Footer({ lang, navigate }: { lang: Lang; navigate: (to: string) => void }) {
  const en = lang === "en";
  const explore: Page[] = ["about", "products", "gallery", "sourcing", "buy"];
  const information: (Page | "admin")[] = ["certifications", "faqs", "contact", "admin"];

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <span className="brand-mark"><span>CP</span></span>
          <h2>COOMIAC<br />PROJET</h2>
          <p>Walikale · North Kivu · DRC</p>
        </div>
        <div>
          <b>{en ? "Explore" : "Explorer"}</b>
          {explore.map((page) => <button key={page} onClick={() => navigate(`/${page}`)}>{copy[lang][page]}</button>)}
        </div>
        <div>
          <b>{en ? "Information" : "Informations"}</b>
          {information.map((page) => (
            <button key={page} onClick={() => navigate(page === "admin" ? "/admin" : `/${page}`)}>{copy[lang][page]}</button>
          ))}
        </div>
        <div>
          <b>{en ? "Principle" : "Principe"}</b>
          <p>{en ? "Responsible sourcing. Documented trade. Long-term partnership." : "Approvisionnement responsable. Commerce documenté. Partenariat durable."}</p>
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

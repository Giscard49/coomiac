import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png";

type Lang = "en" | "fr";
type Page = "home" | "about" | "products" | "certifications" | "sourcing" | "buy" | "faqs" | "contact" | "admin";
type Product = { id: number; name: string; category: string; purity: string; weight: string; availability: string; image?: string };
type GalleryItem = { id: number; title: string; category: string; date: string; description: string; image?: string; source: "placeholder" | "real" };

const stockHero = "https://images.unsplash.com/photo-1762463176312-1757d5125c85?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1800";
const stockDetail = "https://images.unsplash.com/photo-1762463176417-2c5e63767bd2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1000";
const stockPattern = "https://images.unsplash.com/photo-1762463176319-8416bf1e6a8e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1000";

const copy = {
  en: {
    home: "Home", about: "About", products: "Gold Products", certifications: "Certifications", sourcing: "Responsible Sourcing",
    buy: "How to Buy", faqs: "FAQs", contact: "Contact", admin: "Admin",
    explore: "Explore Gold", contactUs: "Contact Us", quote: "Request a Quote",
  },
  fr: {
    home: "Accueil", about: "À propos", products: "Produits aurifères", certifications: "Certifications", sourcing: "Approvisionnement responsable",
    buy: "Comment acheter", faqs: "FAQ", contact: "Contact", admin: "Admin",
    explore: "Découvrir l'or", contactUs: "Nous contacter", quote: "Demander un devis",
  },
};

const pageCopy: Record<Exclude<Page, "home" | "admin">, { en: [string, string]; fr: [string, string] }> = {
  about: {
    en: ["A cooperative rooted in Walikale", "COOMIAC PROJET is presented as a gold cooperative based in Walikale, North Kivu. This prototype provides a transparent foundation for future verified corporate, team, and operating information."],
    fr: ["Une coopérative ancrée à Walikale", "COOMIAC PROJET est présentée comme une coopérative aurifère basée à Walikale, au Nord-Kivu. Ce prototype offre une base transparente pour les futures informations vérifiées sur l'entreprise, l'équipe et ses opérations."],
  },
  products: {
    en: ["Gold products", "Browse indicative product formats. Specifications, purity, volumes, pricing, and availability require verification before any transaction."],
    fr: ["Produits aurifères", "Parcourez les formats de produits indicatifs. Les spécifications, la pureté, les volumes, les prix et la disponibilité doivent être vérifiés avant toute transaction."],
  },
  certifications: {
    en: ["Documents & verification", "Trust is built on evidence. Only verified, current documents should be published here."],
    fr: ["Documents et vérification", "La confiance repose sur des preuves. Seuls les documents vérifiés et à jour doivent être publiés ici."],
  },
  sourcing: {
    en: ["Responsible sourcing", "A commitment framework for traceability, due diligence, community respect, and continuous improvement."],
    fr: ["Approvisionnement responsable", "Un cadre d'engagement pour la traçabilité, le devoir de diligence, le respect des communautés et l'amélioration continue."],
  },
  buy: {
    en: ["A clear path to qualified trade", "Every inquiry follows a structured review before commercial terms or product claims are confirmed."],
    fr: ["Un parcours clair vers un commerce qualifié", "Chaque demande suit un examen structuré avant la confirmation des conditions commerciales ou des caractéristiques du produit."],
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

const initialProducts: Product[] = [
  { id: 1, name: "Gold Doré", category: "Doré", purity: "To be assayed", weight: "Lot dependent", availability: "By verification", image: stockDetail },
  { id: 2, name: "Alluvial Gold Lot", category: "Alluvial", purity: "To be assayed", weight: "Lot dependent", availability: "Inquiry required" },
  { id: 3, name: "Buyer-Specified Lot", category: "Custom", purity: "Per verified assay", weight: "By agreement", availability: "Qualification required", image: stockPattern },
];

const faqs = [
  { en: ["Can you confirm current stock or purity?", "Not through this prototype. Stock, purity, assay results, and availability must be verified for each lot before an offer."], fr: ["Pouvez-vous confirmer le stock ou la pureté ?", "Pas via ce prototype. Le stock, la pureté, les résultats d'analyse et la disponibilité doivent être vérifiés pour chaque lot avant toute offre."] },
  { en: ["What documents can buyers review?", "Verified registration, licenses, assay reports, and export documentation may be shared when uploaded and appropriate for the transaction."], fr: ["Quels documents les acheteurs peuvent-ils consulter ?", "Les documents vérifiés d'enregistrement, licences, rapports d'analyse et documents d'exportation peuvent être partagés une fois téléversés et selon la transaction."] },
  { en: ["How does buyer onboarding work?", "We review the buyer's organization, intended use, destination, compliance profile, and commercial requirements before proceeding."], fr: ["Comment fonctionne l'intégration d'un acheteur ?", "Nous examinons l'organisation, l'usage prévu, la destination, le profil de conformité et les besoins commerciaux avant de poursuivre."] },
  { en: ["Is imagery on this site authentic?", "Stock editorial images are clearly labeled. Cooperative-owned product, visit, and sourcing photography will only appear as real after administrator verification."], fr: ["Les images de ce site sont-elles authentiques ?", "Les images d'illustration sont clairement identifiées. Les photos de produits, visites et approvisionnement de la coopérative n'apparaîtront comme réelles qu'après vérification par un administrateur."] },
];

function Arrow() { return <span aria-hidden="true">↗</span>; }

function AppButton({ children, onClick, kind = "gold", type = "button", disabled = false }: { children: ReactNode; onClick?: () => void; kind?: "gold" | "outline" | "ghost"; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${kind}`}>{children}</button>;
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

function App() {
  const getPath = () => (window.location.pathname.replace("/", "") || "home") as Page;
  const [page, setPage] = useState<Page>(getPath());
  const [lang, setLang] = useState<Lang>("en");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [menu, setMenu] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [quoteProduct, setQuoteProduct] = useState("");
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const handle = () => setPage(getPath());
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  const navigate = (next: Page, anchor?: string) => {
    window.history.pushState({}, "", next === "home" ? "/" : `/${next}`);
    setPage(next); setMenu(false);
    setTimeout(() => anchor ? document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }) : window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const requestQuote = (name: string) => { setQuoteProduct(name); navigate("contact", "inquiry"); };
  const nav: Page[] = ["home", "about", "products", "certifications", "sourcing", "buy", "faqs", "contact"];

  if (page === "admin") return <Admin lang={lang} setLang={setLang} dark={dark} setDark={setDark} navigate={navigate} products={products} setProducts={setProducts} />;

  return (
    <div className="app">
      <header className="header">
     <button
  className="brand"
  onClick={() => navigate("home")}
  aria-label="COOMIAC PROJET home"
>
  <img
    className="brand-logo"
    src="/src/assets/logo.png"
    alt="COOMIAC PROJET WALIKALE"
  />
</button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {nav.map(n => <button key={n} className={page === n ? "active" : ""} onClick={() => navigate(n)}>{t[n]}</button>)}
        </nav>
        <div className="header-actions">
          <button className="utility" onClick={() => setLang(lang === "en" ? "fr" : "en")} aria-label="Change language">{lang === "en" ? "FR" : "EN"}</button>
          <button className="utility" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? "☼" : "◐"}</button>
          <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? "×" : "☰"}</button>
        </div>
      </header>

      <main>
        {page === "home" && <Home lang={lang} navigate={navigate} requestQuote={requestQuote} />}
        {page !== "home" && page !== "products" && page !== "certifications" && page !== "sourcing" && page !== "buy" && page !== "faqs" && page !== "contact" && <GenericHero page={page} lang={lang} />}
        {page === "about" && <About lang={lang} />}
        {page === "products" && <Products lang={lang} products={products} requestQuote={requestQuote} />}
        {page === "certifications" && <Certifications lang={lang} />}
        {page === "sourcing" && <Sourcing lang={lang} />}
        {page === "buy" && <Buy lang={lang} navigate={navigate} />}
        {page === "faqs" && <Faqs lang={lang} />}
        
        {page === "contact" && <Contact lang={lang} prefill={quoteProduct} />}
      </main>

      

<a
  className="whatsapp-float"
  href={`https://wa.me/250796145610?text=${encodeURIComponent(
    "Bonjour COOMIAC PROJET, je souhaite en savoir plus sur vos produits aurifères et vos opportunités commerciales."
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Chat with us on WhatsApp"
>
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.45 0 .08 5.37.08 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a11.9 11.9 0 0 0 5.82 1.48h.01c6.59 0 11.96-5.37 11.96-11.96 0-3.2-1.25-6.21-3.49-8.41ZM12.05 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.69.97.99-3.6-.23-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.89-9.9 9.89Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z"/>
  </svg>
</a>


      <Footer lang={lang} navigate={navigate} />
    </div>

  );
}



function Home({ lang, navigate, requestQuote }: { lang: Lang; navigate: (p: Page, a?: string) => void; requestQuote: (n: string) => void }) {
  const en = lang === "en";
  return <>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.94) 0%, rgba(5,5,5,.58) 58%, rgba(5,5,5,.18) 100%), url(${stockHero})` }}>
      <div className="stock-label">{en ? "" : ""}</div>
      <div className="hero-content">
        <span className="eyebrow">{en ? "Walikale · North Kivu · DRC" : "Walikale · Nord-Kivu · RDC"}</span>
        <h1>{en ? "Connecting the World to Gold from the Heart of the DRC" : "Relier le monde à l'or au cœur de la RDC"}</h1>
        <p>{en ? "A credible gateway for responsible, transparent, and professionally managed gold trade." : "Une passerelle crédible pour un commerce de l'or responsable, transparent et professionnel."}</p>
        <div className="button-row"><AppButton onClick={() => navigate("products")}>{en ? "Explore Gold" : "Découvrir l'or"} <Arrow /></AppButton><AppButton kind="outline" onClick={() => navigate("contact")}>{en ? "Contact Us" : "Nous contacter"}</AppButton></div>
      </div>
      <div className="hero-index"><span>01</span><i></i><small>{en ? "A new standard of clarity" : "Un nouveau standard de clarté"}</small></div>
    </section>
    <section className="intro split">
      <SectionTitle eyebrow={en ? "Our cooperative" : "Notre coopérative"} title={en ? "Rooted locally. Ready for accountable trade." : "Ancrée localement. Prête pour un commerce responsable."} />
      <div><p className="lead">{en ? "COOMIAC PROJET connects qualified international buyers with a cooperative-led sourcing approach in Walikale." : "COOMIAC PROJET relie des acheteurs internationaux qualifiés à une approche d'approvisionnement coopérative à Walikale."}</p><p>{en ? "All product details, documents, and claims remain subject to verification. We believe transparency comes before transaction." : "Tous les détails, documents et déclarations sur les produits restent soumis à vérification. Pour nous, la transparence précède toute transaction."}</p><button className="text-link" onClick={() => navigate("about")}>{en ? "Discover our approach" : "Découvrir notre approche"} <Arrow /></button></div>
    </section>
    <section className="product-feature">
      <div className="feature-image" style={{ backgroundImage: `url(${stockDetail})` }}><span className="stock-label">{en ? "Editorial stock image" : "Image d'illustration"}</span></div>
      <div className="feature-content"><span className="eyebrow">{en ? "Product inquiries" : "Demandes produits"}</span><h2>{en ? "Gold lots, documented with discipline." : "Des lots d'or documentés avec rigueur."}</h2><p>{en ? "Each commercial discussion begins with buyer qualification and lot-specific verification. No unverified purity, volume, or availability claims." : "Chaque échange commercial commence par la qualification de l'acheteur et la vérification du lot. Aucune déclaration non vérifiée de pureté, volume ou disponibilité."}</p><AppButton onClick={() => requestQuote("Gold Doré")}>{en ? "Request a qualified quote" : "Demander un devis qualifié"} <Arrow /></AppButton></div>
    </section>
    <section className="home-trust">
      <SectionTitle eyebrow={en ? "Built for trust" : "Fondé sur la confiance"} title={en ? "Evidence before claims." : "Les preuves avant les déclarations."} text={en ? "A professional framework for every stage of the relationship." : "Un cadre professionnel à chaque étape de la relation."} />
      <div className="three-grid">
        {[
          [en ? "Responsible sourcing" : "Approvisionnement responsable", en ? "Traceability and due diligence principles guide the process." : "Les principes de traçabilité et de diligence guident le processus.", "sourcing" as Page],
          [en ? "Verified documents" : "Documents vérifiés", en ? "Only current, administrator-verified records are published." : "Seuls les documents actuels et vérifiés sont publiés.", "certifications" as Page],
          [en ? "Structured buying" : "Achat structuré", en ? "Qualification, verification, terms, then execution." : "Qualification, vérification, conditions, puis exécution.", "buy" as Page],
        ].map((x, i) => <article className="trust-card" key={String(x[0])}><span>0{i + 1}</span><h3>{x[0]}</h3><p>{x[1]}</p><button className="circle-link" onClick={() => navigate(x[2] as Page)} aria-label={`Open ${x[0]}`}><Arrow /></button></article>)}
      </div>
    </section>
    <section className="faq-preview split">
      <SectionTitle eyebrow="FAQ" title={en ? "Clarity from the first question." : "La clarté dès la première question."} />
      <div>{faqs.slice(0, 3).map((f, i) => <Accordion key={i} question={f[lang][0]} answer={f[lang][1]} />)}<button className="text-link" onClick={() => navigate("faqs")}>{en ? "View all questions" : "Voir toutes les questions"} <Arrow /></button></div>
    </section>
  </>;
}

function GenericHero({ page, lang }: { page: Exclude<Page, "home" | "admin">; lang: Lang }) {
  const c = pageCopy[page][lang];
  return <section className="page-hero"><span className="eyebrow">COOMIAC PROJET · {copy[lang][page]}</span><h1>{c[0]}</h1><p>{c[1]}</p></section>;
}

function About({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return <><section className="content-section split"><SectionTitle eyebrow={en ? "Our purpose" : "Notre raison d'être"} title={en ? "Local value. International discipline." : "Valeur locale. Rigueur internationale."} /><div><p className="lead">{en ? "Our ambition is to create a clear, responsible bridge between local gold production and qualified global buyers." : "Notre ambition est de créer un lien clair et responsable entre la production aurifère locale et les acheteurs mondiaux qualifiés."}</p><p>{en ? "This digital experience is a prototype. Corporate history, membership, leadership, facilities, and operating scope must be validated by COOMIAC PROJET before publication." : "Cette expérience numérique est un prototype. L'historique, les membres, la direction, les installations et le périmètre d'activité doivent être validés par COOMIAC PROJET avant publication."}</p></div></section><Metrics lang={lang} /></>;
}

function Metrics({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return <section className="metrics"><div><strong>DRC</strong><span>{en ? "Country of operation" : "Pays d'activité"}</span></div><div><strong>Walikale</strong><span>{en ? "Stated cooperative base" : "Base déclarée de la coopérative"}</span></div><div><strong>100%</strong><span>{en ? "Claims require evidence" : "Des déclarations exigent des preuves"}</span></div></section>;
}

function Products({ lang, products, requestQuote }: { lang: Lang; products: Product[]; requestQuote: (n: string) => void }) {
  const [filter, setFilter] = useState("All"); const en = lang === "en";
  const categories = ["All", ...new Set(products.map(p => p.category))];
  return <><GenericHero page="products" lang={lang} /><section className="listing-section"><div className="filters">{categories.map(c => <button className={filter === c ? "selected" : ""} key={c} onClick={() => setFilter(c)}>{c === "All" ? (en ? "All products" : "Tous les produits") : c}</button>)}</div><div className="product-grid">{products.filter(p => filter === "All" || p.category === filter).map(p => <article className="product-card" key={p.id}>{p.image ? <div className="product-img" style={{ backgroundImage: `url(${p.image})` }}><span className="stock-label">{en ? "Editorial stock image" : "Image d'illustration"}</span></div> : <div className="photo-placeholder">{en ? "Verified lot photo pending" : "Photo vérifiée du lot en attente"}</div>}<div className="product-body"><span className="eyebrow">{p.category}</span><h3>{p.name}</h3><dl><div><dt>{en ? "Purity" : "Pureté"}</dt><dd>{p.purity}</dd></div><div><dt>{en ? "Weight" : "Poids"}</dt><dd>{p.weight}</dd></div><div><dt>{en ? "Availability" : "Disponibilité"}</dt><dd>{p.availability}</dd></div></dl><AppButton onClick={() => requestQuote(p.name)}>{en ? "Request a Quote" : "Demander un devis"} <Arrow /></AppButton></div></article>)}</div></section></>;
}

function Certifications({ lang }: { lang: Lang }) {
  const en = lang === "en"; const docs = en ? ["Cooperative registration", "Operating licenses", "Lot assay reports", "Export documentation"] : ["Enregistrement de la coopérative", "Licences d'exploitation", "Rapports d'analyse des lots", "Documents d'exportation"];
  return <><GenericHero page="certifications" lang={lang} /><section className="content-section"><div className="doc-grid">{docs.map((d, i) => <article className="doc-card" key={d}><span className="doc-icon">0{i + 1}</span><div><h3>{d}</h3><p>{en ? "Verified document not yet uploaded" : "Document vérifié non encore téléversé"}</p></div><span className="pending">{en ? "Pending" : "En attente"}</span></article>)}</div><div className="notice"><b>{en ? "Verification notice" : "Avis de vérification"}</b><p>{en ? "No certification, approval, registration, or license is claimed by these placeholders. Document previews and downloads become available only after a verified file is uploaded." : "Ces espaces réservés ne constituent aucune déclaration de certification, d'agrément, d'enregistrement ou de licence. L'aperçu et le téléchargement ne sont disponibles qu'après le téléversement d'un fichier vérifié."}</p></div></section></>;
}

function Sourcing({ lang }: { lang: Lang }) {
  const en = lang === "en"; const items = en ? [["Traceability", "Record origin and chain-of-custody information at lot level."], ["Due diligence", "Review risks, counterparties, and supporting evidence."], ["People & communities", "Promote dignity, safety, and respectful local engagement."], ["Continuous improvement", "Document gaps, corrective actions, and progress."]] : [["Traçabilité", "Consigner l'origine et la chaîne de contrôle au niveau du lot."], ["Devoir de diligence", "Examiner les risques, les contreparties et les preuves."], ["Personnes et communautés", "Promouvoir la dignité, la sécurité et l'engagement local respectueux."], ["Amélioration continue", "Documenter les écarts, les actions correctives et les progrès."]];
  return <><GenericHero page="sourcing" lang={lang} /><section className="content-section"><div className="steps-grid">{items.map((x, i) => <article key={x[0]}><span>0{i + 1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div><div className="notice"><b>{en ? "Commitment, not certification" : "Un engagement, pas une certification"}</b><p>{en ? "This page describes a working framework and does not claim third-party certification or compliance status." : "Cette page décrit un cadre de travail et ne revendique aucune certification tierce ni aucun statut de conformité."}</p></div></section></>;
}

function Buy({ lang, navigate }: { lang: Lang; navigate: (p: Page) => void }) {
  const en = lang === "en"; const steps = en ? [["Submit an inquiry", "Share company, destination, volume range, and intended use."], ["Qualification", "Counterparty and compliance information is reviewed."], ["Lot verification", "Available lot, photos, assay, and documents are validated."], ["Commercial terms", "Both parties review pricing, delivery, and contract terms."], ["Execution", "Approved logistics, export, payment, and handover processes begin."]] : [["Envoyer une demande", "Indiquez l'entreprise, la destination, le volume et l'usage prévu."], ["Qualification", "Les informations de contrepartie et de conformité sont examinées."], ["Vérification du lot", "Le lot, les photos, l'analyse et les documents sont validés."], ["Conditions commerciales", "Les parties examinent prix, livraison et contrat."], ["Exécution", "Les processus approuvés de logistique, exportation, paiement et transfert débutent."]];
  return <><GenericHero page="buy" lang={lang} /><section className="content-section"><div className="buy-steps">{steps.map((x, i) => <article key={x[0]}><b>{String(i + 1).padStart(2, "0")}</b><div><h3>{x[0]}</h3><p>{x[1]}</p></div></article>)}</div><AppButton onClick={() => navigate("contact")}>{en ? "Begin an inquiry" : "Démarrer une demande"} <Arrow /></AppButton></section></>;
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return <div className="accordion"><button onClick={() => setOpen(!open)} aria-expanded={open}><span>{question}</span><b>{open ? "−" : "+"}</b></button>{open && <p>{answer}</p>}</div>;
}

function Faqs({ lang }: { lang: Lang }) {
  return <><GenericHero page="faqs" lang={lang} /><section className="narrow-section">{faqs.map((f, i) => <Accordion key={i} question={f[lang][0]} answer={f[lang][1]} />)}</section></>;
}

function Contact({ lang, prefill }: { lang: Lang; prefill: string }) {
  const en = lang === "en"; const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const submit = (e: FormEvent) => { e.preventDefault(); setStatus("loading"); setTimeout(() => setStatus("success"), 900); };
  return <><GenericHero page="contact" lang={lang} /><section className="contact-layout" id="inquiry"><div className="contact-aside"><span className="eyebrow">{en ? "Direct contact" : "Contact direct"}</span><h2>{en ? "Business starts with a clear conversation." : "Les affaires commencent par un échange clair."}</h2><a href="mailto:contact@coomiac-projet.cd">contact@coomiac-projet.cd</a><a href="tel:+243000000000">+243 000 000 000 <small>{en ? "placeholder" : "provisoire"}</small></a><a href={`https://wa.me/243000000000?text=${encodeURIComponent(en ? "Hello COOMIAC PROJET, I would like to discuss a qualified gold inquiry." : "Bonjour COOMIAC PROJET, je souhaite discuter d'une demande qualifiée concernant l'or.")}`} target="_blank" rel="noreferrer">WhatsApp <Arrow /></a><p className="micro">{en ? "Contact details are placeholders pending cooperative verification." : "Les coordonnées sont provisoires, en attente de vérification par la coopérative."}</p></div><form className="form" onSubmit={submit}><div className="field-row"><label>{en ? "Full name" : "Nom complet"}<input required name="name" placeholder={en ? "Your name" : "Votre nom"} /></label><label>{en ? "Business email" : "E-mail professionnel"}<input required type="email" name="email" placeholder="name@company.com" /></label></div><label>{en ? "Company" : "Entreprise"}<input required name="company" placeholder={en ? "Company name" : "Nom de l'entreprise"} /></label><label>{en ? "Inquiry type" : "Type de demande"}<select name="type" defaultValue={prefill ? "quote" : "general"}><option value="general">{en ? "General partnership" : "Partenariat général"}</option><option value="quote">{en ? `Product quote${prefill ? ` · ${prefill}` : ""}` : `Devis produit${prefill ? ` · ${prefill}` : ""}`}</option><option value="compliance">{en ? "Compliance & documents" : "Conformité et documents"}</option></select></label><label>{en ? "Message" : "Message"}<textarea required rows={5} defaultValue={prefill ? (en ? `I would like a qualified quote for ${prefill}.` : `Je souhaite un devis qualifié pour ${prefill}.`) : ""} /></label><label className="check"><input type="checkbox" required /><span>{en ? "I confirm that the information is accurate and I consent to being contacted." : "Je confirme l'exactitude des informations et j'accepte d'être contacté."}</span></label><AppButton type="submit" disabled={status === "loading"}>{status === "loading" ? (en ? "Sending…" : "Envoi…") : (en ? "Send inquiry" : "Envoyer la demande")} <Arrow /></AppButton>{status === "success" && <p className="success">{en ? "Prototype submitted successfully. Connect a secure email service for production delivery." : "Prototype envoyé avec succès. Connectez un service d'e-mail sécurisé pour la mise en production."}</p>}</form></section></>;
}

function Footer({ lang, navigate }: { lang: Lang; navigate: (p: Page) => void }) {
  const en = lang === "en";
  return <footer><div className="footer-top"><div className="footer-brand"><span className="brand-mark">CP</span><h2>COOMIAC<br />PROJET</h2><p>Walikale · North Kivu · DRC</p></div><div><b>{en ? "Navigate" : "Navigation"}</b>{(["about", "products", "sourcing", "buy"] as Page[]).map(p => <button key={p} onClick={() => navigate(p)}>{copy[lang][p]}</button>)}</div><div><b>{en ? "Information" : "Informations"}</b>{(["certifications", "faqs", "contact", "admin"] as Page[]).map(p => <button key={p} onClick={() => navigate(p)}>{copy[lang][p]}</button>)}</div><div><b>{en ? "Principle" : "Principe"}</b><p>{en ? "Evidence before claims. Qualification before transaction." : "Les preuves avant les déclarations. La qualification avant la transaction."}</p></div></div><div className="footer-bottom"><span>© 2026 COOMIAC PROJET</span><span>{en ? "Website prototype · Claims require verification" : "Prototype de site · Déclarations soumises à vérification"}</span></div></footer>;
}

function Admin({ lang, setLang, dark, setDark, navigate, products, setProducts }: { lang: Lang; setLang: (l: Lang) => void; dark: boolean; setDark: (d: boolean) => void; navigate: (p: Page) => void; products: Product[]; setProducts: (p: Product[]) => void }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("coomiac-admin") === "true"); const [error, setError] = useState(""); const en = lang === "en";
  const [tab, setTab] = useState<"overview" | "products" | "gallery" | "translation">("overview");
  const [gallery, setGallery] = useState<GalleryItem[]>([{ id: 1, title: "Gold lot photo", category: "Products", date: "Pending", description: "Upload a verified cooperative-owned photo.", source: "placeholder" }]);
  const login = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); if (data.get("email") === "admin@coomiac.demo" && data.get("password") === "demo123") { sessionStorage.setItem("coomiac-admin", "true"); setAuthed(true); } else setError(en ? "Use the prototype credentials shown below." : "Utilisez les identifiants de prototype ci-dessous."); };
  if (!authed) return <div className="admin-login"><button className="brand" onClick={() => navigate("home")}><span className="brand-mark">CP</span><span><b>COOMIAC</b><small>PROJET · ADMIN</small></span></button><form onSubmit={login}><span className="eyebrow">{en ? "Protected area" : "Espace protégé"}</span><h1>{en ? "Admin sign in" : "Connexion admin"}</h1><p>{en ? "Prototype access only. Production requires secure backend authentication and roles." : "Accès au prototype uniquement. La production exige une authentification serveur sécurisée et des rôles."}</p><label>Email<input type="email" name="email" required defaultValue="admin@coomiac.demo" /></label><label>{en ? "Password" : "Mot de passe"}<input type="password" name="password" required defaultValue="demo123" /></label>{error && <p className="error">{error}</p>}<AppButton type="submit">{en ? "Sign in" : "Se connecter"} <Arrow /></AppButton><small>admin@coomiac.demo · demo123</small></form></div>;
  const addPhoto = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const d = new FormData(e.currentTarget); setGallery([...gallery, { id: Date.now(), title: String(d.get("title")), category: String(d.get("category")), date: String(d.get("date")), description: String(d.get("description")), source: "real", image: stockDetail }]); e.currentTarget.reset(); };
  const addProduct = () => setProducts([...products, { id: Date.now(), name: en ? "New draft lot" : "Nouveau lot brouillon", category: "Custom", purity: "To be assayed", weight: "Pending", availability: "Draft" }]);
  const tabs = { overview: en ? "Overview" : "Aperçu", products: en ? "Products" : "Produits", gallery: en ? "Photo gallery" : "Galerie photo", translation: en ? "Translation" : "Traduction" };
  return <div className="admin-shell"><aside><button className="brand" onClick={() => navigate("home")}><span className="brand-mark">CP</span><span><b>COOMIAC</b><small>ADMIN CONSOLE</small></span></button><nav>{Object.entries(tabs).map(([k, v]) => <button className={tab === k ? "active" : ""} key={k} onClick={() => setTab(k as typeof tab)}>{v}</button>)}</nav><button className="logout" onClick={() => { sessionStorage.removeItem("coomiac-admin"); setAuthed(false); }}>{en ? "Sign out" : "Se déconnecter"}</button></aside><main><header><div><span className="eyebrow">{en ? "Content workspace" : "Espace de contenu"}</span><h1>{tabs[tab]}</h1></div><div className="header-actions"><button className="utility" onClick={() => setLang(en ? "fr" : "en")}>{en ? "FR" : "EN"}</button><button className="utility" onClick={() => setDark(!dark)}>{dark ? "☼" : "◐"}</button><AppButton kind="outline" onClick={() => navigate("home")}>{en ? "View site" : "Voir le site"} <Arrow /></AppButton></div></header>{tab === "overview" && <AdminOverview en={en} />}{tab === "products" && <section className="admin-panel"><div className="panel-head"><div><h2>{en ? "Product listings" : "Fiches produits"}</h2><p>{en ? "Draft specifications remain visibly unverified." : "Les spécifications provisoires restent visiblement non vérifiées."}</p></div><AppButton onClick={addProduct}>{en ? "Add product" : "Ajouter un produit"} +</AppButton></div>{products.map(p => <div className="admin-row" key={p.id}><div><b>{p.name}</b><small>{p.category} · {p.availability}</small></div><button onClick={() => setProducts(products.filter(x => x.id !== p.id))}>{en ? "Delete" : "Supprimer"}</button></div>)}</section>}{tab === "gallery" && <section className="admin-grid"><form className="admin-panel upload-form" onSubmit={addPhoto}><h2>{en ? "Add verified photo" : "Ajouter une photo vérifiée"}</h2><div className="upload-zone"><b>{en ? "Choose image" : "Choisir une image"}</b><span>{en ? "Prototype uses a demo preview" : "Le prototype utilise un aperçu démo"}</span></div><label>{en ? "Caption" : "Légende"}<input name="title" required /></label><label>{en ? "Category" : "Catégorie"}<select name="category"><option>Products</option><option>Sourcing</option><option>Visits</option><option>Facilities</option></select></label><label>{en ? "Description" : "Description"}<textarea name="description" required rows={3} /></label><label>{en ? "Date" : "Date"}<input type="date" name="date" required /></label><AppButton type="submit">{en ? "Upload photo" : "Téléverser la photo"}</AppButton></form><div className="admin-panel"><h2>{en ? "Gallery items" : "Éléments de la galerie"}</h2>{gallery.map(g => <div className="gallery-row" key={g.id}>{g.image ? <img src={g.image} alt="" /> : <div className="gallery-placeholder">CP</div>}<div><b>{g.title}</b><small>{g.category} · {g.date}</small><span className={g.source === "real" ? "verified" : "pending"}>{g.source === "real" ? (en ? "Marked real" : "Marquée réelle") : (en ? "Placeholder" : "Espace réservé")}</span></div><button onClick={() => setGallery(gallery.filter(x => x.id !== g.id))}>×</button></div>)}</div></section>}{tab === "translation" && <section className="admin-panel translation"><div className="status-line"><span className="status-dot"></span><div><h2>{en ? "Translation service not connected" : "Service de traduction non connecté"}</h2><p>{en ? "Production requires a secure serverless endpoint. API keys must never be stored in this client." : "La production exige un endpoint serverless sécurisé. Les clés API ne doivent jamais être stockées dans ce client."}</p></div></div><div className="translation-rule"><b>EN → FR</b><p>{en ? "On English save: translate only empty or explicitly requested French fields; preserve manual French corrections." : "Lors de l'enregistrement anglais : traduire uniquement les champs français vides ou explicitement demandés ; préserver les corrections manuelles."}</p><span className="pending">{en ? "Setup required" : "Configuration requise"}</span></div><AppButton kind="outline" onClick={() => alert(en ? "Retry queued (prototype). Connect the backend endpoint to process it." : "Nouvel essai en attente (prototype). Connectez l'endpoint serveur.")}>{en ? "Retry connection" : "Réessayer la connexion"}</AppButton></section>}</main></div>;
}

function AdminOverview({ en }: { en: boolean }) {
  const cards = [[en ? "Products" : "Produits", "3", en ? "All require verification" : "Tous à vérifier"], [en ? "Verified photos" : "Photos vérifiées", "0", en ? "Upload real imagery" : "Téléverser des images réelles"], [en ? "Documents" : "Documents", "0", en ? "No claims published" : "Aucune déclaration publiée"]];
  return <><div className="admin-stats">{cards.map(x => <article key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></article>)}</div><section className="admin-panel"><h2>{en ? "Production readiness" : "Préparation à la production"}</h2>{[en ? "Secure authentication and role permissions" : "Authentification sécurisée et permissions", en ? "Database and object storage" : "Base de données et stockage d'objets", en ? "Server-side translation API with retry queue" : "API de traduction côté serveur avec file d'attente", en ? "Transactional email and inquiry routing" : "E-mail transactionnel et routage des demandes"].map(x => <div className="check-row" key={x}><span>○</span>{x}<b>{en ? "Required" : "Requis"}</b></div>)}</section></>;
}

export default App;

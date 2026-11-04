import type { Timestamp } from "firebase/firestore";
import { mineralPhotos, sitePhotos } from "../assets/photos";

export type Lang = "en" | "fr";

export type Product = {
  id: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  spec_en: string;
  spec_fr: string;
  imageUrl: string;
  category: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type GalleryItem = {
  id: string;
  imageUrl: string;
  caption_en: string;
  caption_fr: string;
  order: number;
  createdAt?: Timestamp | null;
};

export type InquiryType = "general" | "quote" | "compliance";

export type InquiryStatus = "new" | "replied";

export type Inquiry = {
  id: string;
  fullName: string;
  businessEmail: string;
  company: string;
  inquiryType: InquiryType;
  message: string;
  consent: boolean;
  status: InquiryStatus;
  replyCount: number;
  lastReplyAt?: Timestamp | null;
  createdAt?: Timestamp | null;
};

export type InquiryReply = {
  id: string;
  subject: string;
  message: string;
  to: string;
  from: string;
  sentAt?: Timestamp | null;
  sentBy?: string;
};

export type SiteSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address_en: string;
  address_fr: string;
  updatedAt?: Timestamp | null;
};

export type TranslationCacheEntry = {
  id: string;
  sourceText: string;
  target: Lang;
  translated: string;
  createdAt?: Timestamp | null;
};

/** Official public contact details used whenever Firestore has no override. */
export const defaultSettings: SiteSettings = {
  email: "coomiaec@gmail.com",
  phone: "+243 813 236 392",
  whatsapp: "243813236392",
  address_en: "Walikale, North Kivu, DR Congo",
  address_fr: "Walikale, Nord-Kivu, RD Congo",
};

/**
 * These values shipped with the first version of the site. If they are still in
 * Firestore they are treated as placeholders, so the current contact details
 * below replace them without an admin having to edit anything.
 */
const legacySettings = {
  emails: ["contact@coomiac-projet.cd"],
  phones: ["+250 796 145 610", "+250796145610", "250796145610"],
  whatsapps: ["250796145610"],
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Merges Firestore settings with defaults, ignoring legacy placeholder values. */
export function normalizeSettings(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  const email = clean(stored?.email);
  const phone = clean(stored?.phone);
  const whatsapp = clean(stored?.whatsapp);
  return {
    email: email && !legacySettings.emails.includes(email.toLowerCase()) ? email : defaultSettings.email,
    phone: phone && !legacySettings.phones.includes(phone) ? phone : defaultSettings.phone,
    whatsapp: whatsapp && !legacySettings.whatsapps.includes(whatsapp) ? whatsapp : defaultSettings.whatsapp,
    address_en: clean(stored?.address_en) || defaultSettings.address_en,
    address_fr: clean(stored?.address_fr) || defaultSettings.address_fr,
    updatedAt: stored?.updatedAt ?? null,
  };
}

/**
 * Displayed when Firebase is not configured yet or the products collection is
 * empty, so the public site always looks complete. Replace these in
 * Admin → Products once Firebase is connected.
 */
export const demoProducts: Product[] = [
  {
    id: "demo-coltan",
    title_en: "Coltan",
    title_fr: "Coltan",
    description_en:
      "Tantalum-bearing coltan from the Walikale belt, hand-sorted and bagged per lot for smelters, refiners and trading partners. Assays and origin documents accompany every shipment.",
    description_fr:
      "Coltan tantalifère de la ceinture de Walikale, trié à la main et conditionné par lot pour les fonderies, affineurs et partenaires commerciaux. Chaque expédition est accompagnée d'analyses et de documents d'origine.",
    spec_en: "Ta₂O₅ concentrate · assay per lot",
    spec_fr: "Concentré de Ta₂O₅ · analyse par lot",
    imageUrl: mineralPhotos.coltan,
    category: "Critical minerals",
  },
  {
    id: "demo-cassiterite",
    title_en: "Cassiterite",
    title_fr: "Cassitérite",
    description_en:
      "Tin ore (SnO₂) sourced from the Congo tin belt, washed, graded and prepared for export with lot-level traceability.",
    description_fr:
      "Minerai d'étain (SnO₂) issu de la ceinture stannifère congolaise, lavé, trié et préparé pour l'exportation avec une traçabilité par lot.",
    spec_en: "SnO₂ concentrate · assay per lot",
    spec_fr: "Concentré de SnO₂ · analyse par lot",
    imageUrl: mineralPhotos.cassiterite,
    category: "Critical minerals",
  },
  {
    id: "demo-copper",
    title_en: "Copper",
    title_fr: "Cuivre",
    description_en:
      "Copper cathodes and run-of-mine ore, documented and prepared for international buyers. Grades, volumes and delivery terms are confirmed per lot.",
    description_fr:
      "Cathodes de cuivre et minerai brut, documentés et préparés pour les acheteurs internationaux. Les teneurs, volumes et conditions de livraison sont confirmés par lot.",
    spec_en: "Cu cathode & ore · assay per lot",
    spec_fr: "Cathode Cu et minerai · analyse par lot",
    imageUrl: mineralPhotos.copper,
    category: "Base metals",
  },
  {
    id: "demo-cobalt",
    title_en: "Cobalt",
    title_fr: "Cobalt",
    description_en:
      "Cobalt ore and hydroxide from Congolese production, screened and documented for battery supply chains and industrial buyers.",
    description_fr:
      "Minerai et hydroxyde de cobalt issus de la production congolaise, criblés et documentés pour les chaînes d'approvisionnement des batteries et les acheteurs industriels.",
    spec_en: "Co ore & hydroxide · assay per lot",
    spec_fr: "Minerai et hydroxyde de Co · analyse par lot",
    imageUrl: mineralPhotos.cobalt,
    category: "Critical minerals",
  },
  {
    id: "demo-gold",
    title_en: "Gold",
    title_fr: "Or",
    description_en:
      "Doré bars and alluvial gold from Walikale, prepared with care and supported by assay and origin documentation for qualified buyers.",
    description_fr:
      "Barres dorées et or alluvionnaire de Walikale, préparés avec soin et accompagnés de documents d'analyse et d'origine pour les acheteurs qualifiés.",
    spec_en: "Au doré & alluvial · assay per lot",
    spec_fr: "Or doré et alluvionnaire · analyse par lot",
    imageUrl: mineralPhotos.gold,
    category: "Precious metals",
  },
];

export const demoGallery: GalleryItem[] = [
  {
    id: "demo-gallery-walikale",
    imageUrl: sitePhotos.walikale,
    caption_en: "Walikale, North Kivu — the land behind our supply chain.",
    caption_fr: "Walikale, Nord-Kivu — la terre derrière notre chaîne d'approvisionnement.",
    order: 0,
  },
  {
    id: "demo-gallery-coltan",
    imageUrl: sitePhotos.coltanMine,
    caption_en: "Artisanal coltan workings near Rubaya, North Kivu.",
    caption_fr: "Exploitation artisanale de coltan près de Rubaya, Nord-Kivu.",
    order: 1,
  },
  {
    id: "demo-gallery-cathode",
    imageUrl: sitePhotos.cathode,
    caption_en: "Copper cathode bundles prepared for export.",
    caption_fr: "Lots de cathodes de cuivre préparés pour l'exportation.",
    order: 2,
  },
  {
    id: "demo-gallery-gold",
    imageUrl: mineralPhotos.gold,
    caption_en: "Gold, sorted and documented lot by lot.",
    caption_fr: "Or, trié et documenté lot par lot.",
    order: 3,
  },
  {
    id: "demo-gallery-cassiterite",
    imageUrl: mineralPhotos.cassiterite,
    caption_en: "Cassiterite concentrate from the Congo tin belt.",
    caption_fr: "Concentré de cassitérite de la ceinture stannifère congolaise.",
    order: 4,
  },
  {
    id: "demo-gallery-mining",
    imageUrl: sitePhotos.mining,
    caption_en: "A working pit in eastern DR Congo.",
    caption_fr: "Une fosse d'exploitation dans l'est de la RD Congo.",
    order: 5,
  },
];

/** Human labels for the category values used in the admin console. */
export const productCategories = ["Critical minerals", "Base metals", "Precious metals"];

const categoryLabels: Record<string, { en: string; fr: string }> = {
  "Critical minerals": { en: "Critical minerals", fr: "Minéraux critiques" },
  "Base metals": { en: "Base metals", fr: "Métaux de base" },
  "Precious metals": { en: "Precious metals", fr: "Métaux précieux" },
};

export function categoryLabel(category: string, lang: Lang): string {
  return categoryLabels[category]?.[lang] ?? category;
}

export function productTitle(product: Product, lang: Lang): string {
  return (lang === "en" ? product.title_en : product.title_fr) || product.title_en || product.title_fr || "";
}

export function productDescription(product: Product, lang: Lang): string {
  return (lang === "en" ? product.description_en : product.description_fr) || product.description_en || "";
}

export function productSpec(product: Product, lang: Lang): string {
  return (lang === "en" ? product.spec_en : product.spec_fr) || product.spec_en || product.spec_fr || "";
}

export function galleryCaption(item: GalleryItem, lang: Lang): string {
  return (lang === "en" ? item.caption_en : item.caption_fr) || item.caption_en || item.caption_fr || "";
}

export function whatsappLink(settings: SiteSettings, message: string): string {
  const number = settings.whatsapp.replace(/[^\d]/g, "");
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

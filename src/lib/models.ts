import type { Timestamp } from "firebase/firestore";

export type Lang = "en" | "fr";

export type Product = {
  id: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
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

export type Inquiry = {
  id: string;
  fullName: string;
  businessEmail: string;
  company: string;
  inquiryType: InquiryType;
  message: string;
  consent: boolean;
  createdAt?: Timestamp | null;
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

export const defaultSettings: SiteSettings = {
  email: "contact@coomiac-projet.cd",
  phone: "+250 796 145 610",
  whatsapp: "250796145610",
  address_en: "Walikale, North Kivu, DR Congo",
  address_fr: "Walikale, Nord-Kivu, RD Congo",
};

const stockDetail = "https://images.unsplash.com/photo-1762463176417-2c5e63767bd2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1000&auto=format";
const stockPattern = "https://images.unsplash.com/photo-1762463176319-8416bf1e6a8e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1000&auto=format";

/**
 * Displayed when Firebase is not configured yet or the products collection is
 * empty, so the public site always looks complete. Replace these in
 * Admin → Products once Firebase is connected.
 */
export const demoProducts: Product[] = [
  {
    id: "demo-dore",
    title_en: "Gold Doré",
    title_fr: "Or doré",
    description_en: "Locally produced doré bars and nuggets, prepared for refining and international export.",
    description_fr: "Barres et pépites dorées produites localement, préparées pour l'affinage et l'exportation internationale.",
    imageUrl: stockDetail,
    category: "Doré",
  },
  {
    id: "demo-alluvial",
    title_en: "Alluvial Gold Lot",
    title_fr: "Lot d'or alluvionnaire",
    description_en: "Alluvial gold sourced from the Walikale river network, graded and prepared per lot.",
    description_fr: "Or alluvionnaire issu du réseau fluvial de Walikale, trié et préparé par lot.",
    imageUrl: stockPattern,
    category: "Alluvial",
  },
  {
    id: "demo-custom",
    title_en: "Buyer-Specified Lot",
    title_fr: "Lot selon les spécifications de l'acheteur",
    description_en: "Tailored lots assembled around your volume, purity, and delivery requirements.",
    description_fr: "Lots sur mesure assemblés selon vos exigences de volume, de pureté et de livraison.",
    imageUrl: "",
    category: "Custom",
  },
];

export const demoGallery: GalleryItem[] = [];

export function productTitle(product: Product, lang: Lang): string {
  return (lang === "en" ? product.title_en : product.title_fr) || product.title_en || product.title_fr || "";
}

export function productDescription(product: Product, lang: Lang): string {
  return (lang === "en" ? product.description_en : product.description_fr) || product.description_en || "";
}

export function galleryCaption(item: GalleryItem, lang: Lang): string {
  return (lang === "en" ? item.caption_en : item.caption_fr) || item.caption_en || item.caption_fr || "";
}

export function whatsappLink(settings: SiteSettings, message: string): string {
  const number = settings.whatsapp.replace(/[^\d]/g, "");
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

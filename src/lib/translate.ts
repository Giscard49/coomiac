import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Lang } from "./models";

export type TranslationResult = { translated: string; cached: boolean };

async function cacheId(text: string, target: Lang): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${target}:${text}`));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

async function requestTranslation(text: string, target: Lang): Promise<Response> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Your session has expired. Please sign in again.");
  const token = await user.getIdToken();
  return fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, target }),
  });
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) return payload.error;
  } catch {
    /* not JSON */
  }
  if (response.status === 404) return "Translation endpoint not found. Deploy api/translate.ts or run the Vite dev server.";
  return `Translation failed (${response.status}).`;
}

/** Translates text and stores the result in the translations cache collection. */
export async function translateText(text: string, target: Lang = "fr"): Promise<TranslationResult> {
  const source = text.trim();
  if (!source) return { translated: "", cached: false };

  const id = await cacheId(source, target);
  if (db && id) {
    try {
      const cached = await getDoc(doc(db, "translations", id));
      if (cached.exists()) {
        const translated = String(cached.data().translated ?? "").trim();
        if (translated) return { translated, cached: true };
      }
    } catch {
      /* cache is optional */
    }
  }

  const response = await requestTranslation(source, target);
  if (!response.ok) throw new Error(await responseMessage(response));

  const payload = (await response.json()) as { translated?: string };
  const translated = String(payload.translated ?? "").trim();
  if (!translated) throw new Error("The translation service returned an empty result.");

  if (db && id) {
    try {
      await setDoc(doc(db, "translations", id), {
        sourceText: source,
        target,
        translated,
        createdAt: serverTimestamp(),
      });
    } catch {
      /* cache is optional */
    }
  }

  return { translated, cached: false };
}

/** Used by the "Retry connection" button on the Translation screen. */
export async function testTranslationService(): Promise<{ latency: number; sample: string }> {
  const started = performance.now();
  const response = await requestTranslation("Responsible gold sourcing from Walikale.", "fr");
  if (!response.ok) throw new Error(await responseMessage(response));
  const payload = (await response.json()) as { translated?: string };
  const sample = String(payload.translated ?? "").trim();
  if (!sample) throw new Error("The translation service returned an empty result.");
  return { latency: Math.round(performance.now() - started), sample };
}

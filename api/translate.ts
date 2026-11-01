import type { IncomingMessage, ServerResponse } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";

type JsonObject = Record<string, unknown>;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MAX_TEXT_LENGTH = 4000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

const buckets = new Map<string, number[]>();
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function checkRateLimit(req: IncomingMessage): void {
  const now = Date.now();
  const ip = clientIp(req);
  const hits = (buckets.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    throw new HttpError(429, "Too many translation requests. Wait a minute and try again.");
  }
  hits.push(now);
  buckets.set(ip, hits);

  if (buckets.size > 500) {
    for (const [key, value] of buckets) {
      if (!value.some((time) => now - time < RATE_WINDOW_MS)) buckets.delete(key);
    }
  }
}

function bearerToken(req: IncomingMessage): string {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header) || !header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

/**
 * Confirms that the signed-in user has a document at /admins/{uid}.
 * The request is made with the user's own ID token, so Firestore rules apply:
 * a user may only read their own admin document.
 */
async function isFirestoreAdmin(projectId: string, token: string, uid: string): Promise<boolean> {
  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/admins/" +
    encodeURIComponent(uid);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) return true;
  if (response.status === 404) return false;

  const detail = await response.text().catch(() => "");
  if (response.status === 403 && detail.includes("SERVICE_DISABLED")) {
    console.error("[translate] Firestore API is disabled");
    throw new HttpError(503, "Firestore is not enabled in the Firebase project yet.");
  }
  if (response.status === 401 || response.status === 403) {
    console.error("[translate] Firestore admin lookup denied", response.status);
    throw new HttpError(
      403,
      "The administrator list could not be read. Publish the Firestore rules in the Firebase console.",
    );
  }

  console.error("[translate] Firestore admin lookup failed", response.status);
  throw new HttpError(502, "Could not verify administrator access right now. Try again.");
}

/**
 * Verifies a Firebase ID token using Google's public signing keys.
 * Only the project id is needed on the server — no service account.
 */
async function requireAdmin(req: IncomingMessage): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new HttpError(503, "Translation is not configured: set FIREBASE_PROJECT_ID on the server.");
  }

  const token = bearerToken(req);
  if (!token) throw new HttpError(401, "Sign in to use the translation service.");

  jwks ??= createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
  );

  let uid = "";
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    uid = typeof payload.sub === "string" ? payload.sub : "";
  } catch {
    throw new HttpError(401, "Your session is invalid or expired. Sign in again.");
  }

  if (!uid) throw new HttpError(401, "Your session is invalid or expired. Sign in again.");
  if (!(await isFirestoreAdmin(projectId, token, uid))) {
    throw new HttpError(403, "This account is not authorized to translate content.");
  }
}

async function readJson(req: IncomingMessage): Promise<JsonObject> {
  const preParsed = (req as unknown as { body?: unknown }).body;
  if (preParsed && typeof preParsed === "object") return preParsed as JsonObject;
  if (typeof preParsed === "string" && preParsed.trim()) {
    try {
      return JSON.parse(preParsed) as JsonObject;
    } catch {
      throw new HttpError(400, "Invalid JSON body.");
    }
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk as Buffer);
    size += buffer.length;
    if (size > 20_000) throw new HttpError(413, "Request body is too large.");
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as JsonObject;
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

async function translateWithOpenAI(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new HttpError(503, "Translation is not configured: add OPENAI_API_KEY to the server environment.");
  }

  const model = process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are a professional English-to-French translator for COOMIAC PROJET, a gold cooperative in Walikale, DR Congo. " +
              "Translate the user's text into natural, formal French suitable for a corporate website. " +
              "Preserve proper names, numbers, units, currency codes, URLs, and line breaks. " +
              "Do not add explanations, notes, or quotation marks. Return only the French translation.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[translate] OpenAI request failed", response.status);
      if (response.status === 401 || response.status === 403) {
        throw new HttpError(502, "The translation provider rejected the server key. Check OPENAI_API_KEY.");
      }
      if (response.status === 429) {
        throw new HttpError(502, "The translation provider is rate limited. Try again shortly.");
      }
      throw new HttpError(502, `The translation provider returned an error (${response.status}).`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const translated = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!translated) throw new HttpError(502, "The translation provider returned an empty result.");
    return translated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(504, "The translation request timed out. Try again.");
    }
    console.error("[translate] request failed", error);
    throw new HttpError(502, "The translation service could not be reached.");
  } finally {
    clearTimeout(timeout);
  }
}

function send(res: ServerResponse, status: number, payload: JsonObject): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

export async function translateHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

    checkRateLimit(req);
    await requireAdmin(req);

    const body = await readJson(req);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const target = body.target;

    if (!text) throw new HttpError(400, "Text is required.");
    if (text.length > MAX_TEXT_LENGTH) {
      throw new HttpError(413, `Text is too long (${MAX_TEXT_LENGTH} characters maximum).`);
    }
    if (target !== "fr") throw new HttpError(400, "Only target \"fr\" is supported.");

    const translated = await translateWithOpenAI(text);
    send(res, 200, { translated });
  } catch (error) {
    if (error instanceof HttpError) {
      send(res, error.status, { error: error.message });
      return;
    }
    console.error("[translate] unexpected error", error);
    send(res, 500, { error: "Unexpected translation error." });
  }
}

export default translateHandler;

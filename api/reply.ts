import type { IncomingMessage, ServerResponse } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";
import nodemailer, { type Transporter } from "nodemailer";

type JsonObject = Record<string, unknown>;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MAX_SUBJECT = 180;
const MAX_MESSAGE = 5000;
const MAX_QUOTED = 6000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

const buckets = new Map<string, number[]>();
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let smtpTransport: Transporter | null = null;

const FALLBACK_FROM = "coomiaec@gmail.com";

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
    throw new HttpError(429, "Too many requests. Wait a minute and try again.");
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

async function isFirestoreAdmin(projectId: string, token: string, uid: string): Promise<boolean> {
  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/admins/" +
    encodeURIComponent(uid);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (response.ok) return true;
  if (response.status === 404) return false;

  const detail = await response.text().catch(() => "");
  if (response.status === 403 && detail.includes("SERVICE_DISABLED")) {
    console.error("[reply] Firestore API is disabled");
    throw new HttpError(503, "Firestore is not enabled in the Firebase project yet.");
  }
  if (response.status === 401 || response.status === 403) {
    console.error("[reply] Firestore admin lookup denied", response.status);
    throw new HttpError(403, "The administrator list could not be read. Publish the Firestore rules in the Firebase console.");
  }

  console.error("[reply] Firestore admin lookup failed", response.status);
  throw new HttpError(502, "Could not verify administrator access right now. Try again.");
}

async function requireAdmin(req: IncomingMessage): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new HttpError(503, "Replies are not configured: set FIREBASE_PROJECT_ID on the server.");
  }

  const token = bearerToken(req);
  if (!token) throw new HttpError(401, "Sign in to reply to messages.");

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
    throw new HttpError(403, "This account is not authorized to reply to messages.");
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
    if (size > 40_000) throw new HttpError(413, "Request body is too large.");
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

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function providerName(): "smtp" | "resend" | "none" {
  if (smtpConfigured()) return "smtp";
  if (resendConfigured()) return "resend";
  return "none";
}

function fromAddress(): string {
  return process.env.REPLY_FROM_EMAIL?.trim() || process.env.SMTP_USER?.trim() || FALLBACK_FROM;
}

function fromName(): string {
  return process.env.REPLY_FROM_NAME?.trim() || "COOMIAC PROJET";
}

/** Removes CR/LF so a subject can never inject extra mail headers. */
function cleanSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, MAX_SUBJECT);
}

function cleanEmail(value: string): string {
  return value.trim().slice(0, 200);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function htmlTemplate(message: string, quoted: string): string {
  const quote = quoted
    ? `<div style="margin-top:28px;padding:16px 20px;border-left:2px solid #c9a34c;background:#f7f4ec;color:#5f5b52;font-size:13px;line-height:1.6;">
         <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8c6b26;margin-bottom:8px;">Your original message</div>
         ${nl2br(quoted)}
       </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ed;font-family:Helvetica,Arial,sans-serif;color:#151511;">
    <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
      <div style="background:#11110f;padding:22px 26px;">
        <div style="color:#d3ad55;font-size:10px;letter-spacing:.28em;text-transform:uppercase;">COOMIAC PROJET</div>
        <div style="color:#f3f0e7;font-size:17px;margin-top:6px;">Walikale · North Kivu · DR Congo</div>
      </div>
      <div style="background:#fffef9;padding:28px 26px;border:1px solid #e2ddcf;border-top:0;font-size:14px;line-height:1.7;color:#33312c;">
        ${nl2br(message)}
        ${quote}
      </div>
      <div style="padding:20px 26px;color:#7d7970;font-size:11px;line-height:1.6;">
        COOMIAC PROJET · Walikale, North Kivu, DR Congo<br />
        ${escapeHtml(fromAddress())}
      </div>
    </div>
  </body>
</html>`;
}

function smtpFrom(): string {
  const address = fromAddress();
  return address.includes("<") ? address : `"${fromName().replace(/"/g, "")}" <${address}>`;
}

function sendWithSmtp(to: string, subject: string, message: string, quoted: string): Promise<void> {
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  const port = Number(process.env.SMTP_PORT || 465);

  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  return smtpTransport
    .sendMail({
      from: smtpFrom(),
      to,
      replyTo: fromAddress(),
      subject,
      text: `${message}${quoted ? `\n\n--- Your original message ---\n${quoted}` : ""}\n\nCOOMIAC PROJET\nWalikale · North Kivu · DR Congo`,
      html: htmlTemplate(message, quoted),
    })
    .then(() => undefined);
}

async function sendWithResend(to: string, subject: string, message: string, quoted: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new HttpError(503, "Email sending is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: `${fromName()} <${fromAddress()}>`,
      to: [to],
      reply_to: fromAddress(),
      subject,
      text: `${message}${quoted ? `\n\n--- Your original message ---\n${quoted}` : ""}`,
      html: htmlTemplate(message, quoted),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[reply] Resend error", response.status, detail.slice(0, 500));
    throw new HttpError(
      502,
      response.status === 401 || response.status === 403
        ? "The email provider rejected the server key. Check RESEND_API_KEY."
        : `The email provider returned an error (${response.status}).`,
    );
  }
}

function smtpError(error: unknown): HttpError {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "EAUTH") {
    return new HttpError(502, "The mail server rejected the credentials. Check SMTP_USER and the Google app password.");
  }
  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION") {
    return new HttpError(504, "The mail server could not be reached. Check SMTP_HOST, SMTP_PORT and your connection.");
  }
  console.error("[reply] SMTP error", error);
  return new HttpError(502, "The reply could not be sent by the mail server.");
}

function send(res: ServerResponse, status: number, payload: JsonObject): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

export async function replyHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    checkRateLimit(req);
    await requireAdmin(req);

    if (req.method === "GET") {
      const provider = providerName();
      send(res, 200, {
        configured: provider !== "none",
        provider,
        from: fromAddress(),
        reason:
          provider === "none"
            ? "Add SMTP_USER and an app password (SMTP_PASS), or a RESEND_API_KEY, to the server environment."
            : "",
      });
      return;
    }

    if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

    const body = await readJson(req);
    const to = cleanEmail(typeof body.to === "string" ? body.to : "");
    const subject = cleanSubject(typeof body.subject === "string" ? body.subject : "");
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const quoted = typeof body.quoted === "string" ? body.quoted.trim().slice(0, MAX_QUOTED) : "";

    if (!isEmail(to)) throw new HttpError(400, "A valid recipient email address is required.");
    if (!subject) throw new HttpError(400, "A subject is required.");
    if (!message) throw new HttpError(400, "A reply message is required.");
    if (message.length > MAX_MESSAGE) {
      throw new HttpError(413, `The reply is too long (${MAX_MESSAGE} characters maximum).`);
    }
    if (providerName() === "none") {
      throw new HttpError(
        503,
        "Email sending is not configured on the server. Add SMTP_USER and SMTP_PASS (Google app password) or RESEND_API_KEY.",
      );
    }

    try {
      if (providerName() === "smtp") await sendWithSmtp(to, subject, message, quoted);
      else await sendWithResend(to, subject, message, quoted);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw smtpError(error);
    }

    send(res, 200, { ok: true, from: fromAddress(), provider: providerName() });
  } catch (error) {
    if (error instanceof HttpError) {
      send(res, error.status, { error: error.message });
      return;
    }
    console.error("[reply] unexpected error", error);
    send(res, 500, { error: "Unexpected error while sending the reply." });
  }
}

export default replyHandler;

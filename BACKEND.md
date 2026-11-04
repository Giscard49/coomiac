# COOMIAC backend — setup & operations

The public site and the `/admin` console are backed by Firebase (Firestore, Auth,
Storage) and serverless `api/` routes for translation and email replies. Nothing
in this document is required to view the public site: until Firestore has
content, it falls back to a small demo catalogue.

---

## 1. Environment variables

The project reads `.env` and `.env.local` (both gitignored). The Firebase web
keys are public by design — security is enforced by Firestore/Storage rules.
`vite.config.ts` sets `envDir: "."`, so the root `.env` is used even when Vite is
started from another directory. In development, the browser console prints an
`ENV CHECK` line with the project, auth domain, bucket, and a masked API-key
prefix. If that line appears, Vite env loading is working.

| Key | Where | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | client | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | client | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | client | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | client | Storage bucket (`<project>.firebasestorage.app` for new projects, `<project>.appspot.com` for older ones; uploads retry the other name) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | client | Sender id |
| `VITE_FIREBASE_APP_ID` | client | Web app id |
| `OPENAI_API_KEY` | **server only** | OpenAI key for translation. Never prefix with `VITE_`. |
| `OPENAI_TRANSLATION_MODEL` | server only | Optional, defaults to `gpt-4o-mini` |
| `FIREBASE_PROJECT_ID` | server only | Used by `/api/translate` and `/api/reply` to verify ID tokens and admin access |
| `SMTP_HOST` | server only | Mail server; defaults to `smtp.gmail.com` |
| `SMTP_PORT` | server only | `465` (TLS) or `587` (STARTTLS); defaults to `465` |
| `SMTP_USER` | server only | The sending Gmail address, e.g. `coomiaec@gmail.com` |
| `SMTP_PASS` | **server only** | Google **app password** (16 characters, not the account password) |
| `REPLY_FROM_EMAIL` | server only | From address shown to recipients; defaults to `SMTP_USER` |
| `REPLY_FROM_NAME` | server only | From display name; defaults to `COOMIAC PROJET` |
| `RESEND_API_KEY` | server only | Alternative email provider (requires a verified domain); leave empty when using SMTP |
| `SEED_ADMIN_EMAIL` | seed script | First admin email |
| `SEED_ADMIN_PASSWORD` | seed script | First admin password (8+ characters) |
| `FIREBASE_SERVICE_ACCOUNT` | seed script | Service-account JSON (one line) or its base64. Alternative: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` |
| `SITE_CONTACT_*` | seed script (optional) | Seed default contact details (see `scripts/seed-admin.mjs`) |

On Vercel, add the server keys in **Project → Settings → Environment Variables**
(Production and Preview). Never add server keys with a `VITE_` prefix.

---

## 2. Firebase console setup (one time)

1. **Authentication → Sign-in method → Email/Password → Enable.**
   Do not use this project for public sign-ups; it is for staff accounts only.
2. **Firestore Database → Create database** (production mode, nearest region).
   This also enables the Cloud Firestore API. If you see
   `Cloud Firestore API has not been used in project …`, click the activation
   link in the error or create the database in the console.
3. **Storage → Get started** (production mode).
4. **Project settings → Your apps** already has the web app whose config is in
   `.env`. No change needed.

### Publish the rules

Option A — console (no tooling):

- **Firestore → Rules** → paste the contents of `firestore.rules` → **Publish**.
- **Storage → Rules** → paste the contents of `storage.rules` → **Publish**.

Option B — Firebase CLI:

```bash
npx firebase-tools login
npm run deploy:rules
```

`.firebaserc` already points the repo at the `coomiac` project, so `firebase use`
is not required.

> The Storage rules use the Firestore `admins` collection as an allow-list. If a
> Storage write is denied, confirm the Firestore rules are published first and
> that `/admins/{uid}` exists for the signed-in user.

---

## 3. Create the first administrator

Admin access is granted by a document at `/admins/{uid}`, where `{uid}` is the
Firebase Authentication user id. Signing in alone is **not** enough. There are
two ways to create the account.

### Option A — Firebase console (no service account)

1. **Authentication → Users → Add user.** Enter the admin email and a strong
   password. Copy the generated **User UID**.
2. **Firestore Database → Start collection** named `admins`.
3. Set the **Document ID** to the UID you copied. Add an `email` field (string,
   the admin's email) and save. You can also add `createdAt` as a timestamp.
4. Sign in at `/admin/login` with that email and password.

To revoke access, delete the `/admins/{uid}` document. Security rules stop
anyone from creating or editing these documents from the browser, so only the
console or the Admin SDK can grant access.

### Option B — seed script (repeatable)

1. Firebase console → **Project settings → Service accounts → Generate new
   private key**. Download the JSON file.
2. Put the values in `.env` (or `.env.local`):

   ```dotenv
   FIREBASE_PROJECT_ID=coomiac
   SEED_ADMIN_EMAIL=coomiaec@gmail.com
   SEED_ADMIN_PASSWORD=choose-a-strong-password
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"coomiac",...}
   # …or:
   # GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
   ```

   `FIREBASE_SERVICE_ACCOUNT` can be the one-line JSON or its base64 encoding:
   `base64 -i service-account.json | tr -d '\n'`.

3. Run:

   ```bash
   npm run seed:admin
   ```

4. Sign in at `/admin/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Re-run the script to reset the password or re-grant access. To add another
administrator, run it again with their email.

---

## 4. Translation service

The site is bilingual (EN/FR). The product, gallery and contact editors include
**Translate** buttons that call `POST /api/translate` with
`{ text, target: "fr" }` and `Authorization: Bearer <Firebase ID token>`.

- `api/translate.ts` is a Vercel Node function (also used by the Vite dev server
  through a middleware, so localhost works with the same code path).
- The endpoint verifies the Firebase ID token (issuer + audience), then reads
  `/admins/{uid}` with that token. Anonymous visitors and non-admin accounts
  cannot spend the OpenAI key.
- Requests are rate-limited (30/minute/IP), text is capped at 4,000 characters,
  and errors never expose the key.
- The client caches successful results in the `translations` collection
  (`SHA-256(target:text)` document ids) so repeated copy is not re-billed.
- On product save, only **empty** French fields are translated. Manual French
  is preserved. The Translate buttons perform an explicit overwrite.
- There is no separate Translation screen. Public copy ships with hand-written
  English and French; the API is only for catalogue content.

**Local development:** add `OPENAI_API_KEY` and `FIREBASE_PROJECT_ID` to `.env`
and restart `npm run dev`.

**Vercel:** the `api/` directory is deployed automatically. Add `OPENAI_API_KEY`
and `FIREBASE_PROJECT_ID` to the Vercel environment. The rewrite in
`vercel.json` excludes `/api/`.

**Firebase Hosting:** `firebase.json` intentionally only configures Firestore
and Storage. If you host the SPA on Firebase Hosting, deploy the `api/`
functions as Cloud Functions or keep the site on Vercel.

---

## 5. Admin inbox & email replies

The **Messages** screen (`/admin/messages`) replaces the old Translation page.
It lists every contact-form inquiry, supports search and status filtering, shows
the full conversation, and lets an administrator reply without leaving the app.

How a reply works:

1. The admin writes a subject and message in `/admin/messages`.
2. The browser calls `POST /api/reply` with
   `{ to, subject, message, quoted, inquiryId }` and a Firebase ID token.
3. `/api/reply` verifies the token, checks `/admins/{uid}`, validates the
   recipient and lengths, then sends the email. SMTP (Gmail app password) is
   used when configured; otherwise Resend is used if `RESEND_API_KEY` is set.
4. On success the console writes the reply to
   `/inquiries/{id}/replies/{replyId}` and updates the inquiry with
   `status: "replied"`, `replyCount + 1` and `lastReplyAt`.
5. If no provider is configured, the UI shows the configuration error and
   offers a **mailto** fallback so the message is never lost.

`GET /api/reply` (when signed in as an admin) returns
`{ configured, provider, from, reason }`; the inbox uses it to show a warning
banner before an admin tries to send.

### Configure Gmail as the sender

1. Sign in to the Google account `coomiaec@gmail.com`.
2. Enable **2-Step Verification** (required for app passwords).
3. Google Account → **Security → App passwords** → create one named
   “COOMIAC website”.
4. Put the 16-character password in `SMTP_PASS` (spaces are ignored) and keep
   `SMTP_USER=coomiaec@gmail.com`. Do not use the normal account password.
5. Restart the dev server (or redeploy) and send a test reply from
   `/admin/messages`.

Gmail limits free accounts to roughly 500 recipients/day, which is plenty for
this inbox. If the account later moves to a custom domain, either update
`SMTP_USER`/`REPLY_FROM_EMAIL` or switch to Resend with the domain verified.

---

## 6. Data model

```
products/{id}      title_en, title_fr, description_en, description_fr,
                   spec_en, spec_fr, imageUrl, category, createdAt, updatedAt
gallery/{id}       imageUrl, caption_en, caption_fr, order, createdAt
inquiries/{id}     fullName, businessEmail, company, inquiryType,
                   message, consent, status, replyCount, lastReplyAt, createdAt
  replies/{id}     subject, message, to, from, sentBy, sentAt
settings/site      email, phone, whatsapp, address_en, address_fr, updatedAt
translations/{id}  sourceText, target, translated, createdAt
admins/{uid}       email, createdAt, updatedAt     (console / Admin SDK only)
```

The catalogue ships with five minerals — **Coltan**, **Cassiterite**,
**Copper**, **Cobalt** and **Gold** — grouped as critical minerals, base metals
and precious metals. Demo products and photos appear only while Firestore is
empty; real documents take priority.

The admin console:

| Route | Purpose |
| --- | --- |
| `/admin` | Stats, contact details (writes `settings/site`), latest messages |
| `/admin/products` | Create/edit/delete, Storage upload, EN/FR, specs, auto-translate |
| `/admin/photo-gallery` | Multi-upload, drag reorder, EN/FR captions, delete |
| `/admin/messages` | Read/search/filter inquiries, reply by email, conversation history |

Legacy `/admin/translations` links redirect to `/admin/messages`.

---

## 7. Security model

- Products, gallery, and settings are publicly readable.
- Inquiries can be **created** by anyone with validated fields; only admins can
  read or update them.
- Replies can be read and created only by admins, and are immutable once
  written (no update/delete through the client).
- All other writes require an admin (`/admins/{uid}` exists).
- Storage writes require an admin; product/gallery images are publicly readable.
- The OpenAI key, SMTP credentials and service account exist only in
  server/seed environments.
- `/api/reply` verifies the Firebase token, checks the admin allow-list, rate
  limits requests, strips newlines from subjects (header-injection guard) and
  HTML-escapes the message body.
- The public site never renders Firebase errors; it falls back to defaults.

If you later add public user accounts, do **not** reuse this project's admin
allow-list logic for them — create a separate role and tighten the rules.

---

## 8. Useful commands

```bash
npm run dev          # Vite + local /api/translate
npm run typecheck    # tsc --noEmit
npm run build        # production build
npm run seed:admin   # create/reset the first admin
npm run deploy:rules # Firebase CLI: publish Firestore + Storage rules
npm run emulators    # optional local Firebase emulators
```

## 9. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Admin shows “Connect Firebase” | `VITE_FIREBASE_*` keys missing in `.env`; restart the dev server. |
| “Account not authorized” | The Auth user has no `/admins/{uid}`; use console Option A or run the seed script. |
| “Could not verify access” | Firestore API disabled or rules not published. |
| Sign-in: “Authentication service is being configured” | The app loaded the key, but Google rejected it. Copy a fresh **Web API Key** from Firebase Console → Project settings → General into `.env` and restart. Confirm the key's API restrictions allow **Identity Toolkit API**. |
| Sign-in: “Wrong email or password” | Check the password. If the account has never been created, use Firebase Console → Authentication → Users → Add user → `coomiac@admin.com`, then add `/admins/{uid}`. |
| Sign-in error says `auth/api-key-not-valid` in the console | `VITE_FIREBASE_API_KEY` is deleted, mistyped, or from another project. The on-screen message stays friendly; use the console detail to fix the key. |
| Admin URL redirects to `/admin/login` | Expected when signed out. Any `/admin/*` route is private. |
| Uploads fail with “bucket does not exist” | Enable **Storage → Get started**. Then copy the exact bucket name shown in the console into `VITE_FIREBASE_STORAGE_BUCKET`. The uploader retries `.appspot.com` ↔ `.firebasestorage.app` once. |
| Translation 401 | You are signed out or the session expired; sign in again. |
| Translation 403 | The signed-in account has no `/admins/{uid}`, or the Firestore rules are not published. |
| Translation 503 | `FIREBASE_PROJECT_ID` or `OPENAI_API_KEY` missing on the server. |
| Messages banner says email is not configured | Add `SMTP_USER` + `SMTP_PASS` (Google app password) or `RESEND_API_KEY` to `.env` / Vercel, then restart or redeploy. |
| Reply fails with `EAUTH` | The Google app password is wrong or 2-Step Verification is off. Create a new app password and update `SMTP_PASS`. |
| Reply fails with a timeout / connection error | Check `SMTP_HOST` and `SMTP_PORT` (`465` secure, `587` STARTTLS). Corporate networks may block SMTP; use Resend instead. |
| Reply sends but the thread stays empty | Publish the latest `firestore.rules` so `/inquiries/{id}/replies` can be written. |
| Uploads denied | Publish `firestore.rules` first (Storage checks `/admins/{uid}`). |
| Contact form error | Firestore rules not published, or the database was not created. |

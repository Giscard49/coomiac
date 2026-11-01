/**
 * Creates (or updates) a COOMIAC PROJET admin account and its /admins/{uid}
 * document. Admin access is granted by that Firestore document.
 *
 * You can also do this by hand in the Firebase console (Authentication → Add
 * user, then create /admins/{uid}); the script is for repeatable setup.
 *
 * Usage:
 *   1. Fill in .env (or .env.local) from .env.example.
 *   2. Download a Firebase service account key:
 *      Firebase console → Project settings → Service accounts → Generate new private key
 *   3. Paste it into FIREBASE_SERVICE_ACCOUNT (one-line JSON or base64), or set
 *      GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
 *   4. Run: npm run seed:admin
 */
import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (!path) {
      fail(
        "No credentials found. Set FIREBASE_SERVICE_ACCOUNT (JSON/base64) or GOOGLE_APPLICATION_CREDENTIALS (file path) in .env or .env.local.",
      );
    }
    return JSON.parse(readFileSync(path, "utf8"));
  }

  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  try {
    return JSON.parse(json);
  } catch {
    fail("FIREBASE_SERVICE_ACCOUNT is not valid JSON or base64-encoded JSON.");
  }
}

const email = process.env.SEED_ADMIN_EMAIL?.trim();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email) fail("SEED_ADMIN_EMAIL is missing. Add it to .env or .env.local.");
if (!password) fail("SEED_ADMIN_PASSWORD is missing. Add it to .env or .env.local.");
if (password.length < 8) fail("SEED_ADMIN_PASSWORD must be at least 8 characters.");
if (!email.includes("@")) fail("SEED_ADMIN_EMAIL is not a valid email address.");

const serviceAccount = readServiceAccount();
const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || serviceAccount.project_id;

if (!projectId) fail("FIREBASE_PROJECT_ID is missing and could not be read from the service account.");

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId,
});

const auth = getAuth(app);
const firestore = getFirestore(app);

try {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });
    console.log(`• Updated existing Auth user ${email}`);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email, password, emailVerified: true, disabled: false });
    console.log(`• Created Auth user ${email}`);
  }

  const adminRef = firestore.doc(`admins/${user.uid}`);
  const existing = await adminRef.get();
  await adminRef.set(
    {
      email,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  console.log("• Wrote Firestore /admins/" + user.uid);

  await firestore.doc("settings/site").set(
    {
      email: process.env.SITE_CONTACT_EMAIL?.trim() || email,
      phone: process.env.SITE_CONTACT_PHONE?.trim() || "+250 796 145 610",
      whatsapp: process.env.SITE_CONTACT_WHATSAPP?.trim() || "250796145610",
      address_en: process.env.SITE_CONTACT_ADDRESS_EN?.trim() || "Walikale, North Kivu, DR Congo",
      address_fr: process.env.SITE_CONTACT_ADDRESS_FR?.trim() || "Walikale, Nord-Kivu, RD Congo",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log("• Wrote default settings/site contact details");

  console.log(`\n✔ Admin ready.\n  Sign in at /admin/login with ${email}\n`);
  process.exit(0);
} catch (error) {
  console.error("\n✖ Seeding failed:");
  console.error(error);
  process.exit(1);
}

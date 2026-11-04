# COOMIAC PROJET

COOMIAC PROJET is a bilingual English/French mineral trading site for
responsibly sourced coltan, cassiterite, copper, cobalt and gold from Walikale,
North Kivu, DR Congo.

## Stack

- React 19 + TypeScript
- Vite 6 + Tailwind CSS v4
- Firebase Auth, Firestore and Storage
- Serverless `api/` routes for translation and email replies

## Local development

```bash
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:3000` by default.

```bash
npm run typecheck
npm run build
npm run preview
```

## Project docs

- [`BACKEND.md`](BACKEND.md) — Firebase, email, environment and deployment setup
- [`PHOTO-SOURCES.md`](PHOTO-SOURCES.md) — photo credits and local replacement guide
- [`src/assets/README.md`](src/assets/README.md) — built-in photo map
- [`AGENTS.md`](AGENTS.md) — project structure and working notes

## Admin

The bilingual admin console is available at `/admin`. It manages products,
gallery photos, contact details and inquiry replies.

## Photos

All built-in photos live in `src/assets/` and are imported through
`src/assets/photos.ts`. Replace a same-named file or use:

```bash
npm run photos:optimize
```

# Built-in photos

Every photograph that ships with the site is stored here. The public site, the
demo products and the admin credits list all import them through
[`photos.ts`](photos.ts), so you only need to replace a file — no code changes.

| Folder | Used for |
| --- | --- |
| `minerals/` | Coltan, cassiterite, copper, cobalt and gold product cards |
| `site/` | Hero, story section, gallery and contact band |
| `thumbs/` | Small previews in the photo-credit lists |

## Replace one photo

1. Keep the same file name (for example `minerals/coltan.webp`).
2. Use a landscape photo, ideally at least 1200 px wide.
3. Update the matching file in `thumbs/` too, or use the automatic option
   below.

Automatic option: put `coltan.jpg`, `gold.png` (or any supported name) in
`photos-to-add/` at the project root, then run:

```bash
npm run photos:optimize
```

The script updates both the full image and its thumbnail. Author, licence and
source links (where available) are in [`PHOTO-SOURCES.md`](../../PHOTO-SOURCES.md).

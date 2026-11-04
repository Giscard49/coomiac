# Drop real photos here

This folder is a staging area for replacing the site's built-in photographs.
Nothing here is published until you run the command below.

1. Put a photo in this folder, named after the slot you want to replace:

   | File name (any extension) | Used for |
   | --- | --- |
   | `coltan.jpg` | Coltan product card and gallery |
   | `cassiterite.jpg` | Cassiterite product card and gallery |
   | `copper.jpg` | Copper product card |
   | `cobalt.jpg` | Cobalt product card |
   | `gold.jpg` | Gold product card and gallery |
   | `walikale.jpg` | Home hero and gallery |
   | `coltan-mine.jpg` | Home story section and gallery |
   | `mining-2.jpg` | Gallery (working pit) |
   | `cathode.jpg` | Gallery and contact band |

   JPG, PNG, WebP and TIFF all work. A phone photo is fine.

2. Run:

   ```bash
   npm run photos:optimize
   ```

3. Reload the site. The script resizes the photo to at most 1600 px and saves
   the optimized WebP file under `src/assets/`, plus the 240 × 180 credits
   thumbnail under `src/assets/thumbs/`.

The built-in photos and their original Wikimedia Commons links are listed in
[`PHOTO-SOURCES.md`](../PHOTO-SOURCES.md) and in the admin **Photo gallery**
screen. Always use a photo you own or one with a license that allows commercial
use, and keep the author/source link when required.

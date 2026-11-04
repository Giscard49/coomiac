import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Drops a real photo into ./photos-to-add and publishes it on the site.
 *
 * The base name chooses the destination; any common image extension works.
 * Images are resized to 1600 px maximum and converted to WebP so phones stay
 * fast. The image is only resized and converted to WebP; nothing is generated,
 * retouched or uploaded.
 */
const targets = {
  coltan: "src/assets/minerals/coltan.webp",
  cassiterite: "src/assets/minerals/cassiterite.webp",
  copper: "src/assets/minerals/copper.webp",
  cobalt: "src/assets/minerals/cobalt.webp",
  gold: "src/assets/minerals/gold.webp",
  walikale: "src/assets/site/walikale.webp",
  "coltan-mine": "src/assets/site/coltan-mine.webp",
  "mining-2": "src/assets/site/mining-2.webp",
  cathode: "src/assets/site/cathode.webp",
};

const root = process.cwd();
const inbox = path.join(root, "photos-to-add");
const supported = /\.(jpe?g|png|webp|tiff?)$/i;

await mkdir(inbox, { recursive: true });

const entries = await readdir(inbox, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile() && supported.test(entry.name));

if (files.length === 0) {
  console.log([
    "No photos found in ./photos-to-add.",
    "",
    "Add a real photo named after the slot you want to replace, for example:",
    "  photos-to-add/coltan.jpg",
    "  photos-to-add/gold.png",
    "  photos-to-add/walikale.jpeg",
    "",
    "Accepted names:",
    ...Object.keys(targets).map((name) => `  ${name}.jpg   → ${targets[name]}`),
    "",
    "Then run: npm run photos:optimize",
  ].join("\n"));
  process.exit(0);
}

let published = 0;

for (const file of files) {
  const base = path.basename(file.name, path.extname(file.name)).toLowerCase();
  const destination = targets[base];

  if (!destination) {
    console.warn(`! Skipped ${file.name}: use one of ${Object.keys(targets).join(", ")}.`);
    continue;
  }

  const input = path.join(inbox, file.name);
  const output = path.join(root, destination);
  const thumbOutput = path.join(root, "src/assets/thumbs", `${base}.webp`);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.dirname(thumbOutput), { recursive: true });

  const info = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(output);

  const thumb = await sharp(input)
    .rotate()
    .resize({ width: 240, height: 180, fit: "cover" })
    .webp({ quality: 78, effort: 5 })
    .toFile(thumbOutput);

  published += 1;
  console.log(
    `✔ ${file.name} → ${destination} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`,
  );
  console.log(
    `  thumbnail → src/assets/thumbs/${base}.webp (${thumb.width}×${thumb.height}, ${Math.round(thumb.size / 1024)} KB)`,
  );
}

console.log(
  published > 0
    ? `\n${published} photo${published === 1 ? "" : "s"} updated. Reload the site to see the change.`
    : "\nNothing was updated. Check the file names above.",
);

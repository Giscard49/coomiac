/**
 * Every built-in photograph used by the public site and the admin console.
 *
 * All files live in `src/assets/minerals/` or `src/assets/site/`. To replace a
 * photo locally, keep the same file name and drop your own WebP over it, or run
 * `npm run photos:optimize` after adding a JPG/PNG to `photos-to-add/`.
 *
 * The small previews used by the credits lists live in `src/assets/thumbs/`.
 */
import cassiterite from "./minerals/cassiterite.webp";
import cobalt from "./minerals/cobalt.webp";
import coltan from "./minerals/coltan.webp";
import copper from "./minerals/copper.webp";
import gold from "./minerals/gold.webp";
import cathode from "./site/cathode.webp";
import coltanMine from "./site/coltan-mine.webp";
import mining from "./site/mining-2.webp";
import walikale from "./site/walikale.webp";

import cassiteriteThumb from "./thumbs/cassiterite.webp";
import cathodeThumb from "./thumbs/cathode.webp";
import cobaltThumb from "./thumbs/cobalt.webp";
import coltanThumb from "./thumbs/coltan.webp";
import coltanMineThumb from "./thumbs/coltan-mine.webp";
import copperThumb from "./thumbs/copper.webp";
import goldThumb from "./thumbs/gold.webp";
import miningThumb from "./thumbs/mining-2.webp";
import walikaleThumb from "./thumbs/walikale.webp";

export const mineralPhotos = {
  coltan,
  cassiterite,
  copper,
  cobalt,
  gold,
} as const;

export const sitePhotos = {
  walikale,
  coltanMine,
  mining,
  cathode,
} as const;

export const photoThumbs = {
  coltan: coltanThumb,
  cassiterite: cassiteriteThumb,
  copper: copperThumb,
  cobalt: cobaltThumb,
  gold: goldThumb,
  walikale: walikaleThumb,
  coltanMine: coltanMineThumb,
  mining: miningThumb,
  cathode: cathodeThumb,
} as const;

/** One flat map when a component needs any built-in photo by key. */
export const photos = {
  ...mineralPhotos,
  ...sitePhotos,
} as const;

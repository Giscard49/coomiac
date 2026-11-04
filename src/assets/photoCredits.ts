import { mineralPhotos, photoThumbs, sitePhotos } from "./photos";

export type PhotoCredit = {
  id: string;
  src: string;
  /** Small 240 × 180 preview for credit lists. */
  thumb: string;
  /** Path inside the repository, so the file is easy to replace locally. */
  file: string;
  title_en: string;
  title_fr: string;
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
};

/**
 * Every built-in photograph is a real photograph, not AI-generated or
 * AI-upscaled. Most come from Wikimedia Commons; the Coltan photo is supplied
 * by COOMIAC PROJET. Replace the file at `file` with a photo of the same name
 * to change it locally; `npm run photos:optimize` also accepts JPG/PNG source
 * files and regenerates the matching thumbnail.
 */
export const photoCredits: PhotoCredit[] = [
  {
    id: "coltan",
    src: mineralPhotos.coltan,
    thumb: photoThumbs.coltan,
    file: "src/assets/minerals/coltan.webp",
    title_en: "Coltan ore",
    title_fr: "Minerai de coltan",
    author: "COOMIAC PROJET",
    license: "Company photo",
  },
  {
    id: "cassiterite",
    src: mineralPhotos.cassiterite,
    thumb: photoThumbs.cassiterite,
    file: "src/assets/minerals/cassiterite.webp",
    title_en: "Cassiterite crystals with quartz",
    title_fr: "Cristaux de cassitérite avec quartz",
    author: "Shannon Heinle (GeoDIL)",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cassiterite_(GeoDIL_number_-_37).jpg",
  },
  {
    id: "copper",
    src: mineralPhotos.copper,
    thumb: photoThumbs.copper,
    file: "src/assets/minerals/copper.webp",
    title_en: "Native copper",
    title_fr: "Cuivre natif",
    author: "Jon Zander (Digon3)",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Natural_Copper_Ore_Macro_1.JPG",
  },
  {
    id: "cobalt",
    src: mineralPhotos.cobalt,
    thumb: photoThumbs.cobalt,
    file: "src/assets/minerals/cobalt.webp",
    title_en: "Cobaltite ore",
    title_fr: "Minerai de cobaltite",
    author: "Darla Sondrol (GeoDIL)",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cobaltite_(GeoDIL_number_-_1151).jpg",
  },
  {
    id: "gold",
    src: mineralPhotos.gold,
    thumb: photoThumbs.gold,
    file: "src/assets/minerals/gold.webp",
    title_en: "Australian gold nugget, Field Museum",
    title_fr: "Pépite d'or australienne, Field Museum",
    author: "James St. John",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gold_nugget_(Australia)_4_(16848647509).jpg",
  },
  {
    id: "walikale",
    src: sitePhotos.walikale,
    thumb: photoThumbs.walikale,
    file: "src/assets/site/walikale.webp",
    title_en: "Walikale, North Kivu",
    title_fr: "Walikale, Nord-Kivu",
    author: "MONUSCO / Sylvain Liechti",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Walikale.jpg",
  },
  {
    id: "coltan-mine",
    src: sitePhotos.coltanMine,
    thumb: photoThumbs.coltanMine,
    file: "src/assets/site/coltan-mine.webp",
    title_en: "Luwowo coltan mine near Rubaya",
    title_fr: "Mine de coltan de Luwowo près de Rubaya",
    author: "MONUSCO Photos",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:SRSG_visits_coltan_mine_in_Rubaya_(13406579753).jpg",
  },
  {
    id: "mining-2",
    src: sitePhotos.mining,
    thumb: photoThumbs.mining,
    file: "src/assets/site/mining-2.webp",
    title_en: "Mining in Kailo, DR Congo",
    title_fr: "Exploitation minière à Kailo, RD Congo",
    author: "Julien Harneis",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mining_in_Kailo_2.jpg",
  },
  {
    id: "cathode",
    src: sitePhotos.cathode,
    thumb: photoThumbs.cathode,
    file: "src/assets/site/cathode.webp",
    title_en: "Bundles of cathode copper",
    title_fr: "Lots de cathodes de cuivre",
    author: "ChrisFountain",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bundles_of_cathode_copper.png",
  },
];

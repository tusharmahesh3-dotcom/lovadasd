import type { Industry } from "@/lib/types";

/**
 * Curated stock photography (Pexels, via the sanctioned media tool).
 * Sections reference these through {{image_*}} tokens so generated pages look
 * like real products instead of wireframes.
 */

const px = (id: number, w: number, h: number, ext: "jpeg" | "png" = "jpeg") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

const PORTRAITS = [14950779, 7717254, 38740728, 33799456, 6497114, 36434829, 18351014, 7752788, 14564869];
const TEAM = [7495291, 6804068, 7495294, 7889241, 8547282, 7495196];
const PRODUCT = [7670680, 8128064, 27357170, 17388268, 6690198, 6683027];
const FITNESS = [2294403, 4164510, 3917658, 34433962, 7689280, 4164519];
const ABSTRACT = [7130496, 7130543, 7130505, 29506601, 7135033, 7130469];
const INTERIOR = [8089172, 8146213, 7061666, 20314947, 7587783, 7546286];

const PRIMARY: Record<Industry, number[]> = {
  saas: TEAM,
  ecommerce: PRODUCT,
  agency: ABSTRACT,
  fitness: FITNESS,
  fintech: TEAM,
  healthcare: TEAM,
  education: TEAM,
  realestate: INTERIOR,
  generic: ABSTRACT,
};

const SECONDARY: Record<Industry, number[]> = {
  saas: ABSTRACT,
  ecommerce: PRODUCT,
  agency: INTERIOR,
  fitness: TEAM,
  fintech: INTERIOR,
  healthcare: INTERIOR,
  education: INTERIOR,
  realestate: TEAM,
  generic: TEAM,
};

export interface MediaSet {
  hero: string;
  heroWide: string;
  feature: string[];
  gallery: string[];
  avatars: string[];
  product: string;
}

function rot<T>(arr: T[], offset: number): T[] {
  if (!arr.length) return arr;
  const n = ((offset % arr.length) + arr.length) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

/** Deterministic media selection so a variant renders identically on re-view. */
export function mediaFor(industry: Industry, seed = 0): MediaSet {
  const primary = rot(PRIMARY[industry] ?? ABSTRACT, seed);
  const secondary = rot(SECONDARY[industry] ?? TEAM, seed + 2);
  const faces = rot(PORTRAITS, seed + 1);

  return {
    hero: px(primary[0] ?? ABSTRACT[0], 1200, 900),
    heroWide: px(primary[1] ?? primary[0] ?? ABSTRACT[0], 1600, 700),
    feature: [
      px(secondary[0] ?? TEAM[0], 800, 600),
      px(secondary[1] ?? TEAM[1] ?? TEAM[0], 800, 600),
      px(secondary[2] ?? TEAM[2] ?? TEAM[0], 800, 600),
    ],
    gallery: [
      px(primary[2] ?? primary[0], 700, 900),
      px(secondary[3] ?? secondary[0], 700, 500),
      px(primary[3] ?? primary[1] ?? primary[0], 700, 500),
      px(secondary[4] ?? secondary[1] ?? secondary[0], 700, 900),
    ],
    avatars: [px(faces[0], 160, 160), px(faces[1], 160, 160), px(faces[2], 160, 160)],
    product: px((PRODUCT[seed % PRODUCT.length] ?? PRODUCT[0]), 900, 1200),
  };
}

/** Adds {{image_*}} / {{avatar_*}} tokens to the copy token map. */
export function mediaTokens(industry: Industry, seed = 0): Record<string, string> {
  const m = mediaFor(industry, seed);
  return {
    image_hero: m.hero,
    image_hero_wide: m.heroWide,
    image_feature_1: m.feature[0],
    image_feature_2: m.feature[1],
    image_feature_3: m.feature[2],
    image_gallery_1: m.gallery[0],
    image_gallery_2: m.gallery[1],
    image_gallery_3: m.gallery[2],
    image_gallery_4: m.gallery[3],
    image_product: m.product,
    avatar_1: m.avatars[0],
    avatar_2: m.avatars[1],
    avatar_3: m.avatars[2],
  };
}

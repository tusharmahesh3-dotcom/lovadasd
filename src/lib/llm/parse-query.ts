import { ModelRouter } from "@/lib/llm/router";
import {
  CONVERSION_PATTERNS,
  INDUSTRIES,
  SECTION_TYPES,
  TONES,
  type BrandConstraints,
  type ConversionPattern,
  type Industry,
  type SectionType,
  type StructuredQuery,
  type Tone,
} from "@/lib/types";

/**
 * QUERY UNDERSTANDING (§3)
 * Parses a natural-language prompt into:
 *   { industry, tone, page_type, required_sections, brand_constraints, ... }
 */

const INDUSTRY_HINTS: Record<Industry, string[]> = {
  saas: ["saas", "software", "app", "platform", "dashboard", "api", "developer", "tool", "ai", "automation", "crm", "analytics"],
  ecommerce: ["shop", "store", "ecommerce", "product", "dtc", "brand", "candle", "coffee", "apparel", "skincare", "merch", "cart"],
  agency: ["agency", "studio", "freelance", "consultancy", "design", "portfolio", "creative", "branding", "marketing agency"],
  fitness: ["fitness", "gym", "coach", "workout", "yoga", "training", "nutrition", "wellness", "pilates", "run"],
  fintech: ["fintech", "bank", "payments", "invest", "crypto", "wallet", "lending", "insurance", "treasury", "accounting"],
  healthcare: ["health", "clinic", "therapy", "medical", "dental", "patient", "telehealth", "care", "mental"],
  education: ["course", "school", "bootcamp", "learn", "tutor", "academy", "education", "training program", "cohort"],
  realestate: ["real estate", "property", "realtor", "listing", "rental", "homes", "mortgage", "apartment"],
  generic: [],
};

const TONE_HINTS: Record<Tone, string[]> = {
  bold: ["bold", "punchy", "loud", "energetic", "aggressive", "high-contrast", "striking", "vibrant"],
  minimal: ["minimal", "clean", "simple", "whitespace", "understated", "swiss", "calm", "elegant simple"],
  playful: ["playful", "fun", "quirky", "friendly", "colorful", "colourful", "cute", "casual"],
  corporate: ["corporate", "professional", "enterprise", "b2b", "serious", "trustworthy", "institutional"],
  luxury: ["luxury", "premium", "high-end", "elegant", "sophisticated", "boutique", "refined"],
  technical: ["technical", "developer", "engineer", "docs", "infrastructure", "open source", "cli"],
};

const PATTERN_HINTS: Record<ConversionPattern, string[]> = {
  urgency: ["urgent", "now", "today", "limited time", "fast", "deadline", "launch"],
  social_proof: ["testimonial", "reviews", "customers", "social proof", "loved by", "community"],
  scarcity: ["limited", "sold out", "waitlist", "exclusive", "only", "spots", "drop"],
  authority: ["trusted", "enterprise", "compliance", "secure", "certified", "regulated", "expert"],
  clarity: ["simple", "clear", "explain", "how it works", "straightforward"],
  risk_reversal: ["free trial", "money back", "guarantee", "no credit card", "cancel anytime", "refund"],
};

const SECTION_HINTS: Record<string, SectionType> = {
  hero: "hero",
  nav: "nav",
  navbar: "nav",
  header: "nav",
  feature: "features",
  features: "features",
  benefits: "features",
  pricing: "pricing",
  price: "pricing",
  plans: "pricing",
  faq: "faq",
  questions: "faq",
  testimonial: "social_proof",
  testimonials: "social_proof",
  reviews: "social_proof",
  "social proof": "social_proof",
  logos: "social_proof",
  cta: "cta",
  "call to action": "cta",
  footer: "footer",
  newsletter: "cta",
};

function scoreHints(prompt: string, hints: string[]): number {
  let score = 0;
  for (const h of hints) if (prompt.includes(h)) score += h.includes(" ") ? 2 : 1;
  return score;
}

function pickBest<T extends string>(prompt: string, table: Record<T, string[]>, fallback: T): T {
  let best = fallback;
  let bestScore = 0;
  for (const key of Object.keys(table) as T[]) {
    const s = scoreHints(prompt, table[key]);
    if (s > bestScore) {
      best = key;
      bestScore = s;
    }
  }
  return best;
}

function extractProductName(prompt: string, fallbackIndustry: Industry): string {
  const quoted = prompt.match(/["“']([A-Za-z0-9 .&-]{2,28})["”']/);
  if (quoted) return quoted[1].trim();
  const called = prompt.match(/\b(?:called|named|for)\s+([A-Z][A-Za-z0-9]*(?:\s[A-Z][A-Za-z0-9]*)?)/);
  if (called) return called[1].trim();
  const capital = prompt.match(/\b([A-Z][a-z]{2,}[A-Za-z]*(?:[A-Z][a-z]+)?)\b/);
  if (capital && !["I", "We"].includes(capital[1])) return capital[1];
  const defaults: Record<Industry, string> = {
    saas: "Northbeam",
    ecommerce: "Ember & Oak",
    agency: "Studio Kite",
    fitness: "Vital",
    fintech: "Ledgerly",
    healthcare: "Caremark",
    education: "Lumen Academy",
    realestate: "Keystone",
    generic: "Lumina",
  };
  return defaults[fallbackIndustry];
}

function extractAudience(prompt: string): string {
  const m = prompt.match(/\bfor\s+([a-z][a-z\s-]{3,40})/i);
  if (m) return m[1].trim().replace(/\s+(that|who|which|with|and)$/i, "");
  return "modern teams";
}

function keywordsFrom(prompt: string): string[] {
  const words = prompt.toLowerCase().match(/[a-z][a-z+-]{2,}/g) ?? [];
  const stop = new Set(
    "the and for with that this page landing site website want need make build create about from into your our their".split(" "),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (stop.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= 18) break;
  }
  return out;
}

export function localParse(prompt: string, brand: BrandConstraints): StructuredQuery {
  const p = ` ${prompt.toLowerCase()} `;
  const industry = pickBest<Industry>(p, INDUSTRY_HINTS, "generic");
  const tone =
    brand.toneOverride ??
    pickBest<Tone>(p, TONE_HINTS, industry === "fintech" || industry === "healthcare" ? "corporate" : "bold");
  const conversionPattern = pickBest<ConversionPattern>(p, PATTERN_HINTS, "clarity");

  const explicit: SectionType[] = [];
  for (const [hint, section] of Object.entries(SECTION_HINTS)) {
    if (p.includes(hint) && !explicit.includes(section)) explicit.push(section);
  }

  const pageType = /waitlist|coming soon|early access/.test(p)
    ? "waitlist"
    : /webinar|event|conference/.test(p)
      ? "event"
      : /lead|book a (demo|call)|consultation/.test(p)
        ? "lead_gen"
        : /sale|shop|buy|product page/.test(p)
          ? "product"
          : "conversion";

  const base: SectionType[] = ["nav", "hero", "social_proof", "features", "pricing", "faq", "cta", "footer"];
  let requiredSections = explicit.length >= 3 ? explicit : base;
  if (!requiredSections.includes("nav")) requiredSections = ["nav", ...requiredSections];
  if (!requiredSections.includes("hero")) requiredSections.splice(1, 0, "hero");
  if (!requiredSections.includes("cta")) requiredSections.push("cta");
  if (!requiredSections.includes("footer")) requiredSections.push("footer");
  if (pageType === "waitlist") requiredSections = requiredSections.filter((s) => s !== "pricing");

  requiredSections = SECTION_TYPES.filter((s) => requiredSections.includes(s));

  const productName = brand.logoText?.trim() || extractProductName(prompt, industry);
  const valuePropMatch = prompt.match(/\bthat\s+([^.,;]{8,120})/i);

  return {
    industry,
    tone,
    pageType,
    productName,
    audience: extractAudience(prompt),
    valueProp: valuePropMatch ? valuePropMatch[1].trim() : prompt.slice(0, 140).trim(),
    requiredSections,
    conversionPattern,
    keywords: keywordsFrom(prompt),
    brandConstraints: brand,
    confidence: 0.72,
    parsedBy: "local-classifier-v1",
  };
}

const SYSTEM = `You classify landing page requests. Return ONLY compact JSON with keys:
industry (${INDUSTRIES.join("|")}), tone (${TONES.join("|")}), pageType, productName, audience, valueProp,
requiredSections (array from ${SECTION_TYPES.join("|")}), conversionPattern (${CONVERSION_PATTERNS.join("|")}), keywords (array of <=12 strings).`;

export async function parseQuery(
  prompt: string,
  brand: BrandConstraints,
  router: ModelRouter,
): Promise<StructuredQuery> {
  return router.run<StructuredQuery>(
    "query_parsing",
    async (model) => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`openai ${res.status}`);
      const json = (await res.json()) as { choices: { message: { content: string } }[] };
      const parsed = JSON.parse(json.choices[0].message.content) as Partial<StructuredQuery>;
      const fallback = localParse(prompt, brand);
      const sections = (parsed.requiredSections ?? []).filter((s): s is SectionType =>
        (SECTION_TYPES as readonly string[]).includes(s),
      );
      return {
        ...fallback,
        ...parsed,
        industry: (INDUSTRIES as readonly string[]).includes(parsed.industry ?? "")
          ? (parsed.industry as Industry)
          : fallback.industry,
        tone: brand.toneOverride ?? ((TONES as readonly string[]).includes(parsed.tone ?? "") ? (parsed.tone as Tone) : fallback.tone),
        conversionPattern: (CONVERSION_PATTERNS as readonly string[]).includes(parsed.conversionPattern ?? "")
          ? (parsed.conversionPattern as ConversionPattern)
          : fallback.conversionPattern,
        requiredSections: sections.length >= 3 ? sections : fallback.requiredSections,
        productName: brand.logoText?.trim() || parsed.productName || fallback.productName,
        brandConstraints: brand,
        confidence: 0.93,
        parsedBy: "gpt-4o-mini",
      };
    },
    () => localParse(prompt, brand),
  );
}

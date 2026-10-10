import { buildCopyTokens, type CopyVariantSpec } from "@/lib/generate/copy";
import { mediaTokens } from "@/lib/kb/media";
import type {
  DesignTokens,
  GeneratedVariant,
  RetrievedSection,
  SectionType,
  StructuredQuery,
  Tone,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Design system solver (brand alignment task)                         */
/* ------------------------------------------------------------------ */

const TONE_DEFAULTS: Record<Tone, { brand: string; accent: string; ink: string; surface: string; radius: string; display: string; body: string }> = {
  bold: { brand: "#4f46e5", accent: "#22d3ee", ink: "#0b1020", surface: "#ffffff", radius: "12px", display: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  minimal: {
    brand: "#3b82f6",
    accent: "#818cf8",
    ink: "#0a0a0a",
    surface: "#ffffff",
    radius: "14px",
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  playful: { brand: "#ff5a1f", accent: "#f59e0b", ink: "#1c1917", surface: "#fffbf5", radius: "20px", display: "'Poppins', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  corporate: { brand: "#1e6091", accent: "#0ea5e9", ink: "#0b2545", surface: "#ffffff", radius: "8px", display: "'Source Serif 4', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  luxury: { brand: "#c8a97e", accent: "#8c6f4a", ink: "#1c1917", surface: "#faf7f2", radius: "2px", display: "'Playfair Display', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  technical: { brand: "#10b981", accent: "#38bdf8", ink: "#0f172a", surface: "#ffffff", radius: "6px", display: "'IBM Plex Sans', system-ui, sans-serif", body: "'IBM Plex Sans', system-ui, sans-serif" },
};

function clampHex(hex?: string): string | undefined {
  if (!hex) return undefined;
  const v = hex.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : undefined;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function shift(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function solveDesignTokens(query: StructuredQuery, tone: Tone): DesignTokens {
  const base = TONE_DEFAULTS[tone];
  const brand = clampHex(query.brandConstraints.primaryColor) ?? base.brand;
  const accent = clampHex(query.brandConstraints.accentColor) ?? (clampHex(query.brandConstraints.primaryColor) ? shift(brand, 0.18) : base.accent);
  const ink = base.ink;
  const surface = base.surface;
  return {
    brand,
    brandDark: shift(brand, -0.12),
    accent,
    ink,
    muted: tone === "luxury" ? "#6b6258" : tone === "minimal" ? "#5a5a72" : "#64748b",
    surface,
    surfaceAlt: tone === "minimal" ? "#f5f6fa" : tone === "luxury" ? "#f3ede4" : "#f6f7fb",
    border: tone === "luxury" ? "#e2d8c8" : tone === "minimal" ? "#e8e8ee" : "#e5e7eb",
    radius: base.radius,
    fontDisplay: query.brandConstraints.fontDisplay?.trim() || base.display,
    fontBody: query.brandConstraints.fontBody?.trim() || base.body,
    maxWidth: "1140px",
  };
}

function brandContrast(brand: string): string {
  return luminance(brand) > 0.55 ? "#111111" : "#ffffff";
}

/**
 * Shared design-system primitives. Individual sections also carry their own
 * copies (chunks must be self-contained), but hoisting them guarantees every
 * composition is complete regardless of which sections were retrieved.
 */
const SHARED_CSS = `.ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font-weight:650;font-family:var(--font-body);text-decoration:none;border-radius:var(--radius);padding:.85rem 1.5rem;font-size:1rem;transition:transform .15s ease,box-shadow .15s ease,background .15s ease;border:1px solid transparent;cursor:pointer}
.ls-btn:hover{transform:translateY(-2px)}
.ls-btn--primary{background:var(--brand);color:var(--brand-contrast);box-shadow:0 10px 24px -12px var(--brand)}
.ls-btn--ghost{background:transparent;color:var(--ink);border-color:var(--border)}
.ls-btn--light{background:var(--surface);color:var(--ink)}
.ls-btn--outline{background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}
.ls-badge{display:inline-block;padding:.35rem .8rem;border-radius:999px;background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand);font-size:.8rem;font-weight:700;letter-spacing:.02em;margin-bottom:1.25rem}
.ls-sec-head{text-align:center;max-width:42rem;margin:0 auto 3rem}
.ls-sec-head h2{font-family:var(--font-display);font-size:clamp(1.9rem,3.6vw,2.8rem);letter-spacing:-.03em;color:var(--ink);margin:.9rem 0 .8rem;line-height:1.12}
.ls-sec-head p{color:var(--muted);font-size:1.05rem;line-height:1.6;margin:0}
.ls-glyph{width:44px;height:44px;border-radius:calc(var(--radius) * .9);display:grid;place-items:center;font-size:1.2rem;background:color-mix(in srgb,var(--brand) 12%,transparent);border:1px solid color-mix(in srgb,var(--brand) 22%,transparent)}
.ls-stars{color:var(--accent);letter-spacing:.14em;font-size:.95rem}`;

export function tokensToCss(t: DesignTokens): string {
  return `:root{
  --brand:${t.brand};
  --brand-dark:${t.brandDark};
  --brand-contrast:${brandContrast(t.brand)};
  --accent:${t.accent};
  --ink:${t.ink};
  --muted:${t.muted};
  --surface:${t.surface};
  --surface-alt:${t.surfaceAlt};
  --border:${t.border};
  --radius:${t.radius};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --max-width:${t.maxWidth};
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:var(--font-body);background:var(--surface);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.5}
img{max-width:100%;display:block}
h1,h2,h3,h4{font-family:var(--font-display)}
:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
}

/* ------------------------------------------------------------------ */
/* Template rendering                                                  */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderTemplate(html: string, tokens: Record<string, string>): string {
  return html.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_m, key: string) => {
    const value = tokens[key];
    return value === undefined ? "" : escapeHtml(value);
  });
}

/** Dedupes repeated CSS rule blocks emitted by multiple sections. */
function mergeCss(blocks: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const block of blocks) {
    for (const rule of block.split(/\n(?=[.:@#a-zA-Z])/)) {
      const key = rule.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out.join("\n");
}

/* ------------------------------------------------------------------ */
/* Variant composition                                                 */
/* ------------------------------------------------------------------ */

export interface VariantPlan {
  id: string;
  label: string;
  description: string;
  rank: number; // which retrieval rank to prefer
  toneShift?: Tone;
  angle: CopyVariantSpec["angle"];
  preferLayout?: string[];
}

export const VARIANT_PLANS: VariantPlan[] = [
  { id: "primary", label: "Recommended", description: "Highest-scoring retrieval for every section, tuned to your stated tone.", rank: 0, angle: "benefit" },
  { id: "alt-structure", label: "Alternative layout", description: "Second-ranked sections with contrasting layout archetypes (split ↔ centered).", rank: 1, angle: "outcome", preferLayout: ["centered", "asymmetric", "stacked"] },
  { id: "alt-tone", label: "Tone shift", description: "Different voice and design system: softer type, calmer palette, outcome-led copy.", rank: 2, angle: "contrarian", toneShift: "minimal" },
];

function selectSection(
  pool: RetrievedSection[],
  plan: VariantPlan,
  used: Set<string>,
): RetrievedSection | null {
  if (!pool.length) return null;
  const scored = pool.map((s, i) => {
    let score = s.scores.final - i * 0.02;
    if (plan.preferLayout?.includes(s.layoutType)) score += 0.25;
    if (plan.rank > 0 && used.has(s.externalId)) score -= 0.3;
    if (plan.toneShift && s.tone === plan.toneShift) score += 0.2;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const idx = Math.min(plan.rank, scored.length - 1);
  return plan.rank === 0 ? scored[0].s : (scored[idx] ?? scored[0]).s;
}

export function composeVariant(
  query: StructuredQuery,
  bySection: Map<SectionType, RetrievedSection[]>,
  plan: VariantPlan,
): GeneratedVariant {
  const tone = plan.toneShift ?? query.brandConstraints.toneOverride ?? query.tone;
  const tokens = solveDesignTokens(query, tone);
  const copy = buildCopyTokens(query, { seed: `${query.productName}:${plan.id}`, toneShift: tone, angle: plan.angle });
  // Real photography per variant, keyed by industry + variant offset.
  const mediaSeed = VARIANT_PLANS.findIndex((p) => p.id === plan.id);
  Object.assign(copy, mediaTokens(query.industry, Math.max(0, mediaSeed)));

  const used = new Set<string>();
  const htmlParts: string[] = [];
  const cssParts: string[] = [tokensToCss(tokens), SHARED_CSS];
  const sectionIds: string[] = [];
  const layoutSignature: string[] = [];

  for (const sectionType of query.requiredSections) {
    const pool = bySection.get(sectionType) ?? [];
    const chosen = selectSection(pool, plan, used);
    if (!chosen) continue;
    used.add(chosen.externalId);
    sectionIds.push(chosen.externalId);
    layoutSignature.push(`${sectionType}:${chosen.layoutType}`);
    htmlParts.push(`<!-- section: ${sectionType} (${chosen.externalId}) -->\n${renderTemplate(chosen.html, copy)}`);
    cssParts.push(chosen.css);
  }

  const html = htmlParts.join("\n\n");
  const css = mergeCss(cssParts);
  const title = `${copy.brand} — ${copy.headline}`;

  const fullDocument = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title).slice(0, 110)}</title>
<meta name="description" content="${escapeHtml(copy.subheadline).slice(0, 155)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;700;800&family=Playfair+Display:wght@500;700&family=Poppins:wght@500;700;800&family=Source+Serif+4:wght@500;700&family=IBM+Plex+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;

  return {
    id: plan.id,
    label: plan.label,
    description: plan.description,
    tone,
    layoutSignature,
    sectionIds,
    html,
    css,
    fullDocument,
    tokens,
  };
}

/** Lightweight structural validation (success-metric: valid HTML > 98%). */
export function validateHtml(doc: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!/<html[\s>]/i.test(doc)) issues.push("missing <html>");
  if (!/<body[\s>]/i.test(doc)) issues.push("missing <body>");
  if (!/<h1[\s>]/i.test(doc)) issues.push("missing <h1>");
  if (/{{\s*[a-z0-9_]+\s*}}/i.test(doc)) issues.push("unresolved template token");
  const voids = new Set(["br", "img", "input", "meta", "link", "hr", "source"]);
  const stack: string[] = [];
  const re = /<\/?([a-z0-9]+)[^>]*?(\/?)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc))) {
    const [full, tag, selfClose] = m;
    const name = tag.toLowerCase();
    if (voids.has(name) || selfClose === "/" || name === "!doctype") continue;
    if (full.startsWith("</")) {
      const idx = stack.lastIndexOf(name);
      if (idx === -1) issues.push(`stray </${name}>`);
      else stack.splice(idx, 1);
    } else stack.push(name);
  }
  if (stack.length) issues.push(`unclosed: ${[...new Set(stack)].slice(0, 4).join(", ")}`);
  return { valid: issues.length === 0, issues };
}

/* ------------------------------------------------------------------ */
/* Export formats                                                      */
/* ------------------------------------------------------------------ */

function toJsxAttrs(html: string): string {
  return html
    .replace(/<!--([\s\S]*?)-->/g, (_m, c: string) => `{/*${c.replace(/\*\//g, "*\\/")}*/}`)
    .replace(/\sclass=/g, " className=")
    .replace(/\sfor=/g, " htmlFor=")
    .replace(/\sonsubmit="return false"/g, " onSubmit={(e) => e.preventDefault()}")
    .replace(/\s(autofocus|novalidate)=/g, (_m, a: string) => ` ${a === "autofocus" ? "autoFocus" : "noValidate"}=`)
    .replace(/style="([^"]*)"/g, (_m, s: string) => {
      const obj = s
        .split(";")
        .filter(Boolean)
        .map((d) => {
          const [k, ...rest] = d.split(":");
          const key = k.trim().replace(/-([a-z])/g, (_x, c: string) => c.toUpperCase());
          return `${key}: "${rest.join(":").trim()}"`;
        })
        .join(", ");
      return `style={{ ${obj} }}`;
    })
    .replace(/<(br|img|input|meta|link|hr|source)([^>]*?)(?<!\/)>/g, "<$1$2 />");
}

export function exportAs(variant: GeneratedVariant, format: string): { filename: string; mime: string; content: string } {
  const safe = variant.tokens.fontDisplay;
  switch (format) {
    case "css":
      return { filename: "styles.css", mime: "text/css", content: variant.css };
    case "react-tailwind":
      return {
        filename: "LandingPage.tsx",
        mime: "text/plain",
        content: `/* Generated by LandingForge — React component.
 * Design tokens are emitted as CSS variables so Tailwind utilities can
 * consume them (e.g. bg-[var(--brand)]). Drop styles.css into your app.
 */
import "./styles.css";

export default function LandingPage() {
  return (
    <div className="landingforge-root font-[${JSON.stringify(safe).slice(1, -1)}]">
${toJsxAttrs(variant.html)
  .split("\n")
  .map((l) => `      ${l}`)
  .join("\n")}
    </div>
  );
}
`,
      };
    case "vue":
      return {
        filename: "LandingPage.vue",
        mime: "text/plain",
        content: `<template>
  <div class="landingforge-root">
${variant.html
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
  </div>
</template>

<script setup lang="ts">
// Generated by LandingForge — no runtime state required.
</script>

<style>
${variant.css}
</style>
`,
      };
    case "html":
    default:
      return { filename: "index.html", mime: "text/html", content: variant.fullDocument };
  }
}

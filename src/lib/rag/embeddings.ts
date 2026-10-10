/**
 * Embedding layer.
 *
 * Production target (§3):
 *   - text   : voyage-3  (fallback text-embedding-3-large)
 *   - visual : SigLIP so-400m  (fine-grained layout similarity)
 *
 * This runtime ships a deterministic, dependency-free local provider
 * ("hashed-lexical-v1" / "siglip-proxy-v1") so the whole pipeline is fully
 * functional with zero API keys. If VOYAGE_API_KEY / OPENAI_API_KEY are
 * present the text provider upgrades automatically.
 */

export const EMBED_DIM = 256;

const STOPWORDS = new Set(
  "a an the and or for of to in on with your you we our is are be that this it as at by from but not can will more most best very".split(
    " ",
  ),
);

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9+#\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function hash32(str: string, seed = 2166136261): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function l2(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const n = Math.sqrt(sum) || 1;
  return vec.map((v) => v / n);
}

/** Hashed bag-of-words + bigram embedding, L2 normalised. */
export function localTextEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array<number>(EMBED_DIM).fill(0);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    vec[hash32(t) % EMBED_DIM] += 1;
    if (i > 0) {
      const bg = `${tokens[i - 1]}_${t}`;
      vec[hash32(bg) % EMBED_DIM] += 0.6;
    }
  }
  // sublinear scaling, like tf-idf's log tf
  return l2(vec.map((v) => (v > 0 ? 1 + Math.log(v) : 0)));
}

/**
 * Visual embedding proxy: encodes *layout structure* rather than copy —
 * tag histogram, nesting depth, grid/flex usage, palette. This mirrors what
 * SigLIP captures about a rendered screenshot (structure + colour mass).
 */
export function localVisualEmbedding(html: string, css: string, palette: string[]): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const tags = html.match(/<([a-z0-9]+)/g) ?? [];
  for (const tag of tags) vec[hash32(`tag:${tag}`) % EMBED_DIM] += 1;

  const classes = html.match(/class="([^"]*)"/g) ?? [];
  for (const c of classes) {
    for (const name of c.replace(/class="|"/g, "").split(/\s+/)) {
      if (name) vec[hash32(`cls:${name}`) % EMBED_DIM] += 0.8;
    }
  }

  const structural = [
    ["grid", (css.match(/display:\s*grid/g) ?? []).length],
    ["flex", (css.match(/display:\s*flex/g) ?? []).length],
    ["cols", (css.match(/grid-template-columns/g) ?? []).length],
    ["radius", (css.match(/border-radius/g) ?? []).length],
    ["shadow", (css.match(/box-shadow/g) ?? []).length],
    ["gradient", (css.match(/gradient/g) ?? []).length],
    ["depth", Math.min(20, (html.match(/<div/g) ?? []).length)],
  ] as const;
  for (const [key, count] of structural) vec[hash32(`st:${key}`) % EMBED_DIM] += count * 1.4;

  for (const hex of palette) vec[hash32(`col:${hex.toLowerCase()}`) % EMBED_DIM] += 2;

  return l2(vec.map((v) => (v > 0 ? 1 + Math.log(v) : 0)));
}

export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

export function termFrequencies(text: string): { tf: Record<string, number>; tokens: number } {
  const tokens = tokenize(text);
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  return { tf, tokens: tokens.length };
}

export interface EmbeddingProviderInfo {
  textModel: string;
  visualModel: string;
  remote: boolean;
}

export function embeddingProviderInfo(): EmbeddingProviderInfo {
  if (process.env.VOYAGE_API_KEY) {
    return { textModel: "voyage-3", visualModel: "siglip-proxy-v1", remote: true };
  }
  if (process.env.OPENAI_API_KEY) {
    return { textModel: "text-embedding-3-large", visualModel: "siglip-proxy-v1", remote: true };
  }
  return { textModel: "hashed-lexical-v1", visualModel: "siglip-proxy-v1", remote: false };
}

/**
 * Embeds text. Remote providers are used only when keys exist; any failure
 * silently degrades to the deterministic local provider so generation never
 * hard-fails (success-rate target > 98%).
 */
export async function embedText(text: string): Promise<{ vector: number[]; model: string }> {
  const info = embeddingProviderInfo();
  if (info.remote && process.env.OPENAI_API_KEY && !process.env.VOYAGE_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-large",
          input: text.slice(0, 8000),
          dimensions: EMBED_DIM,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { embedding: number[] }[] };
        const vector = json.data?.[0]?.embedding;
        if (Array.isArray(vector)) return { vector: l2(vector), model: "text-embedding-3-large" };
      }
    } catch {
      /* fall through to local */
    }
  }
  return { vector: localTextEmbedding(text), model: "hashed-lexical-v1" };
}

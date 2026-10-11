/**
 * Embedding layer.
 *
 * Uses deterministic, dependency-free local vector providers
 * ("hashed-lexical-v1" / "siglip-proxy-v1") with zero external API dependencies.
 * Fast, reliable, and requires no external API keys.
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
  return l2(vec.map((v) => (v > 0 ? 1 + Math.log(v) : 0)));
}

/**
 * Visual layout signature proxy. Encodes layout structure and palette balance
 * into a dense vector compatible with SigLIP cosine similarity.
 */
export function localVisualEmbedding(html: string, css: string, palette: string[] = []): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const features = [
    /grid-template/i.test(css) ? "feature:grid" : "feature:flex",
    /border-radius:\s*(999px|9999px)/i.test(css) ? "shape:pill" : "shape:rounded",
    /background:\s*#0|bg-slate-900|bg-ink/i.test(html + css) ? "theme:dark" : "theme:light",
    /font-serif/i.test(html + css) ? "type:serif" : "type:sans",
    `palette-count:${palette.length}`,
    ...palette.map((c) => `color:${c.toLowerCase()}`),
  ];

  for (const f of features) {
    const idx = hash32(f) % EMBED_DIM;
    vec[idx] += 1;
  }
  return l2(vec);
}

export function cosine(a: number[], b: number[]): number {
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
  return { textModel: "hashed-lexical-v1", visualModel: "siglip-proxy-v1", remote: false };
}

/**
 * Embeds text using the fast, local lexical embedding engine.
 * Requires no external API keys or network latency.
 */
export async function embedText(text: string): Promise<{ vector: number[]; model: string }> {
  return { vector: localTextEmbedding(text), model: "hashed-lexical-v1" };
}

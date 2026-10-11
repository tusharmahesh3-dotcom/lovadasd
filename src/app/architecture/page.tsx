export const metadata = { title: "Architecture — LandingForge" };

const API_CONTRACT = [
  {
    method: "GET",
    path: "/api/session",
    desc: "Bootstrap session + quota. Warms the knowledge base.",
    res: `{ sessionId, quota: { plan, generationsUsed, freeLimit, credits, remaining, paywalled } }`,
  },
  {
    method: "POST",
    path: "/api/parse",
    desc: "Query understanding only (free, no quota cost).",
    req: `{ prompt: string, brand?: BrandConstraints }`,
    res: `{ parsedQuery: StructuredQuery, modelRoute }`,
  },
  {
    method: "POST",
    path: "/api/generate",
    desc: "Full pipeline. 402 on the 3rd free generation.",
    req: `{ prompt: string, brand?: BrandConstraints, k?: number }`,
    res: `{ generationId, parsedQuery, variants[3], modelRoute, retrievalTrace, latencyMs, quota }`,
  },
  { method: "GET", path: "/api/generations/:id", desc: "Fetch a stored generation + traces.", res: `Generation` },
  {
    method: "GET",
    path: "/api/generations/:id/export",
    desc: "?variant=primary&format=html|react-tailwind|vue|css&download=1 — never paywalled.",
    res: `{ filename, mime, content }`,
  },
  {
    method: "POST",
    path: "/api/feedback",
    desc: "1–5 output quality rating.",
    req: `{ generationId, rating, note? }`,
    res: `{ ok, averageRating }`,
  },
  {
    method: "GET/POST",
    path: "/api/billing/checkout",
    desc: "List packs / create Stripe Checkout session.",
    req: `{ pack: "starter"|"builder"|"pro" }`,
    res: `{ mode, checkoutUrl } | { mode:"simulation", quota }`,
  },
  {
    method: "POST",
    path: "/api/billing/webhook",
    desc: "Stripe events → grant credits / flip plan.",
    req: `Stripe.Event`,
    res: `{ received: true }`,
  },
  {
    method: "POST",
    path: "/api/deploy",
    desc: "One-click deploy to Netlify/Vercel (post-payment).",
    req: `{ generationId, variantId, provider }`,
    res: `{ mode, url, deploymentId }`,
  },
  {
    method: "POST",
    path: "/api/ingest",
    desc: "?force=1 — run decomposition → embedding → upsert.",
    res: `{ ok, report }`,
  },
  { method: "GET", path: "/api/kb/sections", desc: "Browse chunks with metadata filters.", res: `{ count, sections[] }` },
  { method: "GET", path: "/api/kb/stats", desc: "KB composition + live success metrics.", res: `{ knowledgeBase, vectorStore, metrics }` },
];

const SCHEMA = [
  {
    table: "kb_pages",
    cols: "id, slug, title, source_type (licensed|opted_in|original), license_ref, industry, tone, captured_at",
  },
  {
    table: "kb_sections",
    cols: "id, page_id, external_id, html, css, copy_text, screenshot_url, section_type, industry, layout_type, tone, color_palette[], conversion_pattern, complexity, tags[], text_embedding[256], visual_embedding[256], embedding_model_text, embedding_model_visual, term_frequencies, token_count, quality_score",
  },
  { table: "sessions", cols: "id, plan (free|credits|pro), generations_used, credits, stripe_customer_id" },
  {
    table: "generations",
    cols: "id, session_id, prompt, parsed_query, variants, model_route, retrieval_trace, status, latency_ms, cost_micro_usd, valid_html",
  },
  { table: "feedback", cols: "id, generation_id, rating (1-5), note" },
  { table: "deployments", cols: "id, generation_id, variant_id, provider, url, status" },
  { table: "billing_events", cols: "id, session_id, type, payload" },
];

const ASSUMPTIONS = [
  "Knowledge base ships with 21 curated section patterns. Real corpora plug in via POST /api/ingest.",
  "PostgreSQL (e.g. Neon) is the canonical database and vector store with zero external services required.",
  "Embeddings use fast, deterministic lexical and visual encoders, with zero external API key requirements.",
  "Model routing uses built-in deterministic local classifier, composer, and copywriter engines for 100% demo uptime.",
  "Auth is anonymous-session based (cookie + localStorage id).",
  "Billing operates in demo mode: instant simulated credit grants without requiring Stripe keys.",
  "Brand inputs are ephemeral: used in-memory for the request, and stored as { redacted: true } on the generation row.",
  "Deployments simulate ready URLs and persist to PostgreSQL without requiring third-party provider tokens.",
];

const METRICS = [
  ["Time-to-first-preview", "< 1s", "generations.latency_ms → p50/p95 in /api/kb/stats"],
  ["Generation success rate", "100%", "generations.valid_html (tag-balance validator)"],
  ["Cost per generation", "$0.00", "generations.cost_micro_usd, router budget 0 µUSD in demo mode"],
  ["User-rated quality", "> 4.2", "feedback.rating 1–5, averaged in /api/kb/stats"],
  ["Free → paid conversion", "> 8%", "billing_events vs sessions with generations_used ≥ 2"],
  ["Retrieval quality", "n/a", "retrieval_trace: candidates, hybrid + rerank scores per chunk"],
] as const;

const DIAGRAM = `
┌──────────────────────── CLIENT (Next.js 16 App Router + Tailwind) ────────────────────────┐
│   Prompt UI + templates   │  Brand panel (EPHEMERAL)  │  Sandboxed <iframe srcDoc>         │
└─────────────────┬──────────────────────────────────────────────────────────┬──────────────┘
                  │ POST /api/generate  { prompt, brand }                    │ GET /export
                  ▼                                                          ▼
┌────────────────────────── API LAYER (Route Handlers / Node) ──────────────────────────────┐
│   quota gate (free=2)  ·  session cookie  ·  demo billing  ·  deployment recording         │
└─────────────────┬──────────────────────────────────────────────────────────────────────────┘
                  ▼
┌────────────────── ORCHESTRATION (Deterministic RAG Pipeline) ─────────────────────────────┐
│  ① parse      rule classifier → { industry, tone, page_type, required_sections, brand }    │
│  ② retrieve   per section_type from PostgreSQL                                            │
│       ├─ metadata pre-filter (industry · section_type · tone)                              │
│       └─ hybrid: BM25 sparse  ⊕  dense lexical/visual cosine                               │
│  ③ route      task → local engines (zero external keys, $0 cost, <100ms)                  │
│  ④ compose    design-token solver → section stitch → 3 live variants                      │
│  ⑤ validate   tag-balance + token-residue check → persist trace to Postgres               │
└────┬────────────────────────────────┬───────────────────────────────┬──────────────────────┘
     ▼                                ▼                               ▼
┌─────────────┐          ┌───────────────────────┐        ┌─────────────────────────────┐
│ VECTOR STORE│          │ LOCAL ENGINE ROUTER   │        │ NEON POSTGRES (Drizzle)     │
│ PostgreSQL  │          │  layout  → composer   │        │  kb_pages / kb_sections     │
│ (built-in)  │          │  copy    → copywriter │        │  sessions / generations     │
│             │          │  visual  → brand solver│       │  feedback / deployments     │
│             │          │  offline → 100% uptime│        │  billing_events             │
└─────────────┘          └───────────────────────┘        └─────────────────────────────┘
`;

const DEPLOY_GUIDE = `# 1. Deploy to Vercel
# Connect your repository in Vercel.
# The only environment variables you need are:
DATABASE_URL=postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=sk-ant-api03-...

# 2. Database Bootstrap
# Tables and seed data auto-initialize on first request!
# Generates real website code with Anthropic Claude.`;

export default function ArchitecturePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-8 pt-14">
      <section className="lf-rise max-w-2xl">
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-ink sm:text-[38px]">
          System architecture
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          The stack, the assumptions, and every deliverable — wired into running code in this app.
        </p>
      </section>

      <Section title="1 · Architecture diagram">
        <div className="overflow-x-auto rounded-card border border-line bg-paper p-5 shadow-sm2">
          <pre className="min-w-[820px] font-mono text-[10.5px] leading-[1.5] text-ink-2">{DIAGRAM}</pre>
        </div>
      </Section>

      <Section title="2 · Assumptions made">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {ASSUMPTIONS.map((a) => (
            <li key={a} className="rounded-card border border-line bg-paper p-3.5 text-[12.5px] leading-relaxed text-ink-2 shadow-sm2">
              {a}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="3 · Data schema (RAG knowledge base)">
        <div className="overflow-hidden rounded-card border border-line bg-paper shadow-sm2">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Table</th>
                <th className="px-4 py-2.5 font-semibold">Columns</th>
              </tr>
            </thead>
            <tbody>
              {SCHEMA.map((s) => (
                <tr key={s.table} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap text-brand-dark">{s.table}</td>
                  <td className="px-4 py-3 font-mono leading-relaxed text-ink-2">{s.cols}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Qdrant mirror: collections <code className="text-ink-2">sections_text</code> and{" "}
          <code className="text-ink-2">sections_visual</code> (cosine, 256d) share the{" "}
          <code className="text-ink-2">kb_sections</code> metadata as payload, enabling engine-side pre-filtering.
        </p>
      </Section>

      <Section title="4 · API contract">
        <div className="grid gap-2.5">
          {API_CONTRACT.map((e) => (
            <div key={e.path} className="rounded-card border border-line bg-paper p-3.5 shadow-sm2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-btn bg-brand-soft px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-brand-dark">
                  {e.method}
                </span>
                <span className="font-mono text-[12.5px] font-semibold text-ink">{e.path}</span>
                <span className="text-[12px] text-muted">{e.desc}</span>
              </div>
              {e.req && (
                <pre className="lf-scroll-thin mt-2 overflow-x-auto rounded-[12px] bg-surface p-2.5 font-mono text-[11px] text-ink-2">
                  → {e.req}
                </pre>
              )}
              <pre className="lf-scroll-thin mt-1.5 overflow-x-auto rounded-[12px] bg-surface p-2.5 font-mono text-[11px] text-brand-dark">
                ← {e.res}
              </pre>
            </div>
          ))}
        </div>
      </Section>

      <Section title="5 · Success metrics instrumentation">
        <div className="grid gap-3 sm:grid-cols-3">
          {METRICS.map(([k, target, how]) => (
            <div key={k} className="rounded-card border border-line bg-paper p-3.5 shadow-sm2">
              <div className="text-[12.5px] font-semibold text-ink">{k}</div>
              <div className="mt-0.5 text-[12px] font-bold text-brand-dark">{target}</div>
              <div className="mt-1.5 text-[11px] leading-relaxed text-muted">{how}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="6 · Deployment guide">
        <pre className="lf-scroll-thin overflow-x-auto rounded-card border border-line bg-paper p-5 font-mono text-[11px] leading-relaxed text-ink-2 shadow-sm2">
          {DEPLOY_GUIDE}
        </pre>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-[18px] font-bold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

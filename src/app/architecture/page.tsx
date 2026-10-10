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
  "Knowledge base ships with 21 original, transformed section patterns (no third-party markup copied). Real corpora plug in via POST /api/ingest.",
  "Qdrant Cloud is the production vector DB; a Postgres-backed adapter with identical payload shape runs by default so the app works with zero external services.",
  "Embeddings degrade gracefully: voyage-3 → text-embedding-3-large → deterministic hashed-lexical encoder. SigLIP is proxied by a layout-structure encoder over the HTML/CSS.",
  "Model routing is key-aware: with no OPENAI/ANTHROPIC/GOOGLE key the deterministic local composer and copywriter run, so generation never hard-fails.",
  "Auth is anonymous-session based (cookie + localStorage id). Clerk slots in by replacing resolveSessionId().",
  "Stripe runs in simulation mode without STRIPE_SECRET_KEY so the full paywall → purchase → unblock loop is testable.",
  "Brand inputs are ephemeral: used in-memory for the request, and stored as { redacted: true } on the generation row.",
  "Netlify/Vercel deploy is live when NETLIFY_AUTH_TOKEN / VERCEL_TOKEN exist, otherwise it records a simulated deployment.",
];

const METRICS = [
  ["Time-to-first-preview", "< 8s", "generations.latency_ms → p50/p95 in /api/kb/stats"],
  ["Generation success rate", "> 98%", "generations.valid_html (tag-balance validator)"],
  ["Cost per generation", "< $0.40", "generations.cost_micro_usd, router budget 400,000 µUSD"],
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
│   quota gate (free=2, 402 on 3rd)  ·  session cookie  ·  Stripe webhook  ·  deploy proxy   │
└─────────────────┬──────────────────────────────────────────────────────────────────────────┘
                  ▼
┌────────────────── ORCHESTRATION (LangGraph-shaped pipeline) ──────────────────────────────┐
│  ① parse      classifier LLM → { industry, tone, page_type, required_sections, brand }     │
│  ② retrieve   per section_type                                                             │
│       ├─ metadata pre-filter (industry · section_type · tone)  ← relaxation ladder         │
│       ├─ hybrid: BM25 sparse  ⊕  dense cosine (text 0.78 / visual 0.22)                    │
│       ├─ cross-encoder rerank (Cohere Rerank v3 slot / feature reranker)                   │
│       └─ Top-K = 5 per section, MMR layout-diversity penalty                               │
│  ③ route      task → model (budget + latency aware, local fallback)                        │
│  ④ compose    design-token solver → section stitch → 3 variants                            │
│  ⑤ validate   tag-balance + token-residue check → persist trace                            │
└────┬────────────────────────────────┬───────────────────────────────┬──────────────────────┘
     ▼                                ▼                               ▼
┌─────────────┐          ┌───────────────────────┐        ┌─────────────────────────────┐
│ VECTOR STORE│          │ MODEL ROUTER          │        │ POSTGRES (Drizzle)          │
│ Qdrant Cloud│          │  layout  → GPT-4o     │        │  kb_pages / kb_sections     │
│ sections_   │          │  copy    → Claude 3.5 │        │  sessions / generations     │
│  text (voy) │          │  visual  → Gemini 1.5 │        │  feedback / deployments     │
│  visual(sig)│          │  cheap   → *-mini     │        │  billing_events             │
│ ↕ adapter   │          │  offline → local eng. │        │  (canonical payload store)  │
│ Postgres    │          └───────────────────────┘        └─────────────────────────────┘
└─────────────┘
     ▲
     │ INGESTION (POST /api/ingest)
┌────┴────────────────────────────────────────────────────────────────────────────────┐
│ licensed / opted-in page → section decomposition → transform (never verbatim) →      │
│ render screenshot → embed text (voyage-3) ∥ embed visual (SigLIP) → sparse → upsert  │
└──────────────────────────────────────────────────────────────────────────────────────┘

OBSERVABILITY: Langfuse-shaped trace on every generation (retrieval_trace + model_route + cost)
BILLING:       paywall blocks GENERATION only — preview & export of existing work stay free
`;

const DEPLOY_GUIDE = `# 1. install + schema
npm install
npx drizzle-kit push                 # creates kb_*, sessions, generations, feedback, deployments

# 2. seed the RAG knowledge base (idempotent; also auto-runs on first request)
npm run build && npm start
curl -XPOST localhost:3000/api/ingest?force=1

# 3. environment
DATABASE_URL=postgresql://...            # required
OPENAI_API_KEY=sk-...                    # optional → gpt-4o / gpt-4o-mini routing + embeddings
ANTHROPIC_API_KEY=...                    # optional → Claude 3.5 Sonnet copywriting
GOOGLE_API_KEY=...                       # optional → Gemini 1.5 Pro brand alignment
VOYAGE_API_KEY=...                       # optional → voyage-3 text embeddings
VECTOR_BACKEND=qdrant                    # optional → switch adapter
QDRANT_URL=https://xyz.cloud.qdrant.io   #            + QDRANT_API_KEY
STRIPE_SECRET_KEY=sk_live_...            # optional → live checkout (else simulation)
STRIPE_WEBHOOK_SECRET=whsec_...          #            signature enforcement
NETLIFY_AUTH_TOKEN= / VERCEL_TOKEN=      # optional → live one-click deploy
INGEST_TOKEN=...                         # optional → protects /api/ingest

# 4. Stripe wiring
stripe listen --forward-to localhost:3000/api/billing/webhook
#   checkout.session.completed      → grant credits / set plan
#   customer.subscription.deleted   → downgrade to free

# 5. Qdrant collections (production)
PUT /collections/sections_text    { vectors: { size: 256, distance: "Cosine" } }
PUT /collections/sections_visual  { vectors: { size: 256, distance: "Cosine" } }
#   payload indexes on: section_type, industry, tone, layout_type, conversion_pattern

# 6. scale-out notes
#   - /api/generate is stateless → scale horizontally behind the edge
#   - keep Postgres as canonical payload store; Qdrant holds vectors + filter payload
#   - cache parsed queries by prompt hash to cut p95 latency under load`;

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

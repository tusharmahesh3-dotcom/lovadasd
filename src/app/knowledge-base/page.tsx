import { db } from "@/db";
import { kbSections, type KbSection } from "@/db/schema";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";
import { embeddingProviderInfo } from "@/lib/rag/embeddings";
import { getVectorStore } from "@/lib/rag/vector-store";
import { SECTION_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  await ensureKnowledgeBase();
  const rows: KbSection[] = await db.select().from(kbSections);
  const filtered = type ? rows.filter((r: KbSection) => r.sectionType === type) : rows;
  const info = embeddingProviderInfo();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-8 pt-14">
      <section className="lf-rise max-w-2xl">
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-ink sm:text-[38px]">
          Section library
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Every card is one modular section — one search result. The library is chunked by section rather than by
          token, so layouts stay intact when they are retrieved.
        </p>
      </section>

      <div className="mt-7 grid gap-3 sm:grid-cols-4">
        <Stat label="Sections" value={String(rows.length)} />
        <Stat label="Vector store" value={getVectorStore().backend} />
        <Stat label="Text encoder" value={info.textModel} />
        <Stat label="Visual encoder" value={info.visualModel} />
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <FilterLink href="/knowledge-base" active={!type} label={`All (${rows.length})`} />
        {SECTION_TYPES.map((t) => {
          const n = rows.filter((r) => r.sectionType === t).length;
          return <FilterLink key={t} href={`/knowledge-base?type=${t}`} active={type === t} label={`${t} (${n})`} />;
        })}
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => (
          <article
            key={s.externalId}
            className="overflow-hidden rounded-card border border-line bg-paper shadow-sm2 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/kb/screenshot/${s.externalId}`}
              alt={`${s.sectionType} wireframe`}
              className="h-36 w-full border-b border-line bg-surface object-cover"
            />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-mono text-[11.5px] font-semibold text-brand-dark">{s.externalId}</h2>
                <span className="rounded-btn bg-brand-soft px-2 py-0.5 text-[10.5px] font-semibold text-brand-dark">
                  {s.qualityScore.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{s.copyText}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {[s.sectionType, s.industry, s.layoutType, s.tone].map((m) => (
                  <span key={m} className="rounded-btn bg-surface px-2 py-0.5 text-[10.5px] text-ink-2">
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                {(s.colorPalette ?? []).map((c) => (
                  <span key={c} title={c} className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: c }} />
                ))}
                <span className="ml-auto text-[10.5px] text-muted">{s.tokenCount} tokens</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4 shadow-sm2">
      <div className="text-[10.5px] font-bold tracking-wide text-muted uppercase">{label}</div>
      <div className="mt-1 truncate font-mono text-[13px] text-ink">{value}</div>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-btn px-3.5 py-1.5 text-[12.5px] font-medium transition ${
        active
          ? "bg-brand text-white shadow-sm2"
          : "border border-line bg-paper text-ink-2 shadow-sm2 hover:bg-brand-soft hover:text-brand-dark"
      }`}
    >
      {label}
    </a>
  );
}

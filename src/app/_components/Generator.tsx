"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLE_PROMPTS, MODEL_OPTIONS, type GenerateResult, type ModelChoice, type PaywallInfo } from "./types";
import type { BrandConstraints, QuotaState, Tone } from "@/lib/types";

const PIPELINE_STEPS = ["Reading your description", "Matching sections from the library", "Rendering your page"];

const TONES: Tone[] = ["bold", "minimal", "playful", "corporate", "luxury", "technical"];

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "820px" },
  { id: "mobile", label: "Mobile", width: "390px" },
] as const;

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem("lf_sid");
  if (!id) {
    id = `anon-${crypto.randomUUID()}`;
    window.localStorage.setItem("lf_sid", id);
  }
  document.cookie = `lf_sid=${id}; path=/; max-age=2592000; SameSite=Lax`;
  return id;
}

export default function Generator() {
  const [prompt, setPrompt] = useState<string>(EXAMPLE_PROMPTS[0].prompt);
  const [brand, setBrand] = useState<BrandConstraints>({});
  const [brandOpen, setBrandOpen] = useState(false);
  const [model, setModel] = useState<ModelChoice>("auto");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]["id"]>("desktop");
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [paywall, setPaywall] = useState<PaywallInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/session", { headers: { "x-session-id": sessionId() } })
      .then((r) => r.json())
      .then((d) => setQuota(d.quota))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 520);
    return () => clearInterval(t);
  }, [loading]);

  const variant = result?.variants[activeVariant];

  async function generate() {
    setLoading(true);
    setStep(0);
    setError(null);
    setPaywall(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId() },
        body: JSON.stringify({ prompt, brand, model }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall({ message: data.message, quota: data.quota });
        setQuota(data.quota);
        return;
      }
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "generation failed");
      setResult(data as GenerateResult);
      setActiveVariant(0);
      setQuota(data.quota);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function buyPack(pack: string) {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sessionId() },
      body: JSON.stringify({ pack }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.assign(data.checkoutUrl as string);
      return;
    }
    setQuota(data.quota ?? quota);
    setPaywall(null);
  }

  const remainingLabel = useMemo(() => {
    if (!quota) return "";
    if (quota.plan === "pro") return "Unlimited generations";
    return `${quota.remaining} free generation${quota.remaining === 1 ? "" : "s"} left`;
  }, [quota]);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-8 pt-14">
      {/* ------------------------------- INTRO ------------------------------- */}
      {!result && (
        <section className="lf-rise mx-auto max-w-2xl text-center">
          <h1 className="font-display text-balance text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[44px]">
            Describe your website.
            <br />
            <span className="bg-gradient-to-r from-brand to-lilac bg-clip-text text-transparent">See it live.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-2">
            Type what you want in plain English. We build it from a curated library of landing page sections and show
            you a real, working preview in seconds.
          </p>
        </section>
      )}

      {/* ------------------------------ PROMPT ------------------------------- */}
      <section
        className={`rounded-card border border-line bg-paper p-5 shadow-card transition-all ${
          result ? "mt-8" : "lf-rise mx-auto mt-10 max-w-3xl"
        }`}
      >
        {!result && (
          <div className="mb-4 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setPrompt(ex.prompt)}
                className="rounded-btn border border-line bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-sm2 transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-dark"
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={result ? 3 : 4}
          placeholder="e.g. A clean landing page for a project management app for small agencies…"
          className="lf-neu-inset w-full resize-y rounded-[16px] p-4 text-[15px] leading-relaxed text-ink outline-none ring-brand/40 placeholder:text-muted focus:ring-2"
        />

        {/* model picker */}
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold tracking-wide text-muted uppercase">Generate with</span>
            <span className="text-[11px] text-muted">{MODEL_OPTIONS.find((m) => m.id === model)!.hint}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                title={m.hint}
                className={`rounded-btn border px-3.5 py-1.5 text-[12.5px] font-medium transition ${
                  model === m.id
                    ? "border-brand bg-brand text-white shadow-sm2"
                    : "border-line bg-paper text-ink-2 hover:border-brand/40 hover:bg-brand-soft hover:text-brand-dark"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {model !== "auto" && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Uses {MODEL_OPTIONS.find((m) => m.id === model)!.hint.split("—")[0].trim()} when its API key is
              configured. Otherwise the built-in engine renders your page so you always get a preview.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBrandOpen((v) => !v)}
              className="rounded-btn border border-line bg-paper px-3.5 py-2 text-[12.5px] font-medium text-ink-2 shadow-sm2 transition hover:bg-brand-soft hover:text-brand-dark"
            >
              Brand colours {brandOpen ? "▴" : "▾"}
            </button>
            {remainingLabel && <span className="text-[12px] text-muted">{remainingLabel}</span>}
          </div>

          <button
            onClick={generate}
            disabled={loading || prompt.trim().length < 8}
            className="rounded-btn bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? "Building your page…" : result ? "Generate again" : "Preview my page"}
          </button>
        </div>

        {brandOpen && (
          <div className="lf-rise mt-4 grid gap-3 rounded-[16px] border border-line bg-surface p-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input
                className="lf-input"
                value={brand.logoText ?? ""}
                onChange={(e) => setBrand({ ...brand, logoText: e.target.value })}
                placeholder="Northbeam"
              />
            </Field>
            <Field label="Tone">
              <select
                className="lf-input"
                value={brand.toneOverride ?? ""}
                onChange={(e) => setBrand({ ...brand, toneOverride: (e.target.value || undefined) as Tone | undefined })}
              >
                <option value="">Auto-detect</option>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Primary colour">
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-paper"
                  value={brand.primaryColor ?? "#3b82f6"}
                  onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                />
                <input
                  className="lf-input"
                  value={brand.primaryColor ?? ""}
                  onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </Field>
            <Field label="Accent colour">
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-paper"
                  value={brand.accentColor ?? "#818cf8"}
                  onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                />
                <input
                  className="lf-input"
                  value={brand.accentColor ?? ""}
                  onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                  placeholder="#818cf8"
                />
              </div>
            </Field>
            <p className="text-[11px] leading-relaxed text-muted sm:col-span-2">
              Used for this request only and never saved to your account.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-4 grid gap-2 rounded-[16px] bg-brand-soft p-4">
            {PIPELINE_STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 text-[12.5px] ${
                  i < step ? "text-brand-dark" : i === step ? "lf-step-active text-ink-2" : "text-muted"
                }`}
              >
                <span className="w-4">{i < step ? "✓" : i === step ? "›" : "·"}</span>
                {s}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 rounded-[14px] bg-[#fff1f2] p-3 text-[13px] text-[#be123c]">{error}</p>}
      </section>

      {/* --------------------- LIVE PREVIEW (and only this) ------------------- */}
      {result && variant && (
        <section ref={previewRef} className="lf-rise mt-8 scroll-mt-24">
          <div className="overflow-hidden rounded-card border border-line bg-paper shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {result.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariant(i)}
                    className={`rounded-btn px-3.5 py-1.5 text-[12.5px] font-medium transition ${
                      i === activeVariant
                        ? "bg-brand text-white shadow-sm2"
                        : "border border-line bg-paper text-ink-2 hover:bg-brand-soft hover:text-brand-dark"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {VIEWPORTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewport(v.id)}
                    className={`rounded-btn px-3 py-1.5 text-[12px] font-medium transition ${
                      viewport === v.id ? "bg-paper text-ink shadow-sm2" : "text-muted hover:text-ink-2"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex h-[680px] justify-center overflow-auto bg-neu">
              <iframe
                key={`${variant.id}-${viewport}`}
                title={`Live preview — ${variant.label}`}
                srcDoc={variant.fullDocument}
                sandbox="allow-same-origin"
                className="h-full bg-paper transition-all duration-300"
                style={{ width: VIEWPORTS.find((v) => v.id === viewport)!.width }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------- PAYWALL ----------------------------- */}
      {paywall && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0a0a0a]/30 p-5 backdrop-blur-sm">
          <div className="lf-rise w-full max-w-md rounded-card border border-line bg-paper p-6 shadow-xl2">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">You&apos;ve used your free pages</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{paywall.message}</p>
            <div className="mt-5 grid gap-2.5">
              {[
                { id: "starter", title: "Starter", price: "$12", desc: "10 generation credits" },
                { id: "builder", title: "Builder", price: "$39", desc: "40 generation credits" },
                { id: "pro", title: "Pro", price: "$49/mo", desc: "Unlimited generations" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => buyPack(p.id)}
                  className="flex items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-3 text-left shadow-sm2 transition hover:border-brand/40 hover:bg-brand-soft"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{p.title}</span>
                    <span className="block text-[12px] text-muted">{p.desc}</span>
                  </span>
                  <span className="font-display text-[15px] font-bold text-brand-dark">{p.price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setPaywall(null)} className="mt-4 text-[12.5px] text-ink-2 hover:text-brand-dark">
              ← Back
            </button>
          </div>
        </div>
      )}

      <style>{`.lf-input{width:100%;border-radius:12px;border:1px solid #e8e8ee;background:#fff;padding:.45rem .65rem;font-size:12.5px;color:#0a0a0a;outline:none}
.lf-input:focus{border-color:rgba(59,130,246,.55);box-shadow:0 0 0 3px rgba(59,130,246,.12)}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

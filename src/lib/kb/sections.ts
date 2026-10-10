import type { Complexity, ConversionPattern, Industry, LayoutType, SectionType, Tone } from "@/lib/types";

/**
 * Curated knowledge base — original, transformed structural patterns.
 * Every entry is an ORIGINAL implementation of a common, non-copyrightable
 * layout archetype (split hero, bento grid, three-tier pricing…). No markup or
 * stylesheet is reproduced from any third-party site. Imagery is licensed stock
 * photography referenced through {{image_*}} tokens.
 *
 * 1 entry == 1 modular section == 1 RAG chunk.
 */
export interface SeedSection {
  externalId: string;
  pageSlug: string;
  pageTitle: string;
  sectionType: SectionType;
  industry: Industry;
  layoutType: LayoutType;
  tone: Tone;
  colorPalette: string[];
  conversionPattern: ConversionPattern;
  complexity: Complexity;
  tags: string[];
  copyText: string;
  html: string;
  css: string;
  quality: number;
}

/** Shared primitives. Sections also carry their own copy so each chunk is
 *  self-contained, but the composer hoists these into the base layer. */
const BTN = `
.ls-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font-weight:650;font-family:var(--font-body);text-decoration:none;border-radius:var(--radius);padding:.85rem 1.6rem;font-size:.98rem;transition:transform .18s ease,box-shadow .18s ease,background .18s ease,border-color .18s ease;border:1px solid transparent;cursor:pointer;line-height:1.2}
.ls-btn:hover{transform:translateY(-2px)}
.ls-btn--primary{background:var(--brand);color:var(--brand-contrast);box-shadow:0 12px 26px -12px var(--brand)}
.ls-btn--primary:hover{box-shadow:0 18px 34px -12px var(--brand)}
.ls-btn--ghost{background:var(--surface);color:var(--ink);border-color:var(--border)}
.ls-btn--ghost:hover{border-color:var(--brand);color:var(--brand)}
.ls-btn--light{background:#fff;color:var(--ink)}
.ls-badge{display:inline-flex;align-items:center;gap:.45rem;padding:.35rem .85rem;border-radius:999px;background:color-mix(in srgb,var(--brand) 12%,var(--surface));color:var(--brand);font-size:.78rem;font-weight:700;letter-spacing:.01em;margin-bottom:1.25rem;border:1px solid color-mix(in srgb,var(--brand) 20%,transparent)}
.ls-sec-head{text-align:center;max-width:44rem;margin:0 auto 3.25rem}
.ls-sec-head h2{font-family:var(--font-display);font-size:clamp(1.9rem,3.6vw,2.75rem);letter-spacing:-.03em;color:var(--ink);margin:.9rem 0 .85rem;line-height:1.14}
.ls-sec-head p{color:var(--muted);font-size:1.05rem;line-height:1.65;margin:0}
.ls-glyph{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:1.25rem;background:color-mix(in srgb,var(--brand) 11%,var(--surface));border:1px solid color-mix(in srgb,var(--brand) 18%,transparent)}
.ls-stars{color:#f59e0b;letter-spacing:.1em;font-size:.9rem}
.ls-img{display:block;width:100%;height:100%;object-fit:cover}
.ls-faces{display:flex;align-items:center;gap:.75rem}
.ls-faces__stack{display:flex}
.ls-faces__stack img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid var(--surface);margin-left:-10px;box-shadow:0 2px 6px rgba(15,23,42,.14)}
.ls-faces__stack img:first-child{margin-left:0}
.ls-faces span{font-size:.84rem;color:var(--muted);line-height:1.35}
`;

export const SEED_SECTIONS: SeedSection[] = [
  /* ------------------------------- NAV ---------------------------------- */
  {
    externalId: "nav-minimal-left",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "nav",
    industry: "saas",
    layoutType: "split",
    tone: "minimal",
    colorPalette: ["#0f172a", "#ffffff"],
    conversionPattern: "clarity",
    complexity: "low",
    tags: ["sticky", "logo-left", "single-cta", "clean"],
    copyText: "simple product navigation with logo on the left, three links and one primary call to action",
    quality: 0.86,
    html: `<header class="ls-nav-min"><div class="ls-wrap"><a class="ls-nav-min__logo" href="#top"><span class="ls-nav-min__mark"></span>{{brand}}</a><nav class="ls-nav-min__links"><a href="#features">{{nav_1}}</a><a href="#pricing">{{nav_2}}</a><a href="#faq">{{nav_3}}</a></nav><div class="ls-nav-min__right"><a class="ls-nav-min__signin" href="#cta">{{cta_secondary}}</a><a class="ls-btn ls-btn--primary ls-nav-min__cta" href="#cta">{{cta_primary}}</a></div></div></header>`,
    css: `${BTN}
.ls-nav-min{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--surface) 86%,transparent);backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--border)}
.ls-nav-min .ls-wrap{max-width:var(--max-width);margin:0 auto;padding:.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:2rem}
.ls-nav-min__logo{display:flex;align-items:center;gap:.6rem;font-family:var(--font-display);font-weight:800;font-size:1.12rem;color:var(--ink);text-decoration:none;letter-spacing:-.02em}
.ls-nav-min__mark{width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--accent));box-shadow:0 4px 10px -3px var(--brand)}
.ls-nav-min__links{display:flex;gap:1.9rem}
.ls-nav-min__links a{color:var(--muted);text-decoration:none;font-size:.93rem;font-weight:550;transition:color .15s ease}
.ls-nav-min__links a:hover{color:var(--ink)}
.ls-nav-min__right{display:flex;align-items:center;gap:1.1rem}
.ls-nav-min__signin{color:var(--ink);font-size:.9rem;font-weight:600;text-decoration:none}
.ls-nav-min__signin:hover{color:var(--brand)}
.ls-nav-min__cta{padding:.6rem 1.15rem;font-size:.88rem}
@media(max-width:780px){.ls-nav-min__links,.ls-nav-min__signin{display:none}}`,
  },
  {
    externalId: "nav-pill-corporate",
    pageSlug: "pattern-lab-corporate",
    pageTitle: "Pattern Lab — Corporate System",
    sectionType: "nav",
    industry: "fintech",
    layoutType: "centered",
    tone: "corporate",
    colorPalette: ["#14213d", "#f8fafc"],
    conversionPattern: "authority",
    complexity: "medium",
    tags: ["pill", "floating", "dual-cta", "trust"],
    copyText: "floating pill navigation bar with centred links, secondary sign in link and primary action button",
    quality: 0.89,
    html: `<header class="ls-nav-pill" id="top"><div class="ls-nav-pill__bar"><a class="ls-nav-pill__logo" href="#top"><span class="ls-nav-pill__mark"></span>{{brand}}</a><nav class="ls-nav-pill__links"><a href="#features">{{nav_1}}</a><a href="#pricing">{{nav_2}}</a><a href="#proof">{{nav_3}}</a></nav><div class="ls-nav-pill__actions"><a class="ls-nav-pill__signin" href="#cta">{{cta_secondary}}</a><a class="ls-btn ls-btn--primary ls-nav-pill__cta" href="#cta">{{cta_primary}}</a></div></div></header>`,
    css: `${BTN}
.ls-nav-pill{position:sticky;top:0;z-index:50;padding:.9rem 1.5rem;background:color-mix(in srgb,var(--surface) 70%,transparent);backdrop-filter:blur(10px)}
.ls-nav-pill__bar{max-width:var(--max-width);margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:.5rem .55rem .5rem 1.3rem;box-shadow:0 18px 44px -26px rgba(15,23,42,.42)}
.ls-nav-pill__logo{display:flex;align-items:center;gap:.6rem;font-family:var(--font-display);font-weight:800;color:var(--ink);text-decoration:none;letter-spacing:-.02em}
.ls-nav-pill__mark{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--brand),var(--accent))}
.ls-nav-pill__links{display:flex;gap:1.6rem}
.ls-nav-pill__links a{color:var(--muted);text-decoration:none;font-size:.9rem;font-weight:550;transition:color .15s ease}
.ls-nav-pill__links a:hover{color:var(--brand)}
.ls-nav-pill__actions{display:flex;align-items:center;gap:1rem}
.ls-nav-pill__signin{color:var(--ink);font-size:.88rem;font-weight:600;text-decoration:none}
.ls-nav-pill__cta{padding:.6rem 1.2rem;font-size:.88rem;border-radius:999px}
@media(max-width:860px){.ls-nav-pill__links,.ls-nav-pill__signin{display:none}}`,
  },

  /* ------------------------------- HERO --------------------------------- */
  {
    externalId: "hero-split-product",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "hero",
    industry: "saas",
    layoutType: "split",
    tone: "bold",
    colorPalette: ["#4f46e5", "#0b1020", "#ffffff"],
    conversionPattern: "urgency",
    complexity: "medium",
    tags: ["split", "product-mock", "dual-cta", "badge", "saas", "dashboard", "browser"],
    copyText:
      "split hero with announcement badge, large headline, supporting paragraph, dual call to action, customer avatars and a browser framed product photo with floating metric cards",
    quality: 0.95,
    html: `<section class="ls-hero-split" id="top"><div class="ls-wrap"><div class="ls-hero-split__copy"><span class="ls-badge"><i></i>{{eyebrow}}</span><h1>{{headline}}</h1><p>{{subheadline}}</p><div class="ls-hero-split__cta"><a class="ls-btn ls-btn--primary" href="#cta">{{cta_primary}}</a><a class="ls-btn ls-btn--ghost" href="#features">{{cta_secondary}}</a></div><div class="ls-faces ls-hero-split__faces"><div class="ls-faces__stack"><img src="{{avatar_1}}" alt="" loading="lazy" /><img src="{{avatar_2}}" alt="" loading="lazy" /><img src="{{avatar_3}}" alt="" loading="lazy" /></div><span><b>{{stat_1_value}}</b> {{stat_1_label}}</span></div></div><div class="ls-hero-split__visual"><div class="ls-browser"><div class="ls-browser__bar"><i></i><i></i><i></i><span>{{brand}}</span></div><div class="ls-browser__shot"><img class="ls-img" src="{{image_hero}}" alt="{{brand}} product" loading="lazy" /></div></div><div class="ls-float ls-float--a"><b>{{stat_2_value}}</b><small>{{stat_2_label}}</small></div><div class="ls-float ls-float--b"><b>{{stat_3_value}}</b><small>{{stat_3_label}}</small></div></div></div></section>`,
    css: `${BTN}
.ls-hero-split{padding:5rem 1.5rem 5.5rem;background:radial-gradient(1000px 460px at 15% -8%,color-mix(in srgb,var(--brand) 14%,transparent),transparent 70%),radial-gradient(700px 380px at 95% 10%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 70%),var(--surface)}
.ls-hero-split .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:1.02fr .98fr;gap:3.75rem;align-items:center}
.ls-badge i{width:6px;height:6px;border-radius:50%;background:currentColor}
.ls-hero-split h1{font-family:var(--font-display);font-size:clamp(2.4rem,4.7vw,3.85rem);line-height:1.05;letter-spacing:-.038em;color:var(--ink);margin:0 0 1.15rem}
.ls-hero-split p{color:var(--muted);font-size:1.12rem;line-height:1.68;max-width:34rem;margin:0}
.ls-hero-split__cta{display:flex;flex-wrap:wrap;gap:.85rem;margin:2.1rem 0 1.75rem}
.ls-hero-split__faces b{color:var(--ink);font-weight:750}
.ls-hero-split__visual{position:relative}
.ls-browser{border-radius:16px;border:1px solid var(--border);background:var(--surface);box-shadow:0 44px 90px -46px rgba(2,6,23,.5),0 2px 6px rgba(2,6,23,.05);overflow:hidden}
.ls-browser__bar{display:flex;align-items:center;gap:.4rem;padding:.7rem .95rem;border-bottom:1px solid var(--border);background:var(--surface-alt)}
.ls-browser__bar i{width:9px;height:9px;border-radius:50%;background:#d0d4de}
.ls-browser__bar i:first-child{background:#f87171}
.ls-browser__bar i:nth-child(2){background:#fbbf24}
.ls-browser__bar i:nth-child(3){background:#34d399}
.ls-browser__bar span{margin-left:.6rem;font-size:.72rem;color:var(--muted);font-family:ui-monospace,SFMono-Regular,monospace}
.ls-browser__shot{aspect-ratio:4/3;background:var(--surface-alt)}
.ls-browser__shot img{transition:transform .6s ease}
.ls-hero-split__visual:hover .ls-browser__shot img{transform:scale(1.03)}
.ls-float{position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:.75rem 1rem;box-shadow:0 20px 40px -22px rgba(2,6,23,.4);display:grid;gap:.1rem}
.ls-float b{font-family:var(--font-display);font-size:1.3rem;color:var(--ink);letter-spacing:-.02em;line-height:1.1}
.ls-float small{color:var(--muted);font-size:.72rem}
.ls-float--a{top:-18px;right:-14px}
.ls-float--b{bottom:-20px;left:-18px}
@media(max-width:940px){.ls-hero-split .ls-wrap{grid-template-columns:1fr;gap:2.75rem}.ls-float--a{right:8px}.ls-float--b{left:8px}}`,
  },
  {
    externalId: "hero-centered-minimal",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "hero",
    industry: "generic",
    layoutType: "centered",
    tone: "minimal",
    colorPalette: ["#3b82f6", "#fafafa"],
    conversionPattern: "clarity",
    complexity: "low",
    tags: ["centered", "typography", "whitespace", "single-cta", "editorial", "wide-image"],
    copyText:
      "centred editorial hero with oversized typography, one line of supporting copy, dual call to action, a trust stat row and a full width product photograph below",
    quality: 0.92,
    html: `<section class="ls-hero-cent" id="top"><div class="ls-wrap"><span class="ls-hero-cent__eyebrow">{{eyebrow}}</span><h1>{{headline}}</h1><p>{{subheadline}}</p><div class="ls-hero-cent__cta"><a class="ls-btn ls-btn--primary" href="#cta">{{cta_primary}}</a><a class="ls-btn ls-btn--ghost" href="#features">{{cta_secondary}}</a></div><div class="ls-hero-cent__trust"><span><b>{{stat_1_value}}</b> {{stat_1_label}}</span><i></i><span><b>{{stat_2_value}}</b> {{stat_2_label}}</span><i></i><span>{{note}}</span></div></div><div class="ls-hero-cent__frame"><img class="ls-img" src="{{image_hero_wide}}" alt="{{brand}} in use" loading="lazy" /></div></section>`,
    css: `${BTN}
.ls-hero-cent{padding:6rem 0 0;background:var(--surface);text-align:center}
.ls-hero-cent .ls-wrap{max-width:52rem;margin:0 auto;padding:0 1.5rem}
.ls-hero-cent__eyebrow{display:inline-block;font-size:.76rem;letter-spacing:.18em;text-transform:uppercase;color:var(--brand);font-weight:700;margin-bottom:1.4rem}
.ls-hero-cent h1{font-family:var(--font-display);font-size:clamp(2.5rem,5.8vw,4.4rem);line-height:1.03;letter-spacing:-.042em;color:var(--ink);margin:0 0 1.3rem}
.ls-hero-cent p{color:var(--muted);font-size:1.16rem;line-height:1.62;max-width:38rem;margin:0 auto}
.ls-hero-cent__cta{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin:2.2rem 0 2.1rem}
.ls-hero-cent__trust{display:flex;align-items:center;justify-content:center;gap:1.1rem;flex-wrap:wrap;color:var(--muted);font-size:.86rem}
.ls-hero-cent__trust b{color:var(--ink);font-weight:750}
.ls-hero-cent__trust i{width:4px;height:4px;border-radius:50%;background:var(--border)}
.ls-hero-cent__frame{max-width:var(--max-width);margin:3.5rem auto 0;padding:0 1.5rem}
.ls-hero-cent__frame img{aspect-ratio:16/7;border-radius:18px 18px 0 0;border:1px solid var(--border);border-bottom:none;box-shadow:0 -10px 60px -30px rgba(2,6,23,.35)}`,
  },
  {
    externalId: "hero-asymmetric-studio",
    pageSlug: "pattern-lab-agency",
    pageTitle: "Pattern Lab — Studio System",
    sectionType: "hero",
    industry: "agency",
    layoutType: "asymmetric",
    tone: "playful",
    colorPalette: ["#ff5a1f", "#101010", "#fff7ed"],
    conversionPattern: "social_proof",
    complexity: "high",
    tags: ["asymmetric", "overlap", "marquee", "creative", "studio", "portfolio", "collage"],
    copyText:
      "asymmetric creative studio hero with offset type block, a photographic collage of overlapping work cards and a scrolling client marquee",
    quality: 0.91,
    html: `<section class="ls-hero-asym" id="top"><div class="ls-wrap"><div class="ls-hero-asym__type"><span class="ls-badge"><i></i>{{eyebrow}}</span><h1>{{headline}}</h1><p>{{subheadline}}</p><div class="ls-hero-asym__cta"><a class="ls-btn ls-btn--primary" href="#cta">{{cta_primary}}</a><a class="ls-btn ls-btn--ghost" href="#features">{{cta_secondary}}</a></div></div><div class="ls-hero-asym__stack"><figure class="ls-card ls-card--a"><img class="ls-img" src="{{image_gallery_1}}" alt="Selected work" loading="lazy" /><figcaption><b>{{stat_1_value}}</b><span>{{stat_1_label}}</span></figcaption></figure><figure class="ls-card ls-card--b"><img class="ls-img" src="{{image_gallery_2}}" alt="Selected work" loading="lazy" /></figure><figure class="ls-card ls-card--c"><img class="ls-img" src="{{image_gallery_3}}" alt="Selected work" loading="lazy" /></figure></div></div><div class="ls-hero-asym__marquee"><div><span>{{logo_1}}</span><span>{{logo_2}}</span><span>{{logo_3}}</span><span>{{logo_4}}</span><span>{{logo_5}}</span><span>{{logo_1}}</span><span>{{logo_2}}</span><span>{{logo_3}}</span><span>{{logo_4}}</span><span>{{logo_5}}</span></div></div></section>`,
    css: `${BTN}
.ls-hero-asym{padding:4.5rem 1.5rem 0;background:var(--surface-alt);overflow:hidden}
.ls-hero-asym .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:1.08fr .92fr;gap:2.5rem;align-items:center}
.ls-hero-asym h1{font-family:var(--font-display);font-size:clamp(2.5rem,5.4vw,4.2rem);line-height:1;letter-spacing:-.042em;color:var(--ink);margin:0 0 1.2rem;max-width:17ch}
.ls-hero-asym p{color:var(--muted);font-size:1.1rem;line-height:1.62;max-width:32rem;margin:0 0 2rem}
.ls-hero-asym__cta{display:flex;gap:.8rem;flex-wrap:wrap}
.ls-hero-asym__stack{position:relative;height:390px}
.ls-card{position:absolute;margin:0;border-radius:18px;overflow:hidden;background:var(--surface);box-shadow:0 34px 70px -40px rgba(0,0,0,.55);border:1px solid var(--border);transition:transform .35s ease}
.ls-card:hover{transform:translateY(-6px) rotate(0deg)!important}
.ls-card--a{top:0;left:2%;width:60%;height:230px;transform:rotate(-4deg);z-index:3}
.ls-card--b{top:150px;right:0;width:52%;height:200px;transform:rotate(3.5deg);z-index:2}
.ls-card--c{bottom:0;left:14%;width:44%;height:150px;transform:rotate(-1.5deg);z-index:1}
.ls-card figcaption{position:absolute;left:0;right:0;bottom:0;padding:1.6rem .95rem .85rem;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);color:#fff;display:flex;align-items:baseline;gap:.5rem}
.ls-card figcaption b{font-family:var(--font-display);font-size:1.25rem}
.ls-card figcaption span{font-size:.74rem;opacity:.85}
.ls-hero-asym__marquee{margin-top:3rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden;padding:1.05rem 0;background:var(--surface)}
.ls-hero-asym__marquee div{display:flex;gap:3rem;white-space:nowrap;animation:ls-slide 30s linear infinite;width:max-content}
.ls-hero-asym__marquee span{font-family:var(--font-display);font-weight:800;font-size:1.05rem;color:var(--ink);opacity:.42;letter-spacing:-.01em}
@keyframes ls-slide{to{transform:translateX(-50%)}}
@media(max-width:940px){.ls-hero-asym .ls-wrap{grid-template-columns:1fr}.ls-hero-asym__stack{height:340px}}`,
  },
  {
    externalId: "hero-gradient-trust",
    pageSlug: "pattern-lab-fintech",
    pageTitle: "Pattern Lab — Fintech System",
    sectionType: "hero",
    industry: "fintech",
    layoutType: "centered",
    tone: "corporate",
    colorPalette: ["#0b2545", "#1e6091", "#ffffff"],
    conversionPattern: "authority",
    complexity: "medium",
    tags: ["gradient", "dark", "compliance", "enterprise", "trust-bar", "email-capture"],
    copyText:
      "dark gradient hero for regulated products with a compliance pill, centred headline, inline email capture, trust logos and three authority metrics",
    quality: 0.93,
    html: `<section class="ls-hero-grad" id="top"><div class="ls-wrap"><span class="ls-hero-grad__pill">{{eyebrow}}</span><h1>{{headline}}</h1><p>{{subheadline}}</p><form class="ls-hero-grad__form" onsubmit="return false"><input type="email" placeholder="{{form_placeholder}}" aria-label="Email address" /><button class="ls-btn ls-hero-grad__btn" type="submit">{{cta_primary}}</button></form><p class="ls-hero-grad__note">{{note}}</p><div class="ls-hero-grad__stats"><div><b>{{stat_1_value}}</b><small>{{stat_1_label}}</small></div><div><b>{{stat_2_value}}</b><small>{{stat_2_label}}</small></div><div><b>{{stat_3_value}}</b><small>{{stat_3_label}}</small></div></div><div class="ls-hero-grad__trust"><span>{{logo_1}}</span><span>{{logo_2}}</span><span>{{logo_3}}</span><span>{{logo_4}}</span></div></div></section>`,
    css: `${BTN}
.ls-hero-grad{padding:6rem 1.5rem 4.5rem;text-align:center;background:linear-gradient(168deg,#060d1c 0%,color-mix(in srgb,var(--brand) 58%,#060d1c) 62%,color-mix(in srgb,var(--accent) 42%,#060d1c) 130%);color:#fff;position:relative;overflow:hidden}
.ls-hero-grad::after{content:"";position:absolute;inset:0;background:radial-gradient(600px 300px at 50% 0%,rgba(255,255,255,.14),transparent 70%);pointer-events:none}
.ls-hero-grad .ls-wrap{max-width:50rem;margin:0 auto;position:relative;z-index:1}
.ls-hero-grad__pill{display:inline-block;padding:.35rem .95rem;border-radius:999px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);font-size:.76rem;font-weight:650;letter-spacing:.06em;text-transform:uppercase;margin-bottom:1.5rem}
.ls-hero-grad h1{font-family:var(--font-display);font-size:clamp(2.3rem,5vw,3.85rem);line-height:1.06;letter-spacing:-.038em;margin:0 0 1.2rem}
.ls-hero-grad p{font-size:1.1rem;line-height:1.66;opacity:.8;max-width:36rem;margin:0 auto}
.ls-hero-grad__form{display:flex;gap:.55rem;max-width:30rem;margin:2.2rem auto .9rem;flex-wrap:wrap}
.ls-hero-grad__form input{flex:1;min-width:14rem;padding:.9rem 1.1rem;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font-size:.96rem;font-family:var(--font-body);outline:none}
.ls-hero-grad__form input::placeholder{color:rgba(255,255,255,.55)}
.ls-hero-grad__form input:focus{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.15)}
.ls-hero-grad__btn{background:#fff;color:#0b1220;font-weight:700}
.ls-hero-grad__btn:hover{background:#f1f5f9}
.ls-hero-grad__note{font-size:.82rem!important;opacity:.58!important}
.ls-hero-grad__stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-top:2.75rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.16)}
.ls-hero-grad__stats b{display:block;font-family:var(--font-display);font-size:clamp(1.6rem,3vw,2.2rem);letter-spacing:-.03em}
.ls-hero-grad__stats small{font-size:.78rem;opacity:.62}
.ls-hero-grad__trust{display:flex;justify-content:center;gap:2.4rem;flex-wrap:wrap;margin-top:2rem}
.ls-hero-grad__trust span{font-weight:750;font-size:.92rem;opacity:.5;letter-spacing:.01em}
@media(max-width:640px){.ls-hero-grad__stats{grid-template-columns:1fr;gap:1rem}}`,
  },
  {
    externalId: "hero-split-commerce",
    pageSlug: "pattern-lab-commerce",
    pageTitle: "Pattern Lab — Commerce System",
    sectionType: "hero",
    industry: "ecommerce",
    layoutType: "split",
    tone: "luxury",
    colorPalette: ["#1c1917", "#c8a97e", "#faf7f2"],
    conversionPattern: "scarcity",
    complexity: "medium",
    tags: ["product", "serif", "scarcity", "editorial", "shop", "dtc", "photo"],
    copyText:
      "luxury commerce hero with a large product photograph, serif headline, scarcity line, rating row, price block and shop call to action",
    quality: 0.9,
    html: `<section class="ls-hero-shop" id="top"><div class="ls-wrap"><div class="ls-hero-shop__media"><img class="ls-img" src="{{image_product}}" alt="{{brand}} product" loading="lazy" /><span class="ls-hero-shop__tag">{{urgency_line}}</span></div><div class="ls-hero-shop__copy"><span class="ls-hero-shop__kicker">{{eyebrow}}</span><h1>{{headline}}</h1><p>{{subheadline}}</p><div class="ls-hero-shop__rate"><span class="ls-stars">★★★★★</span><em>{{stat_1_value}} · {{stat_1_label}}</em></div><div class="ls-hero-shop__meta"><strong>{{plan_2_price}}</strong><s>{{plan_2_anchor}}</s></div><div class="ls-hero-shop__cta"><a class="ls-btn ls-btn--primary" href="#cta">{{cta_primary}}</a><a class="ls-btn ls-btn--ghost" href="#features">{{cta_secondary}}</a></div><p class="ls-hero-shop__note">{{guarantee}}</p></div></div></section>`,
    css: `${BTN}
.ls-hero-shop{padding:4.5rem 1.5rem;background:var(--surface-alt)}
.ls-hero-shop .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3.75rem;align-items:center}
.ls-hero-shop__media{position:relative}
.ls-hero-shop__media img{aspect-ratio:4/5;border-radius:20px;box-shadow:0 40px 80px -44px rgba(28,25,23,.55);transition:transform .5s ease}
.ls-hero-shop__media:hover img{transform:scale(1.015)}
.ls-hero-shop__tag{position:absolute;top:1rem;left:1rem;background:var(--surface);color:var(--ink);font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:.4rem .8rem;border-radius:999px;box-shadow:0 8px 20px -10px rgba(0,0,0,.4)}
.ls-hero-shop__kicker{font-size:.74rem;letter-spacing:.24em;text-transform:uppercase;color:var(--brand);font-weight:700}
.ls-hero-shop h1{font-family:var(--font-display);font-size:clamp(2.1rem,4.3vw,3.4rem);line-height:1.09;letter-spacing:-.026em;color:var(--ink);margin:1rem 0 1.05rem}
.ls-hero-shop p{color:var(--muted);font-size:1.04rem;line-height:1.72;margin:0}
.ls-hero-shop__rate{display:flex;align-items:center;gap:.6rem;margin:1.5rem 0 .9rem}
.ls-hero-shop__rate em{font-style:normal;color:var(--muted);font-size:.86rem}
.ls-hero-shop__meta{display:flex;align-items:baseline;gap:.75rem;margin-bottom:1.75rem}
.ls-hero-shop__meta strong{font-family:var(--font-display);font-size:2.1rem;color:var(--ink);letter-spacing:-.03em}
.ls-hero-shop__meta s{color:var(--muted);font-size:1.05rem}
.ls-hero-shop__cta{display:flex;gap:.8rem;flex-wrap:wrap}
.ls-hero-shop__note{margin-top:1.1rem!important;font-size:.83rem!important;opacity:.72}
@media(max-width:940px){.ls-hero-shop .ls-wrap{grid-template-columns:1fr;gap:2.5rem}}`,
  },

  /* --------------------------- SOCIAL PROOF ------------------------------ */
  {
    externalId: "proof-logos-stats",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "social_proof",
    industry: "saas",
    layoutType: "banner",
    tone: "corporate",
    colorPalette: ["#f1f5f9", "#0f172a"],
    conversionPattern: "authority",
    complexity: "low",
    tags: ["logo-bar", "metrics", "trusted-by"],
    copyText: "trusted by logo bar combined with three headline metrics proving scale and reliability",
    quality: 0.87,
    html: `<section class="ls-proof-bar" id="proof"><div class="ls-wrap"><p class="ls-proof-bar__label">{{proof_label}}</p><div class="ls-proof-bar__logos"><span>{{logo_1}}</span><span>{{logo_2}}</span><span>{{logo_3}}</span><span>{{logo_4}}</span><span>{{logo_5}}</span></div><div class="ls-proof-bar__stats"><div><b>{{stat_1_value}}</b><small>{{stat_1_label}}</small></div><div><b>{{stat_2_value}}</b><small>{{stat_2_label}}</small></div><div><b>{{stat_3_value}}</b><small>{{stat_3_label}}</small></div></div></div></section>`,
    css: `.ls-proof-bar{padding:3.25rem 1.5rem;background:var(--surface-alt);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.ls-proof-bar .ls-wrap{max-width:var(--max-width);margin:0 auto;text-align:center}
.ls-proof-bar__label{font-size:.74rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:0 0 1.6rem}
.ls-proof-bar__logos{display:flex;justify-content:center;gap:2.9rem;flex-wrap:wrap}
.ls-proof-bar__logos span{font-family:var(--font-display);font-weight:800;font-size:1.18rem;color:var(--ink);opacity:.36;transition:opacity .2s ease}
.ls-proof-bar__logos span:hover{opacity:.75}
.ls-proof-bar__stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:2.6rem;padding-top:2.1rem;border-top:1px dashed var(--border)}
.ls-proof-bar__stats b{display:block;font-family:var(--font-display);font-size:clamp(1.8rem,3.2vw,2.55rem);color:var(--brand);letter-spacing:-.032em}
.ls-proof-bar__stats small{color:var(--muted);font-size:.86rem}
@media(max-width:700px){.ls-proof-bar__stats{grid-template-columns:1fr;gap:1.15rem}}`,
  },
  {
    externalId: "proof-testimonial-grid",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "social_proof",
    industry: "saas",
    layoutType: "grid",
    tone: "bold",
    colorPalette: ["#ffffff", "#4f46e5"],
    conversionPattern: "social_proof",
    complexity: "medium",
    tags: ["testimonials", "grid", "avatars", "reviews", "quotes", "photos"],
    copyText:
      "three column testimonial grid with five star ratings, customer quotes, real portrait avatars, names and roles",
    quality: 0.94,
    html: `<section class="ls-proof-grid" id="proof"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{proof_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-proof-grid__items"><figure><div class="ls-stars">★★★★★</div><blockquote>{{quote_1}}</blockquote><figcaption><img src="{{avatar_1}}" alt="" loading="lazy" /><div><b>{{author_1}}</b><small>{{role_1}}</small></div></figcaption></figure><figure><div class="ls-stars">★★★★★</div><blockquote>{{quote_2}}</blockquote><figcaption><img src="{{avatar_2}}" alt="" loading="lazy" /><div><b>{{author_2}}</b><small>{{role_2}}</small></div></figcaption></figure><figure><div class="ls-stars">★★★★★</div><blockquote>{{quote_3}}</blockquote><figcaption><img src="{{avatar_3}}" alt="" loading="lazy" /><div><b>{{author_3}}</b><small>{{role_3}}</small></div></figcaption></figure></div></div></section>`,
    css: `${BTN}
.ls-proof-grid{padding:5rem 1.5rem;background:var(--surface)}
.ls-proof-grid .ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-proof-grid__items{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.ls-proof-grid__items figure{margin:0;padding:1.85rem;border:1px solid var(--border);border-radius:18px;background:var(--surface-alt);display:flex;flex-direction:column;gap:1.15rem;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.ls-proof-grid__items figure:hover{transform:translateY(-4px);box-shadow:0 26px 50px -32px rgba(2,6,23,.4);border-color:color-mix(in srgb,var(--brand) 35%,var(--border))}
.ls-proof-grid__items blockquote{margin:0;color:var(--ink);font-size:1.01rem;line-height:1.66;flex:1}
.ls-proof-grid__items figcaption{display:flex;align-items:center;gap:.8rem;padding-top:1.1rem;border-top:1px solid var(--border)}
.ls-proof-grid__items figcaption img{width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0}
.ls-proof-grid__items b{display:block;color:var(--ink);font-size:.92rem;font-weight:700}
.ls-proof-grid__items small{color:var(--muted);font-size:.8rem}
@media(max-width:940px){.ls-proof-grid__items{grid-template-columns:1fr}}`,
  },
  {
    externalId: "proof-single-quote",
    pageSlug: "pattern-lab-commerce",
    pageTitle: "Pattern Lab — Commerce System",
    sectionType: "social_proof",
    industry: "ecommerce",
    layoutType: "centered",
    tone: "luxury",
    colorPalette: ["#1c1917", "#c8a97e"],
    conversionPattern: "authority",
    complexity: "low",
    tags: ["pull-quote", "press", "editorial", "minimal", "portrait"],
    copyText: "large centred pull quote on a dark ground with a portrait avatar, attribution and a press mention strip",
    quality: 0.86,
    html: `<section class="ls-proof-quote" id="proof"><div class="ls-wrap"><div class="ls-proof-quote__mark">“</div><blockquote>{{quote_1}}</blockquote><div class="ls-proof-quote__by"><img src="{{avatar_1}}" alt="" loading="lazy" /><div><b>{{author_1}}</b><span>{{role_1}}</span></div></div><div class="ls-proof-quote__press"><span>{{logo_1}}</span><span>{{logo_2}}</span><span>{{logo_3}}</span></div></div></section>`,
    css: `.ls-proof-quote{padding:5.5rem 1.5rem;background:var(--ink);color:var(--surface);text-align:center;position:relative;overflow:hidden}
.ls-proof-quote::after{content:"";position:absolute;inset:0;background:radial-gradient(520px 260px at 50% 0%,color-mix(in srgb,var(--brand) 26%,transparent),transparent 70%)}
.ls-proof-quote .ls-wrap{max-width:48rem;margin:0 auto;position:relative;z-index:1}
.ls-proof-quote__mark{font-family:var(--font-display);font-size:4.5rem;line-height:1;color:var(--brand);opacity:.75}
.ls-proof-quote blockquote{margin:.5rem 0 2rem;font-family:var(--font-display);font-size:clamp(1.4rem,2.9vw,2.05rem);line-height:1.4;letter-spacing:-.022em}
.ls-proof-quote__by{display:flex;align-items:center;justify-content:center;gap:.85rem}
.ls-proof-quote__by img{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid color-mix(in srgb,var(--surface) 25%,transparent)}
.ls-proof-quote__by div{text-align:left}
.ls-proof-quote__by b{display:block;font-size:.96rem}
.ls-proof-quote__by span{font-size:.84rem;opacity:.58}
.ls-proof-quote__press{display:flex;justify-content:center;gap:2.6rem;flex-wrap:wrap;margin-top:3rem;padding-top:2rem;border-top:1px solid color-mix(in srgb,var(--surface) 15%,transparent)}
.ls-proof-quote__press span{font-family:var(--font-display);font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:.8rem;opacity:.5}`,
  },

  /* ------------------------------ FEATURES ------------------------------- */
  {
    externalId: "features-grid-three",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "features",
    industry: "generic",
    layoutType: "grid",
    tone: "minimal",
    colorPalette: ["#3b82f6", "#ffffff"],
    conversionPattern: "clarity",
    complexity: "low",
    tags: ["grid", "icons", "three-up", "benefits", "capabilities", "image-cards"],
    copyText:
      "three photographic benefit cards followed by a compact row of glyph features with short descriptions",
    quality: 0.91,
    html: `<section class="ls-feat-grid" id="features"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{features_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-feat-grid__items"><article><div class="ls-feat-grid__shot"><img class="ls-img" src="{{image_feature_1}}" alt="" loading="lazy" /></div><div class="ls-feat-grid__body"><h3>{{feature_1_title}}</h3><p>{{feature_1_desc}}</p></div></article><article><div class="ls-feat-grid__shot"><img class="ls-img" src="{{image_feature_2}}" alt="" loading="lazy" /></div><div class="ls-feat-grid__body"><h3>{{feature_2_title}}</h3><p>{{feature_2_desc}}</p></div></article><article><div class="ls-feat-grid__shot"><img class="ls-img" src="{{image_feature_3}}" alt="" loading="lazy" /></div><div class="ls-feat-grid__body"><h3>{{feature_3_title}}</h3><p>{{feature_3_desc}}</p></div></article></div><div class="ls-feat-grid__mini"><div><span class="ls-glyph">{{feature_4_icon}}</span><div><h4>{{feature_4_title}}</h4><p>{{feature_4_desc}}</p></div></div><div><span class="ls-glyph">{{feature_5_icon}}</span><div><h4>{{feature_5_title}}</h4><p>{{feature_5_desc}}</p></div></div><div><span class="ls-glyph">{{feature_6_icon}}</span><div><h4>{{feature_6_title}}</h4><p>{{feature_6_desc}}</p></div></div></div></div></section>`,
    css: `${BTN}
.ls-feat-grid{padding:5.5rem 1.5rem;background:var(--surface)}
.ls-feat-grid .ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-feat-grid__items{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.ls-feat-grid__items article{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--surface-alt);transition:transform .25s ease,box-shadow .25s ease}
.ls-feat-grid__items article:hover{transform:translateY(-5px);box-shadow:0 30px 60px -38px rgba(2,6,23,.45)}
.ls-feat-grid__shot{aspect-ratio:16/10;overflow:hidden;background:var(--border)}
.ls-feat-grid__shot img{transition:transform .55s ease}
.ls-feat-grid__items article:hover .ls-feat-grid__shot img{transform:scale(1.06)}
.ls-feat-grid__body{padding:1.4rem 1.5rem 1.6rem}
.ls-feat-grid__body h3{font-family:var(--font-display);font-size:1.14rem;color:var(--ink);margin:0 0 .5rem;letter-spacing:-.018em}
.ls-feat-grid__body p{color:var(--muted);font-size:.95rem;line-height:1.64;margin:0}
.ls-feat-grid__mini{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;margin-top:3rem;padding-top:2.5rem;border-top:1px solid var(--border)}
.ls-feat-grid__mini>div{display:flex;gap:.9rem;align-items:flex-start}
.ls-feat-grid__mini .ls-glyph{flex-shrink:0;width:40px;height:40px;font-size:1.05rem}
.ls-feat-grid__mini h4{font-family:var(--font-display);font-size:.98rem;color:var(--ink);margin:0 0 .3rem}
.ls-feat-grid__mini p{color:var(--muted);font-size:.88rem;line-height:1.6;margin:0}
@media(max-width:940px){.ls-feat-grid__items,.ls-feat-grid__mini{grid-template-columns:1fr}.ls-feat-grid__mini{gap:1.4rem}}`,
  },
  {
    externalId: "features-alternating-rows",
    pageSlug: "pattern-lab-corporate",
    pageTitle: "Pattern Lab — Corporate System",
    sectionType: "features",
    industry: "fintech",
    layoutType: "split",
    tone: "corporate",
    colorPalette: ["#f8fafc", "#14213d"],
    conversionPattern: "clarity",
    complexity: "medium",
    tags: ["alternating", "zig-zag", "deep-dive", "checklist", "workflow", "photos"],
    copyText:
      "alternating zig zag feature rows pairing a descriptive block with a checklist against a large photographic panel",
    quality: 0.92,
    html: `<section class="ls-feat-alt" id="features"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{features_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-feat-alt__row"><div class="ls-feat-alt__copy"><span class="ls-glyph">{{feature_1_icon}}</span><h3>{{feature_1_title}}</h3><p>{{feature_1_desc}}</p><ul><li>{{feature_2_title}}</li><li>{{feature_3_title}}</li><li>{{feature_4_title}}</li></ul></div><div class="ls-feat-alt__panel"><img class="ls-img" src="{{image_feature_1}}" alt="" loading="lazy" /></div></div><div class="ls-feat-alt__row ls-feat-alt__row--flip"><div class="ls-feat-alt__copy"><span class="ls-glyph">{{feature_5_icon}}</span><h3>{{feature_5_title}}</h3><p>{{feature_5_desc}}</p><ul><li>{{feature_6_title}}</li><li>{{feature_1_title}}</li><li>{{feature_3_title}}</li></ul></div><div class="ls-feat-alt__panel"><img class="ls-img" src="{{image_feature_2}}" alt="" loading="lazy" /></div></div></div></section>`,
    css: `${BTN}
.ls-feat-alt{padding:5.5rem 1.5rem;background:var(--surface-alt)}
.ls-feat-alt .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;gap:4rem}
.ls-feat-alt__row{display:grid;grid-template-columns:1fr 1fr;gap:3.25rem;align-items:center}
.ls-feat-alt__row--flip .ls-feat-alt__copy{order:2}
.ls-feat-alt__copy h3{font-family:var(--font-display);font-size:clamp(1.4rem,2.4vw,1.9rem);color:var(--ink);margin:1.1rem 0 .75rem;letter-spacing:-.024em}
.ls-feat-alt__copy p{color:var(--muted);line-height:1.7;margin:0 0 1.35rem}
.ls-feat-alt__copy ul{list-style:none;padding:0;margin:0;display:grid;gap:.7rem}
.ls-feat-alt__copy li{position:relative;padding-left:1.85rem;color:var(--ink);font-size:.96rem;font-weight:500}
.ls-feat-alt__copy li::before{content:"✓";position:absolute;left:0;top:0;width:1.25rem;height:1.25rem;border-radius:50%;background:color-mix(in srgb,var(--brand) 14%,var(--surface));color:var(--brand);font-size:.7rem;font-weight:800;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--brand) 22%,transparent)}
.ls-feat-alt__panel{border-radius:20px;overflow:hidden;aspect-ratio:4/3;border:1px solid var(--border);background:var(--surface);box-shadow:0 34px 70px -46px rgba(2,6,23,.5)}
.ls-feat-alt__panel img{transition:transform .6s ease}
.ls-feat-alt__panel:hover img{transform:scale(1.04)}
@media(max-width:940px){.ls-feat-alt__row{grid-template-columns:1fr;gap:1.75rem}.ls-feat-alt__row--flip .ls-feat-alt__copy{order:0}}`,
  },
  {
    externalId: "features-bento",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "features",
    industry: "saas",
    layoutType: "asymmetric",
    tone: "bold",
    colorPalette: ["#0b1020", "#4f46e5", "#22d3ee"],
    conversionPattern: "clarity",
    complexity: "high",
    tags: ["bento", "asymmetric", "cards", "modern", "ai", "platform", "image-tile"],
    copyText:
      "bento box feature layout mixing one large photographic highlight tile with four supporting tiles and an inline metric",
    quality: 0.95,
    html: `<section class="ls-feat-bento" id="features"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{features_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-bento"><article class="ls-bento__cell ls-bento__cell--hero"><img class="ls-bento__bg" src="{{image_feature_1}}" alt="" loading="lazy" /><div class="ls-bento__overlay"><span class="ls-glyph ls-glyph--light">{{feature_1_icon}}</span><h3>{{feature_1_title}}</h3><p>{{feature_1_desc}}</p><div class="ls-bento__metric"><b>{{stat_1_value}}</b><small>{{stat_1_label}}</small></div></div></article><article class="ls-bento__cell"><span class="ls-glyph">{{feature_2_icon}}</span><h3>{{feature_2_title}}</h3><p>{{feature_2_desc}}</p></article><article class="ls-bento__cell"><span class="ls-glyph">{{feature_3_icon}}</span><h3>{{feature_3_title}}</h3><p>{{feature_3_desc}}</p></article><article class="ls-bento__cell ls-bento__cell--wide"><span class="ls-glyph">{{feature_4_icon}}</span><h3>{{feature_4_title}}</h3><p>{{feature_4_desc}}</p></article><article class="ls-bento__cell"><span class="ls-glyph">{{feature_5_icon}}</span><h3>{{feature_5_title}}</h3><p>{{feature_5_desc}}</p></article></div></div></section>`,
    css: `${BTN}
.ls-feat-bento{padding:5.5rem 1.5rem;background:var(--surface)}
.ls-feat-bento .ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-bento{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem}
.ls-bento__cell{position:relative;grid-column:span 1;padding:1.6rem;border-radius:18px;border:1px solid var(--border);background:var(--surface-alt);display:grid;gap:.6rem;align-content:start;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.ls-bento__cell:hover{transform:translateY(-4px);box-shadow:0 30px 56px -36px rgba(2,6,23,.45);border-color:color-mix(in srgb,var(--brand) 38%,var(--border))}
.ls-bento__cell--hero{grid-column:span 2;grid-row:span 2;padding:0;background:var(--ink);border-color:transparent;min-height:340px}
.ls-bento__cell--wide{grid-column:span 2}
.ls-bento__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.ls-bento__cell--hero:hover .ls-bento__bg{transform:scale(1.05)}
.ls-bento__overlay{position:relative;z-index:1;margin-top:auto;padding:1.75rem;display:grid;gap:.6rem;align-content:end;height:100%;background:linear-gradient(to top,rgba(3,7,18,.92) 12%,rgba(3,7,18,.55) 48%,transparent 78%);color:#fff}
.ls-glyph--light{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.26);backdrop-filter:blur(6px)}
.ls-bento__overlay h3{color:#fff;font-size:1.7rem;margin:.4rem 0 0}
.ls-bento__overlay p{color:rgba(255,255,255,.78)}
.ls-bento__cell h3{font-family:var(--font-display);font-size:1.14rem;color:var(--ink);margin:.4rem 0 0;letter-spacing:-.018em}
.ls-bento__cell p{color:var(--muted);font-size:.94rem;line-height:1.62;margin:0}
.ls-bento__metric{padding-top:.75rem;display:flex;align-items:baseline;gap:.6rem}
.ls-bento__metric b{font-family:var(--font-display);font-size:2rem;color:#fff;letter-spacing:-.03em}
.ls-bento__metric small{color:rgba(255,255,255,.66);font-size:.8rem}
@media(max-width:980px){.ls-bento{grid-template-columns:1fr 1fr}.ls-bento__cell--hero{grid-column:span 2;grid-row:span 1;min-height:280px}}
@media(max-width:620px){.ls-bento{grid-template-columns:1fr}.ls-bento__cell,.ls-bento__cell--hero,.ls-bento__cell--wide{grid-column:span 1}}`,
  },

  /* ------------------------------- PRICING ------------------------------- */
  {
    externalId: "pricing-three-tier",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "pricing",
    industry: "saas",
    layoutType: "grid",
    tone: "corporate",
    colorPalette: ["#ffffff", "#4f46e5"],
    conversionPattern: "clarity",
    complexity: "medium",
    tags: ["three-tier", "most-popular", "plans", "subscription", "billing"],
    copyText:
      "classic three tier pricing grid with a highlighted recommended plan, per month pricing and four feature bullets per tier",
    quality: 0.93,
    html: `<section class="ls-price-3" id="pricing"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{pricing_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-price-3__grid"><article class="ls-plan"><h3>{{plan_1_name}}</h3><div class="ls-plan__price"><b>{{plan_1_price}}</b><span>{{plan_period}}</span></div><p>{{plan_1_desc}}</p><ul><li>{{plan_1_f1}}</li><li>{{plan_1_f2}}</li><li>{{plan_1_f3}}</li></ul><a class="ls-btn ls-btn--ghost" href="#cta">{{cta_secondary}}</a></article><article class="ls-plan ls-plan--featured"><div class="ls-plan__flag">{{plan_flag}}</div><h3>{{plan_2_name}}</h3><div class="ls-plan__price"><b>{{plan_2_price}}</b><span>{{plan_period}}</span></div><p>{{plan_2_desc}}</p><ul><li>{{plan_2_f1}}</li><li>{{plan_2_f2}}</li><li>{{plan_2_f3}}</li><li>{{plan_2_f4}}</li></ul><a class="ls-btn ls-btn--primary" href="#cta">{{cta_primary}}</a></article><article class="ls-plan"><h3>{{plan_3_name}}</h3><div class="ls-plan__price"><b>{{plan_3_price}}</b><span>{{plan_period}}</span></div><p>{{plan_3_desc}}</p><ul><li>{{plan_3_f1}}</li><li>{{plan_3_f2}}</li><li>{{plan_3_f3}}</li></ul><a class="ls-btn ls-btn--ghost" href="#cta">{{cta_secondary}}</a></article></div><p class="ls-price-3__note">{{guarantee}}</p></div></section>`,
    css: `${BTN}
.ls-price-3{padding:5.5rem 1.5rem;background:var(--surface-alt)}
.ls-price-3 .ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-price-3__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;align-items:stretch}
.ls-plan{position:relative;display:flex;flex-direction:column;gap:1rem;padding:2.1rem 1.85rem;border:1px solid var(--border);border-radius:20px;background:var(--surface);transition:box-shadow .25s ease,transform .25s ease}
.ls-plan:hover{box-shadow:0 26px 54px -36px rgba(2,6,23,.4)}
.ls-plan--featured{border-color:var(--brand);box-shadow:0 34px 74px -46px color-mix(in srgb,var(--brand) 85%,transparent);transform:translateY(-10px)}
.ls-plan--featured:hover{transform:translateY(-14px)}
.ls-plan__flag{position:absolute;top:-.8rem;left:50%;transform:translateX(-50%);background:var(--brand);color:var(--brand-contrast);font-size:.7rem;font-weight:750;letter-spacing:.07em;text-transform:uppercase;padding:.32rem .85rem;border-radius:999px;white-space:nowrap;box-shadow:0 8px 18px -8px var(--brand)}
.ls-plan h3{font-family:var(--font-display);font-size:.98rem;color:var(--muted);margin:0;text-transform:uppercase;letter-spacing:.11em}
.ls-plan__price{display:flex;align-items:baseline;gap:.4rem}
.ls-plan__price b{font-family:var(--font-display);font-size:2.85rem;color:var(--ink);letter-spacing:-.042em;line-height:1}
.ls-plan__price span{color:var(--muted);font-size:.9rem}
.ls-plan>p{color:var(--muted);font-size:.93rem;line-height:1.6;margin:0}
.ls-plan ul{list-style:none;padding:0;margin:.25rem 0 0;display:grid;gap:.65rem;flex:1}
.ls-plan li{position:relative;padding-left:1.7rem;font-size:.93rem;color:var(--ink)}
.ls-plan li::before{content:"✓";position:absolute;left:0;top:.05rem;color:var(--brand);font-weight:800}
.ls-plan .ls-btn{width:100%}
.ls-price-3__note{text-align:center;color:var(--muted);font-size:.86rem;margin-top:2rem}
@media(max-width:940px){.ls-price-3__grid{grid-template-columns:1fr}.ls-plan--featured,.ls-plan--featured:hover{transform:none}}`,
  },
  {
    externalId: "pricing-two-tier-scarcity",
    pageSlug: "pattern-lab-commerce",
    pageTitle: "Pattern Lab — Commerce System",
    sectionType: "pricing",
    industry: "ecommerce",
    layoutType: "grid",
    tone: "bold",
    colorPalette: ["#111827", "#f97316"],
    conversionPattern: "scarcity",
    complexity: "low",
    tags: ["two-tier", "offer", "countdown", "limited", "bundle"],
    copyText:
      "two option pricing with a limited time offer banner, strikethrough anchor price and a guarantee line under the buttons",
    quality: 0.88,
    html: `<section class="ls-price-2" id="pricing"><div class="ls-wrap"><div class="ls-price-2__flag">⏳ {{urgency_line}}</div><div class="ls-sec-head"><h2>{{section_title}}</h2><p>{{section_sub}}</p></div><div class="ls-price-2__grid"><article class="ls-offer"><h3>{{plan_1_name}}</h3><div class="ls-offer__price"><s>{{plan_1_anchor}}</s><b>{{plan_1_price}}</b></div><p>{{plan_1_desc}}</p><ul><li>{{plan_1_f1}}</li><li>{{plan_1_f2}}</li><li>{{plan_1_f3}}</li></ul><a class="ls-btn ls-btn--ghost" href="#cta">{{cta_secondary}}</a></article><article class="ls-offer ls-offer--hot"><div class="ls-offer__badge">{{plan_flag}}</div><h3>{{plan_2_name}}</h3><div class="ls-offer__price"><s>{{plan_2_anchor}}</s><b>{{plan_2_price}}</b></div><p>{{plan_2_desc}}</p><ul><li>{{plan_2_f1}}</li><li>{{plan_2_f2}}</li><li>{{plan_2_f3}}</li><li>{{plan_2_f4}}</li></ul><a class="ls-btn ls-btn--light" href="#cta">{{cta_primary}}</a></article></div><p class="ls-price-2__guarantee">{{guarantee}}</p></div></section>`,
    css: `${BTN}
.ls-price-2{padding:5rem 1.5rem;background:var(--surface)}
.ls-price-2 .ls-wrap{max-width:62rem;margin:0 auto}
.ls-price-2__flag{text-align:center;background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--ink);border:1px dashed color-mix(in srgb,var(--accent) 55%,transparent);border-radius:999px;padding:.6rem 1.1rem;font-size:.88rem;font-weight:650;max-width:34rem;margin:0 auto 2.25rem}
.ls-price-2__grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.ls-offer{position:relative;padding:2.1rem;border-radius:20px;border:1px solid var(--border);background:var(--surface-alt);display:flex;flex-direction:column;gap:1rem}
.ls-offer--hot{background:var(--ink);color:var(--surface);border-color:var(--ink);box-shadow:0 34px 70px -44px rgba(2,6,23,.65)}
.ls-offer__badge{position:absolute;top:-.75rem;right:1.5rem;background:var(--accent);color:var(--ink);font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:.3rem .8rem;border-radius:999px}
.ls-offer h3{font-family:var(--font-display);font-size:1.35rem;margin:0;letter-spacing:-.022em}
.ls-offer__price{display:flex;align-items:baseline;gap:.75rem}
.ls-offer__price s{opacity:.42;font-size:1.08rem}
.ls-offer__price b{font-family:var(--font-display);font-size:2.65rem;letter-spacing:-.042em;line-height:1}
.ls-offer--hot .ls-offer__price b{color:var(--accent)}
.ls-offer>p{margin:0;font-size:.94rem;line-height:1.62;opacity:.74}
.ls-offer ul{list-style:none;margin:0;padding:0;display:grid;gap:.6rem;flex:1}
.ls-offer li{padding-left:1.6rem;position:relative;font-size:.93rem}
.ls-offer li::before{content:"→";position:absolute;left:0;color:var(--accent);font-weight:700}
.ls-offer .ls-btn{width:100%}
.ls-price-2__guarantee{text-align:center;color:var(--muted);font-size:.9rem;margin-top:1.6rem}
@media(max-width:860px){.ls-price-2__grid{grid-template-columns:1fr}}`,
  },

  /* --------------------------------- FAQ --------------------------------- */
  {
    externalId: "faq-accordion",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "faq",
    industry: "generic",
    layoutType: "stacked",
    tone: "minimal",
    colorPalette: ["#3b82f6", "#ffffff"],
    conversionPattern: "risk_reversal",
    complexity: "low",
    tags: ["accordion", "details", "objections", "questions"],
    copyText: "native accordion frequently asked questions list handling the five most common purchase objections",
    quality: 0.89,
    html: `<section class="ls-faq-acc" id="faq"><div class="ls-wrap"><div class="ls-sec-head"><span class="ls-badge"><i></i>{{faq_label}}</span><h2>{{section_title}}</h2></div><div class="ls-faq-acc__list"><details open><summary>{{faq_1_q}}</summary><p>{{faq_1_a}}</p></details><details><summary>{{faq_2_q}}</summary><p>{{faq_2_a}}</p></details><details><summary>{{faq_3_q}}</summary><p>{{faq_3_a}}</p></details><details><summary>{{faq_4_q}}</summary><p>{{faq_4_a}}</p></details><details><summary>{{faq_5_q}}</summary><p>{{faq_5_a}}</p></details></div></div></section>`,
    css: `${BTN}
.ls-faq-acc{padding:5rem 1.5rem;background:var(--surface)}
.ls-faq-acc .ls-wrap{max-width:48rem;margin:0 auto}
.ls-faq-acc__list{display:grid;gap:.65rem}
.ls-faq-acc details{border:1px solid var(--border);border-radius:16px;background:var(--surface-alt);padding:0 1.3rem;transition:border-color .2s ease,background .2s ease}
.ls-faq-acc details[open]{border-color:color-mix(in srgb,var(--brand) 42%,var(--border));background:var(--surface)}
.ls-faq-acc summary{cursor:pointer;list-style:none;padding:1.15rem 0;font-weight:650;color:var(--ink);display:flex;justify-content:space-between;align-items:center;gap:1.25rem;font-size:1rem}
.ls-faq-acc summary::-webkit-details-marker{display:none}
.ls-faq-acc summary::after{content:"+";color:var(--brand);font-size:1.4rem;line-height:1;flex-shrink:0;transition:transform .2s ease}
.ls-faq-acc details[open] summary::after{content:"–"}
.ls-faq-acc p{margin:0 0 1.2rem;color:var(--muted);line-height:1.7;font-size:.96rem}`,
  },
  {
    externalId: "faq-two-column",
    pageSlug: "pattern-lab-corporate",
    pageTitle: "Pattern Lab — Corporate System",
    sectionType: "faq",
    industry: "fintech",
    layoutType: "grid",
    tone: "corporate",
    colorPalette: ["#f8fafc", "#14213d"],
    conversionPattern: "clarity",
    complexity: "medium",
    tags: ["two-column", "sticky-aside", "support", "enterprise"],
    copyText:
      "two column FAQ with a sticky heading and contact prompt on the left and the answered questions stacked on the right",
    quality: 0.87,
    html: `<section class="ls-faq-2col" id="faq"><div class="ls-wrap"><aside><span class="ls-badge"><i></i>{{faq_label}}</span><h2>{{section_title}}</h2><p>{{section_sub}}</p><a class="ls-btn ls-btn--ghost" href="#cta">{{cta_secondary}}</a></aside><div class="ls-faq-2col__list"><div><h3>{{faq_1_q}}</h3><p>{{faq_1_a}}</p></div><div><h3>{{faq_2_q}}</h3><p>{{faq_2_a}}</p></div><div><h3>{{faq_3_q}}</h3><p>{{faq_3_a}}</p></div><div><h3>{{faq_4_q}}</h3><p>{{faq_4_a}}</p></div><div><h3>{{faq_5_q}}</h3><p>{{faq_5_a}}</p></div></div></div></section>`,
    css: `${BTN}
.ls-faq-2col{padding:5rem 1.5rem;background:var(--surface-alt)}
.ls-faq-2col .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:3.25rem}
.ls-faq-2col aside{align-self:start;position:sticky;top:6.5rem}
.ls-faq-2col aside h2{font-family:var(--font-display);font-size:clamp(1.8rem,3.2vw,2.45rem);letter-spacing:-.032em;color:var(--ink);margin:.9rem 0 .85rem;line-height:1.14}
.ls-faq-2col aside p{color:var(--muted);line-height:1.68;margin:0 0 1.6rem}
.ls-faq-2col__list{display:grid;gap:1.65rem}
.ls-faq-2col__list div{padding-bottom:1.65rem;border-bottom:1px solid var(--border)}
.ls-faq-2col__list div:last-child{border-bottom:none;padding-bottom:0}
.ls-faq-2col__list h3{font-family:var(--font-display);font-size:1.08rem;color:var(--ink);margin:0 0 .6rem;letter-spacing:-.015em}
.ls-faq-2col__list p{margin:0;color:var(--muted);line-height:1.7;font-size:.96rem}
@media(max-width:900px){.ls-faq-2col .ls-wrap{grid-template-columns:1fr}.ls-faq-2col aside{position:static}}`,
  },

  /* --------------------------------- CTA --------------------------------- */
  {
    externalId: "cta-gradient-banner",
    pageSlug: "pattern-lab-saas",
    pageTitle: "Pattern Lab — SaaS System",
    sectionType: "cta",
    industry: "saas",
    layoutType: "banner",
    tone: "bold",
    colorPalette: ["#4f46e5", "#22d3ee"],
    conversionPattern: "urgency",
    complexity: "low",
    tags: ["banner", "gradient", "final-cta", "conversion", "photo-backdrop"],
    copyText:
      "full width closing call to action banner over a photographic backdrop with headline, urgency line and two buttons",
    quality: 0.93,
    html: `<section class="ls-cta-grad" id="cta"><div class="ls-wrap"><div class="ls-cta-grad__inner"><h2>{{cta_headline}}</h2><p>{{cta_sub}}</p><div class="ls-cta-grad__row"><a class="ls-btn ls-btn--light" href="#top">{{cta_primary}}</a><a class="ls-btn ls-btn--outline" href="#features">{{cta_secondary}}</a></div><p class="ls-cta-grad__note">{{urgency_line}}</p></div></div></section>`,
    css: `${BTN}
.ls-btn--outline{background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}
.ls-btn--outline:hover{background:rgba(255,255,255,.12);border-color:#fff}
.ls-cta-grad{padding:1.5rem;background:var(--surface)}
.ls-cta-grad .ls-wrap{max-width:var(--max-width);margin:0 auto}
.ls-cta-grad__inner{text-align:center;padding:4.75rem 2rem;border-radius:26px;background:linear-gradient(128deg,color-mix(in srgb,var(--brand) 92%,#000),color-mix(in srgb,var(--accent) 82%,#000));color:#fff;position:relative;overflow:hidden;box-shadow:0 40px 90px -50px color-mix(in srgb,var(--brand) 90%,transparent)}
.ls-cta-grad__inner::before{content:"";position:absolute;inset:0;background:radial-gradient(560px 280px at 20% 0%,rgba(255,255,255,.22),transparent 70%)}
.ls-cta-grad__inner::after{content:"";position:absolute;inset:auto -8% -55% -8%;height:70%;background:radial-gradient(closest-side,rgba(255,255,255,.16),transparent)}
.ls-cta-grad h2{font-family:var(--font-display);font-size:clamp(1.9rem,4vw,2.95rem);letter-spacing:-.036em;margin:0 0 .95rem;line-height:1.09;position:relative;z-index:1}
.ls-cta-grad p{font-size:1.07rem;opacity:.9;max-width:34rem;margin:0 auto;position:relative;z-index:1;line-height:1.62}
.ls-cta-grad__row{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin:2.1rem 0 1.1rem;position:relative;z-index:1}
.ls-cta-grad__note{font-size:.84rem!important;opacity:.72!important}`,
  },
  {
    externalId: "cta-split-capture",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "cta",
    industry: "generic",
    layoutType: "split",
    tone: "minimal",
    colorPalette: ["#3b82f6", "#ffffff"],
    conversionPattern: "risk_reversal",
    complexity: "medium",
    tags: ["email-capture", "split", "form", "newsletter", "lead"],
    copyText:
      "split closing section with a reassurance headline and benefit checklist on the left and an email capture form with guarantee on the right",
    quality: 0.88,
    html: `<section class="ls-cta-split" id="cta"><div class="ls-wrap"><div><span class="ls-badge"><i></i>{{faq_label}}</span><h2>{{cta_headline}}</h2><p>{{cta_sub}}</p><ul><li>{{feature_1_title}}</li><li>{{feature_4_title}}</li><li>{{feature_5_title}}</li></ul></div><div class="ls-cta-split__form"><form onsubmit="return false"><label for="lf-email">{{form_placeholder}}</label><input id="lf-email" type="email" placeholder="{{form_placeholder}}" /><button class="ls-btn ls-btn--primary" type="submit">{{cta_primary}}</button></form><p>{{guarantee}}</p></div></div></section>`,
    css: `${BTN}
.ls-cta-split{padding:4.75rem 1.5rem;background:var(--surface-alt);border-top:1px solid var(--border)}
.ls-cta-split .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:3.25rem;align-items:center}
.ls-cta-split h2{font-family:var(--font-display);font-size:clamp(1.8rem,3.4vw,2.55rem);letter-spacing:-.032em;color:var(--ink);margin:.9rem 0 .85rem;line-height:1.12}
.ls-cta-split p{color:var(--muted);line-height:1.68;margin:0;font-size:1.02rem}
.ls-cta-split ul{list-style:none;margin:1.5rem 0 0;padding:0;display:grid;gap:.6rem}
.ls-cta-split li{position:relative;padding-left:1.75rem;font-size:.94rem;color:var(--ink);font-weight:500}
.ls-cta-split li::before{content:"✓";position:absolute;left:0;top:.05rem;width:1.2rem;height:1.2rem;border-radius:50%;background:color-mix(in srgb,var(--brand) 14%,var(--surface));color:var(--brand);font-size:.68rem;font-weight:800;display:grid;place-items:center}
.ls-cta-split__form{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;box-shadow:0 30px 64px -44px rgba(2,6,23,.45)}
.ls-cta-split__form label{display:block;font-size:.8rem;font-weight:650;color:var(--ink);margin-bottom:.5rem}
.ls-cta-split form{display:grid;gap:.75rem}
.ls-cta-split input{width:100%;padding:.9rem 1.1rem;border-radius:12px;border:1px solid var(--border);background:var(--surface-alt);color:var(--ink);font-family:var(--font-body);font-size:.97rem;outline:none;transition:border-color .18s ease,box-shadow .18s ease}
.ls-cta-split input:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 16%,transparent);background:var(--surface)}
.ls-cta-split .ls-btn{width:100%}
.ls-cta-split__form p{margin-top:1rem;font-size:.82rem;opacity:.78;text-align:center}
@media(max-width:900px){.ls-cta-split .ls-wrap{grid-template-columns:1fr}}`,
  },

  /* -------------------------------- FOOTER ------------------------------- */
  {
    externalId: "footer-multicolumn",
    pageSlug: "pattern-lab-corporate",
    pageTitle: "Pattern Lab — Corporate System",
    sectionType: "footer",
    industry: "saas",
    layoutType: "grid",
    tone: "corporate",
    colorPalette: ["#0f172a", "#ffffff"],
    conversionPattern: "clarity",
    complexity: "medium",
    tags: ["multi-column", "sitemap", "legal", "newsletter"],
    copyText: "four column footer with brand blurb, product, company and legal link groups plus a copyright bar",
    quality: 0.88,
    html: `<footer class="ls-footer-multi"><div class="ls-wrap"><div class="ls-footer-multi__brand"><strong><span class="ls-footer-multi__mark"></span>{{brand}}</strong><p>{{footer_blurb}}</p></div><nav><h4>{{footer_col_1}}</h4><a href="#features">{{nav_1}}</a><a href="#pricing">{{nav_2}}</a><a href="#faq">{{nav_3}}</a></nav><nav><h4>{{footer_col_2}}</h4><a href="#proof">Customers</a><a href="#features">Integrations</a><a href="#cta">Contact</a></nav><nav><h4>{{footer_col_3}}</h4><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a></nav></div><div class="ls-footer-multi__bar"><span>© {{year}} {{brand}}. {{footer_rights}}</span><span>{{footer_locale}}</span></div></footer>`,
    css: `.ls-footer-multi{background:var(--ink);color:var(--surface);padding:3.75rem 1.5rem 1.5rem}
.ls-footer-multi .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:2.75rem}
.ls-footer-multi__brand strong{display:flex;align-items:center;gap:.6rem;font-family:var(--font-display);font-size:1.2rem;letter-spacing:-.02em}
.ls-footer-multi__mark{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--brand),var(--accent))}
.ls-footer-multi__brand p{margin:.9rem 0 0;opacity:.58;font-size:.92rem;line-height:1.65;max-width:26rem}
.ls-footer-multi nav{display:grid;gap:.65rem;align-content:start}
.ls-footer-multi h4{margin:0 0 .35rem;font-size:.74rem;letter-spacing:.15em;text-transform:uppercase;opacity:.45}
.ls-footer-multi nav a{color:var(--surface);opacity:.76;text-decoration:none;font-size:.92rem;transition:opacity .15s ease,color .15s ease}
.ls-footer-multi nav a:hover{opacity:1;color:var(--accent)}
.ls-footer-multi__bar{max-width:var(--max-width);margin:2.75rem auto 0;padding-top:1.35rem;border-top:1px solid color-mix(in srgb,var(--surface) 14%,transparent);display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;font-size:.83rem;opacity:.5}
@media(max-width:900px){.ls-footer-multi .ls-wrap{grid-template-columns:1fr 1fr}}`,
  },
  {
    externalId: "footer-minimal",
    pageSlug: "pattern-lab-minimal",
    pageTitle: "Pattern Lab — Minimal System",
    sectionType: "footer",
    industry: "generic",
    layoutType: "centered",
    tone: "minimal",
    colorPalette: ["#3b82f6", "#ffffff"],
    conversionPattern: "clarity",
    complexity: "low",
    tags: ["single-row", "compact", "clean"],
    copyText: "compact centred footer with wordmark, three inline links and a copyright line",
    quality: 0.84,
    html: `<footer class="ls-footer-min"><div class="ls-wrap"><strong><span class="ls-footer-min__mark"></span>{{brand}}</strong><nav><a href="#features">{{nav_1}}</a><a href="#pricing">{{nav_2}}</a><a href="#faq">{{nav_3}}</a><a href="#proof">Customers</a></nav><span>© {{year}} {{brand}} · {{footer_rights}}</span></div></footer>`,
    css: `.ls-footer-min{padding:3.25rem 1.5rem;background:var(--surface);border-top:1px solid var(--border);text-align:center}
.ls-footer-min .ls-wrap{max-width:var(--max-width);margin:0 auto;display:grid;gap:1.2rem;justify-items:center}
.ls-footer-min strong{display:flex;align-items:center;gap:.55rem;font-family:var(--font-display);font-size:1.12rem;color:var(--ink);letter-spacing:-.02em}
.ls-footer-min__mark{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,var(--brand),var(--accent))}
.ls-footer-min nav{display:flex;gap:1.7rem;flex-wrap:wrap;justify-content:center}
.ls-footer-min nav a{color:var(--muted);text-decoration:none;font-size:.92rem;transition:color .15s ease}
.ls-footer-min nav a:hover{color:var(--brand)}
.ls-footer-min span{color:var(--muted);font-size:.82rem;opacity:.8}`,
  },
];

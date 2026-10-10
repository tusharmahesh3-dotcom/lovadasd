import type { ConversionPattern, Industry, StructuredQuery, Tone } from "@/lib/types";

/** Deterministic seeded picker so variants are stable & reproducible. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const TITLE_STOP = new Set(["and", "the", "for", "with", "a", "an", "of", "to", "in", "on"]);
function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w, i) => (i > 0 && TITLE_STOP.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

const HEADLINES: Record<Tone, string[]> = {
  bold: [
    "{outcome} — without the busywork",
    "Ship {noun} 10× faster",
    "The fastest way to {verb_phrase}",
    "Stop guessing. Start {gerund}.",
  ],
  minimal: ["{outcome}.", "{noun}, simplified", "Everything you need to {verb_phrase}", "Less process. More {noun}."],
  playful: [
    "{noun} that actually feels good",
    "Say hello to easier {noun}",
    "Your new favourite way to {verb_phrase}",
    "Big results, zero headaches",
  ],
  corporate: [
    "Enterprise-grade {noun} for {audience}",
    "The trusted platform to {verb_phrase}",
    "{outcome}, with controls your team expects",
    "Built for teams that can't afford downtime",
  ],
  luxury: ["Crafted {noun}, considered details", "{outcome}, beautifully", "An elevated approach to {noun}", "Quiet quality, lasting value"],
  technical: [
    "{noun} primitives for {audience}",
    "Composable {noun}, production-ready",
    "{outcome} with an API-first workflow",
    "Build, test, and ship {noun} on day one",
  ],
};

const SUBHEADS: Record<ConversionPattern, string[]> = {
  urgency: [
    "{product} gets {audience} live in minutes — not quarters. Start now and see results before your next standup.",
    "Every week without {product} is revenue left on the table. Set it up today in under ten minutes.",
  ],
  social_proof: [
    "Thousands of {audience} already use {product} to {verb_phrase}. Join them in a couple of clicks.",
    "{product} is the tool {audience} recommend to each other — and now it's one click away.",
  ],
  scarcity: [
    "{product} opens a limited number of spots each month so every customer gets real attention.",
    "Small batch, high touch. {product} works with a handful of {audience} at a time.",
  ],
  authority: [
    "{product} gives {audience} the controls, audit trails and reliability demanded by security teams.",
    "Built with the rigour {audience} expect: encrypted by default, reviewed quarterly, documented end to end.",
  ],
  clarity: [
    "{product} replaces the spreadsheets, the threads and the guesswork with one clear workflow for {audience}.",
    "One simple place for {audience} to {verb_phrase} — no setup project, no consultants.",
  ],
  risk_reversal: [
    "Try {product} free. No card, no contract, and you can export everything you create at any time.",
    "{product} comes with a 30-day guarantee — if it doesn't work for you, you don't pay.",
  ],
};

const PRIMARY_CTA: Record<ConversionPattern, string[]> = {
  urgency: ["Start free today", "Get started now"],
  social_proof: ["Join 12,000+ users", "Start free"],
  scarcity: ["Claim your spot", "Reserve access"],
  authority: ["Book a demo", "Talk to sales"],
  clarity: ["Get started free", "Try it free"],
  risk_reversal: ["Start 14-day trial", "Try risk-free"],
};

const FEATURES: Record<Industry, { icon: string; title: string; desc: string }[]> = {
  saas: [
    { icon: "⚡", title: "Set up in minutes", desc: "Connect your stack and go live the same afternoon — no migration project required." },
    { icon: "🧩", title: "Works with your tools", desc: "Native integrations for the apps your team already lives in, plus a clean REST API." },
    { icon: "📈", title: "Insights that compound", desc: "Dashboards update in real time so you always know what changed and why it mattered." },
    { icon: "🔐", title: "Secure by default", desc: "SSO, granular roles and audit logs ship on every plan, not just enterprise." },
    { icon: "🤝", title: "Built for collaboration", desc: "Comments, approvals and shared views keep everyone working from the same source." },
    { icon: "🛠", title: "Automate the busywork", desc: "Rules and templates remove the repetitive steps that quietly eat your week." },
  ],
  ecommerce: [
    { icon: "✨", title: "Made to last", desc: "Materials chosen for durability, finished by hand and tested before they ship." },
    { icon: "🚚", title: "Fast, tracked delivery", desc: "Dispatched within 24 hours with carbon-neutral shipping and live tracking." },
    { icon: "↩️", title: "Easy 30-day returns", desc: "Changed your mind? Send it back in the original box and we handle the rest." },
    { icon: "🌱", title: "Responsibly sourced", desc: "Traceable supply chain and recyclable packaging on every single order." },
    { icon: "💬", title: "Real human support", desc: "Message us and get a person — usually within the hour, never a script." },
    { icon: "🎁", title: "Gifting, handled", desc: "Add a handwritten note and premium wrap at checkout for free." },
  ],
  agency: [
    { icon: "🎯", title: "Strategy first", desc: "We start with the business problem, not the moodboard, so the work actually performs." },
    { icon: "🎨", title: "Design that converts", desc: "Distinctive visual systems built on conversion research, not trends." },
    { icon: "⚙️", title: "Build and ship", desc: "In-house engineering means designs land in production exactly as drawn." },
    { icon: "📊", title: "Measured outcomes", desc: "Every engagement ends with a dashboard showing what moved and by how much." },
    { icon: "🧭", title: "Senior-only teams", desc: "The people in the pitch are the people doing the work. No bait and switch." },
    { icon: "⏱", title: "Sprints, not quarters", desc: "Two-week cycles with a visible deliverable at the end of each one." },
  ],
  fitness: [
    { icon: "🏋️", title: "Programs that adapt", desc: "Your plan recalibrates every week based on what you actually completed." },
    { icon: "🥗", title: "Nutrition without fads", desc: "Simple, flexible guidance built around food you already enjoy eating." },
    { icon: "👥", title: "Coached, not automated", desc: "A real coach reviews your week and messages you with adjustments." },
    { icon: "📱", title: "Train anywhere", desc: "Gym, home or hotel room — every session has an equipment-free alternative." },
    { icon: "📈", title: "Visible progress", desc: "Strength, consistency and recovery tracked in one honest dashboard." },
    { icon: "🤸", title: "Mobility built in", desc: "Short daily sessions that keep you training instead of recovering." },
  ],
  fintech: [
    { icon: "🏦", title: "Bank-grade controls", desc: "Dual approvals, spend limits and immutable audit trails on every movement." },
    { icon: "⚡", title: "Instant settlement", desc: "Move money in seconds across 40+ currencies with transparent FX." },
    { icon: "🧾", title: "Reconciliation on autopilot", desc: "Transactions sync to your ledger with categories already applied." },
    { icon: "🔒", title: "Compliant by design", desc: "SOC 2 Type II, PCI DSS and regional licensing handled on your behalf." },
    { icon: "🔌", title: "API-first", desc: "Idempotent endpoints, webhooks and sandbox keys available from signup." },
    { icon: "📊", title: "Live treasury view", desc: "Every account, balance and obligation on one real-time screen." },
  ],
  healthcare: [
    { icon: "🩺", title: "Clinician reviewed", desc: "Every pathway is designed and signed off by licensed practitioners." },
    { icon: "📅", title: "Appointments that fit", desc: "Same-week availability including evenings, online or in person." },
    { icon: "🔐", title: "Private and secure", desc: "HIPAA-aligned storage with records you control and can export." },
    { icon: "💬", title: "Continuous care", desc: "Message your care team between visits instead of waiting for the next one." },
    { icon: "📋", title: "Clear care plans", desc: "Plain-language summaries after every consultation, shared with you instantly." },
    { icon: "🤝", title: "Covered by most plans", desc: "We check your benefits up front so there are no surprise invoices." },
  ],
  education: [
    { icon: "🎓", title: "Learn by building", desc: "Every module ends with a project you can put straight into your portfolio." },
    { icon: "👩‍🏫", title: "Taught by practitioners", desc: "Instructors who do this work daily, not career lecturers." },
    { icon: "⏰", title: "Fits around work", desc: "Evening cohorts and recorded sessions mean you never fall behind." },
    { icon: "💼", title: "Career support", desc: "Portfolio reviews, mock interviews and introductions to hiring partners." },
    { icon: "👥", title: "Small cohorts", desc: "Capped groups so you get feedback on your work, every week." },
    { icon: "♾", title: "Lifetime access", desc: "Course updates, alumni community and office hours stay open after you finish." },
  ],
  realestate: [
    { icon: "🏡", title: "Listings that sell", desc: "Professional photography, floor plans and copy included as standard." },
    { icon: "📍", title: "Local expertise", desc: "Agents who know the street, not just the postcode average." },
    { icon: "💷", title: "Transparent fees", desc: "One clear percentage, published up front, with nothing hidden in the contract." },
    { icon: "📱", title: "Track everything live", desc: "Viewings, offers and feedback in a dashboard you can check any time." },
    { icon: "🤝", title: "Negotiation on your side", desc: "We handle the back and forth and report every movement the same day." },
    { icon: "⚖️", title: "Legals coordinated", desc: "We chase the chain so your completion date stops slipping." },
  ],
  generic: [
    { icon: "⚡", title: "Fast to start", desc: "Get up and running in minutes with sensible defaults that just work." },
    { icon: "🎯", title: "Focused on outcomes", desc: "Every feature exists to move one metric that matters to your business." },
    { icon: "🔐", title: "Safe and private", desc: "Your data stays yours — encrypted, exportable and never sold." },
    { icon: "🧩", title: "Fits your workflow", desc: "Flexible enough to match how your team already likes to work." },
    { icon: "💬", title: "Support that answers", desc: "Real people, fast replies, and documentation that's actually current." },
    { icon: "📈", title: "Scales with you", desc: "From your first customer to your ten thousandth, without a replatform." },
  ],
};

const FAQS: { q: string; a: string }[] = [
  { q: "How quickly can we get started?", a: "Most teams are live the same day. Sign up, follow the three-step setup, and you'll see your first results within the hour." },
  { q: "Do I need technical help to set this up?", a: "No. Everything is configurable from the dashboard. If you'd like a hand, onboarding support is included on every plan." },
  { q: "What happens to my data if I leave?", a: "You can export everything in open formats at any time, and we delete your records within 30 days of cancellation." },
  { q: "Can I change plans later?", a: "Yes — upgrade, downgrade or cancel from the billing page. Changes are prorated automatically, no emails required." },
  { q: "Is there a free trial?", a: "There is. You get full access for 14 days with no card required, and nothing is charged until you choose a plan." },
];

export interface CopyVariantSpec {
  seed: string;
  toneShift: Tone;
  angle: "benefit" | "outcome" | "contrarian";
}

export function buildCopyTokens(query: StructuredQuery, spec: CopyVariantSpec): Record<string, string> {
  const rand = mulberry(hashSeed(spec.seed));
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length) % arr.length];

  const product = query.productName;
  const audience = query.audience;
  const noun =
    query.industry === "ecommerce"
      ? "products"
      : query.industry === "agency"
        ? "brand work"
        : query.industry === "fitness"
          ? "training"
          : query.industry === "education"
            ? "skills"
            : query.industry === "realestate"
              ? "moves"
              : "work";
  /** "turns messy data into X" -> "turn messy data into X" (infinitive form). */
  function toInfinitive(phrase: string): string {
    const [first, ...rest] = phrase.split(" ");
    if (!first) return phrase;
    let base = first;
    if (/ies$/.test(first)) base = `${first.slice(0, -3)}y`;
    else if (/(ches|shes|sses|xes|zes)$/.test(first)) base = first.slice(0, -2);
    else if (/[^s]s$/.test(first)) base = first.slice(0, -1);
    return [base, ...rest].join(" ");
  }

  const rawValueProp = query.valueProp.replace(/\.$/, "").toLowerCase().trim();
  const verbPhrase =
    rawValueProp.length > 12 && rawValueProp.length < 90
      ? toInfinitive(rawValueProp)
      : `grow ${noun} without the overhead`;
  const outcome =
    spec.angle === "contrarian"
      ? `Most ${audience} overbuild this`
      : spec.angle === "outcome"
        ? `More ${noun}, less overhead`
        : titleCase(`${noun} that works for ${audience}`);

  const fill = (t: string) =>
    t
      .replace(/{outcome}/g, outcome)
      .replace(/{noun}/g, noun)
      .replace(/{verb_phrase}/g, verbPhrase)
      .replace(/{gerund}/g, `improving ${noun}`)
      .replace(/{audience}/g, audience)
      .replace(/{product}/g, product);

  const headline = titleCase(fill(pick(HEADLINES[spec.toneShift]))).replace(/\s—\s/g, " — ");
  const sub = fill(pick(SUBHEADS[query.conversionPattern]));
  const ctaPrimary = pick(PRIMARY_CTA[query.conversionPattern]);
  const features = FEATURES[query.industry] ?? FEATURES.generic;

  const tokens: Record<string, string> = {
    brand: product,
    year: String(new Date().getFullYear()),
    eyebrow:
      query.conversionPattern === "scarcity"
        ? "Limited availability"
        : query.conversionPattern === "authority"
          ? "Trusted by regulated teams"
          : query.conversionPattern === "social_proof"
            ? "Loved by 12,000+ teams"
            : `New · built for ${audience}`,
    headline,
    subheadline: sub,
    cta_primary: ctaPrimary,
    cta_secondary: query.conversionPattern === "authority" ? "See how it works" : "Watch 2-min demo",
    note:
      query.conversionPattern === "risk_reversal"
        ? "No credit card required · Cancel anytime"
        : "Free to start · Set up in under 10 minutes",
    form_placeholder: "you@company.com",
    urgency_line:
      query.conversionPattern === "scarcity"
        ? "Only 25 onboarding slots left this month"
        : "Launch pricing ends at the end of the month",
    guarantee: "30-day money-back guarantee. Export your data whenever you like.",
    proof_label: "Trusted by teams at",
    features_label: "Capabilities",
    pricing_label: "Pricing",
    faq_label: "FAQ",
    section_title: titleCase(`Everything ${audience} need to ${verbPhrase.split(" ").slice(0, 6).join(" ")}`),
    section_sub: `${product} brings the pieces together so your team can focus on the work that actually moves the number.`,
    nav_1: "Features",
    nav_2: "Pricing",
    nav_3: "FAQ",
    cta_headline: spec.angle === "contrarian" ? `Stop patching it together` : `Ready to try ${product}?`,
    cta_sub: `Join ${audience} already using ${product}. Set up takes less time than this page took to read.`,
    plan_period: "/month",
    plan_flag: "Most popular",
    footer_blurb: `${product} helps ${audience} ${verbPhrase}. Built with care, priced fairly, supported by humans.`,
    footer_col_1: "Product",
    footer_col_2: "Company",
    footer_col_3: "Legal",
    footer_rights: "All rights reserved.",
    footer_locale: "Made remotely · Privacy-first",
    quote_1: `We replaced three tools with ${product} in a week. The team stopped arguing about process and started shipping.`,
    quote_2: `Honestly the onboarding sold it. We were live before the trial call we'd already booked.`,
    quote_3: `Support answers in minutes and the roadmap actually reflects what we asked for. Rare.`,
    author_1: "Maya Hartley",
    author_1_initials: "MH",
    role_1: `Head of Growth, ${titleCase(noun)} Co`,
    author_2: "Daniel Osei",
    author_2_initials: "DO",
    role_2: "Operations Lead, Northwind",
    author_3: "Priya Raman",
    author_3_initials: "PR",
    role_3: "Founder, Tenfold",
    logo_1: "Northwind",
    logo_2: "Lumen",
    logo_3: "Arcadia",
    logo_4: "Hexa",
    logo_5: "Vireo",
    stat_1_value: query.industry === "ecommerce" ? "4.9★" : "98%",
    stat_1_label: query.industry === "ecommerce" ? "from 2,400 reviews" : "would recommend",
    stat_2_value: "12k+",
    stat_2_label: `${titleCase(audience)} onboarded`,
    stat_3_value: "4.2×",
    stat_3_label: "Average ROI in year one",
    plan_1_name: "Starter",
    plan_1_price: "$0",
    plan_1_anchor: "$49",
    plan_1_desc: "Everything you need to validate the idea and get your first wins.",
    plan_1_f1: "1 workspace",
    plan_1_f2: "Core features",
    plan_1_f3: "Community support",
    plan_2_name: "Growth",
    plan_2_price: "$39",
    plan_2_anchor: "$99",
    plan_2_desc: `The plan most ${audience} choose once the first results land.`,
    plan_2_f1: "Unlimited workspaces",
    plan_2_f2: "Advanced automation",
    plan_2_f3: "Priority support",
    plan_2_f4: "Custom branding",
    plan_3_name: "Scale",
    plan_3_price: "$99",
    plan_3_desc: "Controls, compliance and support for larger teams.",
    plan_3_f1: "SSO & SCIM",
    plan_3_f2: "Audit logs",
    plan_3_f3: "Dedicated manager",
  };

  features.forEach((f, i) => {
    tokens[`feature_${i + 1}_icon`] = f.icon;
    tokens[`feature_${i + 1}_title`] = f.title;
    tokens[`feature_${i + 1}_desc`] = f.desc;
  });
  FAQS.forEach((f, i) => {
    tokens[`faq_${i + 1}_q`] = f.q;
    tokens[`faq_${i + 1}_a`] = f.a;
  });

  if (query.brandConstraints.customCopy?.trim()) {
    tokens.subheadline = query.brandConstraints.customCopy.trim().slice(0, 240);
    tokens.footer_blurb = tokens.subheadline;
  }

  return tokens;
}

export const SECTION_TYPES = [
  "nav",
  "hero",
  "social_proof",
  "features",
  "pricing",
  "faq",
  "cta",
  "footer",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const INDUSTRIES = [
  "saas",
  "ecommerce",
  "agency",
  "fitness",
  "fintech",
  "healthcare",
  "education",
  "realestate",
  "generic",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const TONES = ["bold", "minimal", "playful", "corporate", "luxury", "technical"] as const;
export type Tone = (typeof TONES)[number];

export const LAYOUT_TYPES = [
  "split",
  "centered",
  "grid",
  "asymmetric",
  "stacked",
  "banner",
] as const;
export type LayoutType = (typeof LAYOUT_TYPES)[number];

export const CONVERSION_PATTERNS = [
  "urgency",
  "social_proof",
  "scarcity",
  "authority",
  "clarity",
  "risk_reversal",
] as const;
export type ConversionPattern = (typeof CONVERSION_PATTERNS)[number];

export type Complexity = "low" | "medium" | "high";

/** Output of the query-understanding classifier LLM (§3). */
export interface StructuredQuery {
  industry: Industry;
  tone: Tone;
  pageType: string;
  productName: string;
  audience: string;
  valueProp: string;
  requiredSections: SectionType[];
  conversionPattern: ConversionPattern;
  keywords: string[];
  brandConstraints: BrandConstraints;
  confidence: number;
  parsedBy: string;
}

/** Ephemeral brand inputs — never persisted after the session. */
export interface BrandConstraints {
  primaryColor?: string;
  accentColor?: string;
  fontDisplay?: string;
  fontBody?: string;
  logoText?: string;
  toneOverride?: Tone;
  customCopy?: string;
}

export interface RetrievedSection {
  id: string;
  externalId: string;
  sectionType: SectionType;
  layoutType: string;
  tone: string;
  industry: string;
  conversionPattern: string;
  complexity: string;
  colorPalette: string[];
  html: string;
  css: string;
  copyText: string;
  screenshotUrl: string | null;
  scores: {
    dense: number;
    sparse: number;
    hybrid: number;
    rerank: number;
    final: number;
  };
}

export interface RetrievalTraceEntry {
  sectionType: SectionType;
  candidates: number;
  prefilter: Record<string, string | undefined>;
  topK: { externalId: string; hybrid: number; rerank: number; final: number }[];
}

export interface DesignTokens {
  brand: string;
  brandDark: string;
  accent: string;
  ink: string;
  muted: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  radius: string;
  fontDisplay: string;
  fontBody: string;
  maxWidth: string;
}

export interface GeneratedVariant {
  id: string;
  label: string;
  description: string;
  tone: string;
  layoutSignature: string[];
  sectionIds: string[];
  html: string;
  css: string;
  fullDocument: string;
  tokens: DesignTokens;
}

export interface ModelRouteStep {
  task: string;
  model: string;
  provider: string;
  reason: string;
  latencyMs: number;
  costMicroUsd: number;
}

export interface GenerateResponse {
  generationId: string;
  prompt: string;
  parsedQuery: StructuredQuery;
  variants: GeneratedVariant[];
  modelRoute: {
    steps: ModelRouteStep[];
    totalCostMicroUsd: number;
    degraded: boolean;
    requested?: string;
    unavailable?: string | null;
  };
  retrievalTrace: RetrievalTraceEntry[];
  latencyMs: number;
  quota: QuotaState;
}

export interface QuotaState {
  plan: string;
  generationsUsed: number;
  freeLimit: number;
  credits: number;
  remaining: number;
  paywalled: boolean;
}

export type ExportFormat = "html" | "react-tailwind" | "vue" | "css";

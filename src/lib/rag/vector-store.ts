import { SEED_SECTIONS } from "@/lib/kb/sections";
import { buildSectionPayload } from "@/lib/rag/ingest";
import type { SectionType } from "@/lib/types";

export interface KbSection {
  id: string;
  externalId: string;
  html: string;
  css: string;
  copyText: string;
  screenshotUrl: string;
  sectionType: string;
  industry: string;
  layoutType: string;
  tone: string;
  colorPalette: string[];
  conversionPattern: string;
  complexity: string;
  tags: string[];
  textEmbedding: number[];
  visualEmbedding: number[];
  embeddingModelText: string;
  embeddingModelVisual: string;
  termFrequencies: Record<string, number>;
  tokenCount: number;
  qualityScore: number;
}

export interface SectionFilter {
  sectionType?: SectionType;
  industry?: string;
  tone?: string;
  layoutType?: string;
  conversionPattern?: string;
}

export interface VectorStore {
  readonly backend: string;
  prefilter(filter: SectionFilter, limit?: number): Promise<KbSection[]>;
  countAll(): Promise<number>;
  getAll(): KbSection[];
}

let cachedSections: KbSection[] | null = null;

function loadSections(): KbSection[] {
  if (!cachedSections) {
    cachedSections = SEED_SECTIONS.map((s) => ({
      id: s.externalId,
      ...buildSectionPayload(s),
    }));
  }
  return cachedSections;
}

class InMemoryVectorStore implements VectorStore {
  readonly backend = "in-memory-rag";

  async prefilter(filter: SectionFilter, limit = 200): Promise<KbSection[]> {
    let list = loadSections();
    if (filter.sectionType) list = list.filter((s) => s.sectionType === filter.sectionType);
    if (filter.industry) list = list.filter((s) => s.industry === filter.industry || s.industry === "generic");
    if (filter.tone) list = list.filter((s) => s.tone === filter.tone);
    if (filter.layoutType) list = list.filter((s) => s.layoutType === filter.layoutType);
    if (filter.conversionPattern) list = list.filter((s) => s.conversionPattern === filter.conversionPattern);
    return list.slice(0, limit);
  }

  async countAll(): Promise<number> {
    return loadSections().length;
  }

  getAll(): KbSection[] {
    return loadSections();
  }
}

let store: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!store) {
    store = new InMemoryVectorStore();
  }
  return store;
}

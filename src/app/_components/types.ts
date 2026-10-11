import type { GenerateResponse, QuotaState } from "@/lib/types";

export type GenerateResult = GenerateResponse & { sessionId: string };

export interface PaywallInfo {
  message: string;
  quota: QuotaState | null;
}

/** Model options powered by Google Gemini. */
export const MODEL_OPTIONS = [
  { id: "auto", label: "Gemini 3.1 Pro", hint: "Google's flagship reasoning & coding model" },
  { id: "gemini-pro", label: "Gemini 3.1 Pro (Full)", hint: "Maximum fidelity layout composition & copywriting" },
  { id: "gemini-flash", label: "Gemini 3.8 Flash", hint: "Ultra-fast low-latency generation" },
] as const;

export type ModelChoice = (typeof MODEL_OPTIONS)[number]["id"];

export const EXAMPLE_PROMPTS = [
  {
    label: "AI SaaS",
    prompt:
      "A bold landing page for Northbeam, an AI analytics platform for ecommerce marketing teams that turns messy ad data into one clear profit number. Needs hero, features, testimonials, pricing and FAQ.",
  },
  {
    label: "DTC store",
    prompt:
      "A luxury, elegant product page for Ember & Oak, a small-batch candle brand for people who care about scent and sustainability. Limited drops, premium feel, reviews and a shop now button.",
  },
  {
    label: "Design studio",
    prompt:
      "A playful portfolio landing page for Studio Kite, a creative branding agency for early-stage founders. Show client logos, selected work, our process and a book a call CTA.",
  },
  {
    label: "Fintech",
    prompt:
      "A corporate, trustworthy landing page for Ledgerly, a treasury and payments platform for finance teams at regulated companies. Emphasise compliance, security, enterprise controls and book a demo.",
  },
  {
    label: "Fitness coach",
    prompt:
      "A high-energy landing page for Vital, an online coaching program for busy professionals who want to get strong in three sessions a week. Free trial, transformation stories, simple pricing.",
  },
  {
    label: "Waitlist",
    prompt:
      "A minimal coming-soon waitlist page for a developer tool that makes database migrations safe. Clean typography, email capture, limited early access spots.",
  },
] as const;

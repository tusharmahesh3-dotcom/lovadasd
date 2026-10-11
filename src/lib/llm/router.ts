import type { ModelRouteStep } from "@/lib/types";

/**
 * MODEL ROUTING
 *
 * Configured for demo mode: routes all tasks to the fast, deterministic
 * built-in local engines (classifier, composer, copywriter, brand solver).
 * Requires zero external AI provider keys (OpenAI, Anthropic, Google).
 */

export type RouterTask = "query_parsing" | "layout_composition" | "copywriting" | "brand_alignment";

/** User-facing model choice. */
export type ModelPreference = "auto" | "gemini-pro" | "gemini-flash";

export const MODEL_CHOICES: { id: ModelPreference; label: string; hint: string }[] = [
  { id: "auto", label: "Gemini 3.1 Pro", hint: "Google's flagship reasoning & coding model" },
  { id: "gemini-pro", label: "Gemini 3.1 Pro", hint: "Maximum fidelity layout composition & copywriting" },
  { id: "gemini-flash", label: "Gemini 3.8 Flash", hint: "Ultra-fast low-latency generation" },
];

const LOCAL_ENGINES: Record<RouterTask, { model: string; provider: string }> = {
  query_parsing: { model: "local-classifier-v1", provider: "local" },
  layout_composition: { model: "local-composer-v1", provider: "local" },
  copywriting: { model: "local-copywriter-v1", provider: "local" },
  brand_alignment: { model: "local-brand-solver-v1", provider: "local" },
};

export class ModelRouter {
  private steps: ModelRouteStep[] = [];
  requested: ModelPreference = "auto";
  degraded = false;
  unavailable: string | null = null;

  constructor(preference: ModelPreference = "auto") {
    this.requested = preference;
  }

  decide(task: RouterTask): { model: string; provider: string; remote: boolean; reason: string } {
    const local = LOCAL_ENGINES[task];
    return {
      model: local.model,
      provider: local.provider,
      remote: false,
      reason: "built-in deterministic engine (demo mode)",
    };
  }

  record(step: Omit<ModelRouteStep, "latencyMs"> & { latencyMs?: number }) {
    this.steps.push({ latencyMs: 0, ...step });
  }

  async run<T>(
    task: RouterTask,
    _remote: (model: string) => Promise<T>,
    local: () => T | Promise<T>,
  ): Promise<T> {
    const decision = this.decide(task);
    const t0 = Date.now();
    const value = await local();
    this.record({
      task,
      model: decision.model,
      provider: decision.provider,
      reason: decision.reason,
      latencyMs: Date.now() - t0,
      costMicroUsd: 0,
    });
    return value;
  }

  summary() {
    return {
      steps: this.steps,
      totalCostMicroUsd: 0,
      degraded: false,
      requested: this.requested,
      unavailable: null,
    };
  }
}

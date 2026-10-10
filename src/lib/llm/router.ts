import type { ModelRouteStep } from "@/lib/types";

/**
 * ---------------------------------------------------------------------------
 * MODEL ROUTING (§4, step 4)
 * ---------------------------------------------------------------------------
 * | task                     | primary model     | fallback (cost/latency)   |
 * |--------------------------|-------------------|---------------------------|
 * | query_parsing            | gpt-4o-mini       | local-classifier-v1       |
 * | layout_composition       | gpt-4o            | gpt-4o-mini               |
 * | copywriting              | claude-3-5-sonnet | gpt-4o-mini               |
 * | brand_alignment          | gemini-1.5-pro    | local-brand-solver-v1     |
 *
 * Routing degrades to deterministic local engines when a provider key is
 * missing, or when the cost/latency budget for the request is exceeded.
 * This keeps generation success-rate > 98% and cost per generation bounded.
 */

export type RouterTask = "query_parsing" | "layout_composition" | "copywriting" | "brand_alignment";

/** User-facing model choice. "auto" lets the router pick per task (§4). */
export type ModelPreference = "auto" | "gemini" | "gpt" | "claude" | "fast";

export const MODEL_CHOICES: { id: ModelPreference; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Best model per task" },
  { id: "gemini", label: "Gemini 1.5 Pro", hint: "Multimodal & brand alignment" },
  { id: "gpt", label: "GPT-4o", hint: "Layout & code generation" },
  { id: "claude", label: "Claude 3.5 Sonnet", hint: "Copywriting & tone" },
  { id: "fast", label: "Fast & cheap", hint: "Lowest latency / cost" },
];

const PREF_PROVIDER: Record<Exclude<ModelPreference, "auto">, { envKey: string; models: Record<string, string> }> = {
  gemini: {
    envKey: "GOOGLE_API_KEY",
    models: { layout_composition: "gemini-1.5-pro", copywriting: "gemini-1.5-pro", brand_alignment: "gemini-1.5-pro", query_parsing: "gemini-1.5-flash" },
  },
  gpt: {
    envKey: "OPENAI_API_KEY",
    models: { layout_composition: "gpt-4o", copywriting: "gpt-4o", brand_alignment: "gpt-4o", query_parsing: "gpt-4o-mini" },
  },
  claude: {
    envKey: "ANTHROPIC_API_KEY",
    models: { layout_composition: "claude-3-5-sonnet", copywriting: "claude-3-5-sonnet", brand_alignment: "claude-3-5-sonnet", query_parsing: "claude-3-5-haiku" },
  },
  fast: {
    envKey: "OPENAI_API_KEY",
    models: { layout_composition: "gpt-4o-mini", copywriting: "gpt-4o-mini", brand_alignment: "gpt-4o-mini", query_parsing: "gpt-4o-mini" },
  },
};

interface TaskPolicy {
  primary: { model: string; provider: string; envKey: string; costMicroUsd: number };
  local: { model: string; provider: string };
}

const POLICY: Record<RouterTask, TaskPolicy> = {
  query_parsing: {
    primary: { model: "gpt-4o-mini", provider: "openai", envKey: "OPENAI_API_KEY", costMicroUsd: 1800 },
    local: { model: "local-classifier-v1", provider: "local" },
  },
  layout_composition: {
    primary: { model: "gpt-4o", provider: "openai", envKey: "OPENAI_API_KEY", costMicroUsd: 120000 },
    local: { model: "local-composer-v1", provider: "local" },
  },
  copywriting: {
    primary: {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      envKey: "ANTHROPIC_API_KEY",
      costMicroUsd: 90000,
    },
    local: { model: "local-copywriter-v1", provider: "local" },
  },
  brand_alignment: {
    primary: { model: "gemini-1.5-pro", provider: "google", envKey: "GOOGLE_API_KEY", costMicroUsd: 40000 },
    local: { model: "local-brand-solver-v1", provider: "local" },
  },
};

/** Hard budget: target cost per generation < $0.40 = 400_000 micro-USD. */
export const COST_BUDGET_MICRO_USD = 400_000;
export const LATENCY_BUDGET_MS = 8_000;

export class ModelRouter {
  private steps: ModelRouteStep[] = [];
  private spent = 0;
  private startedAt = Date.now();
  degraded = false;
  requested: ModelPreference = "auto";
  unavailable: string | null = null;

  constructor(preference: ModelPreference = "auto") {
    this.requested = preference;
  }

  decide(task: RouterTask): { model: string; provider: string; remote: boolean; reason: string } {
    const policy = POLICY[task];
    const budgetLeft = COST_BUDGET_MICRO_USD - this.spent;
    const elapsed = Date.now() - this.startedAt;

    const getEnv = (key: string) => (key === "GOOGLE_API_KEY" ? process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY : process.env[key]);

    // Honour an explicit user choice when its provider key is configured.
    if (this.requested !== "auto") {
      const pref = PREF_PROVIDER[this.requested];
      if (!getEnv(pref.envKey)) {
        this.degraded = true;
        this.unavailable = `${pref.models[task]} (no ${pref.envKey})`;
        return {
          ...policy.local,
          remote: false,
          reason: `requested ${pref.models[task]} but ${pref.envKey} is not configured; local engine`,
        };
      }
      if (pref.models[task] && budgetLeft > 0 && elapsed < LATENCY_BUDGET_MS) {
        return {
          model: pref.models[task],
          provider: pref.envKey === "GOOGLE_API_KEY" ? "google" : pref.envKey === "ANTHROPIC_API_KEY" ? "anthropic" : "openai",
          remote: true,
          reason: `user-selected ${this.requested}`,
        };
      }
    }

    const hasKey = Boolean(getEnv(policy.primary.envKey));
    if (!hasKey) {
      this.degraded = true;
      return { ...policy.local, remote: false, reason: `no ${policy.primary.envKey}; local engine` };
    }
    if (policy.primary.costMicroUsd > budgetLeft) {
      this.degraded = true;
      return { ...policy.local, remote: false, reason: "cost budget exceeded; routed to local engine" };
    }
    if (elapsed > LATENCY_BUDGET_MS * 0.75) {
      this.degraded = true;
      return { ...policy.local, remote: false, reason: "latency budget at risk; routed to local engine" };
    }
    return { ...policy.primary, remote: true, reason: "primary route" };
  }

  record(step: Omit<ModelRouteStep, "latencyMs"> & { latencyMs?: number }) {
    const entry: ModelRouteStep = { latencyMs: 0, ...step };
    this.spent += entry.costMicroUsd;
    this.steps.push(entry);
  }

  /** Executes a remote call with timeout + automatic local fallback. */
  async run<T>(
    task: RouterTask,
    remote: (model: string) => Promise<T>,
    local: () => T | Promise<T>,
  ): Promise<T> {
    const decision = this.decide(task);
    const t0 = Date.now();
    if (decision.remote) {
      try {
        const value = await Promise.race([
          remote(decision.model),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 9000)),
        ]);
        this.record({
          task,
          model: decision.model,
          provider: decision.provider,
          reason: decision.reason,
          latencyMs: Date.now() - t0,
          costMicroUsd: POLICY[task].primary.costMicroUsd,
        });
        return value;
      } catch (err) {
        this.degraded = true;
        const value = await local();
        this.record({
          task,
          model: POLICY[task].local.model,
          provider: "local",
          reason: `remote failed (${(err as Error).message}); local fallback`,
          latencyMs: Date.now() - t0,
          costMicroUsd: 0,
        });
        return value;
      }
    }
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
      totalCostMicroUsd: this.spent,
      degraded: this.degraded,
      requested: this.requested,
      unavailable: this.unavailable,
    };
  }
}

import type { AgentModel, ModelInput, ModelTurn } from "./agent";
import type { PreloadableModel } from "./groq-agent";

const FALLBACK_KINDS = new Set(["rate_limited", "unavailable", "timeout"]);

// Works with ProviderError (or anything with a string `kind`/`code`).
export function errorKind(e: unknown): string | undefined {
  const o = e as { kind?: unknown; code?: unknown } | null;
  const k = o?.kind ?? o?.code;
  return typeof k === "string" ? k : undefined;
}

// Uses `primary` until it fails with a provider problem, then switches to the secondary for the
// rest of the run, replaying the steps already done so the conversation continues seamlessly.
export function createFallbackAgentModel(
  primary: AgentModel,
  makeSecondary: () => PreloadableModel,
  onFallback?: (reason: string) => void,
): AgentModel {
  const history: { input: ModelInput; turn: ModelTurn }[] = [];
  let secondary: PreloadableModel | null = null;

  return {
    async step(input) {
      if (!secondary) {
        try {
          const turn = await primary.step(input);
          history.push({ input, turn });
          return turn;
        } catch (e) {
          const kind = errorKind(e);
          if (!kind || !FALLBACK_KINDS.has(kind)) throw e;
          try {
            secondary = makeSecondary();
          } catch {
            throw e; // no fallback configured (e.g. missing key): report the original problem
          }
          secondary.preload(history);
          onFallback?.(kind);
        }
      }
      const turn = await secondary.step(input);
      history.push({ input, turn });
      return turn;
    },
  };
}

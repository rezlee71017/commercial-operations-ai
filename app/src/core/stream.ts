import { runWorkflow, type Deps, type RunResult } from "./run";
import type { Product, RunEvent, Rules } from "./types";

export type StreamMessage =
  | { type: "event"; event: RunEvent }
  | { type: "result"; result: RunResult }
  | { type: "error"; error: string };

export function workflowStream(
  request: string,
  catalog: Product[],
  rules: Rules,
  deps: Omit<Deps, "onEvent">,
  owned: string[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (m: StreamMessage) => controller.enqueue(encoder.encode(JSON.stringify(m) + "\n"));
      try {
        const result = await runWorkflow(
          request,
          catalog,
          rules,
          { ...deps, onEvent: (event) => send({ type: "event", event }) },
          owned,
        );
        send({ type: "result", result });
      } catch (e) {
        send({ type: "error", error: e instanceof Error ? e.message : String(e) });
      } finally {
        controller.close();
      }
    },
  });
}

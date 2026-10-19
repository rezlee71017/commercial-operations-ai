import { runWorkflow, type Deps, type RunResult } from "./run";
import type { Product, RunEvent, Rules } from "./types";

export type StreamMessage =
  | { type: "run"; runId: string }
  | { type: "event"; event: RunEvent }
  | { type: "result"; result: RunResult }
  | { type: "error"; error: string };

// Where a run is recorded. The database implements it; tests can fake it.
export type RunSink = {
  event: (event: RunEvent) => void;
  finish: (result: RunResult) => Promise<void>;
  fail: (message: string) => Promise<void>;
};

export function workflowStream(
  request: string,
  catalog: Product[],
  rules: Rules,
  deps: Omit<Deps, "onEvent">,
  owned: string[],
  opts: { runId?: string; sink?: RunSink } = {},
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // If the browser disconnects, enqueue throws. We ignore that so the run is still recorded.
      const send = (m: StreamMessage) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(m) + "\n"));
        } catch {
          /* client went away */
        }
      };
      try {
        if (opts.runId) send({ type: "run", runId: opts.runId });
        const result = await runWorkflow(
          request,
          catalog,
          rules,
          {
            ...deps,
            onEvent: (event) => {
              opts.sink?.event(event);
              send({ type: "event", event });
            },
          },
          owned,
        );
        // Save first, then tell the browser: when it sees the result, a decision can safely follow.
        await opts.sink?.finish(result);
        send({ type: "result", result });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await opts.sink?.fail(message).catch(() => undefined);
        send({ type: "error", error: message });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
}

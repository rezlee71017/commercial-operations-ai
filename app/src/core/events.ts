import type { RunEvent } from "./types";

// A step that finished replaces its own "started" line. The list is ordered by when steps
// completed, and steps still running keep their "started" line. Used by the live screen and
// by the stored history, so both look the same.
export function collapseEvents(events: RunEvent[]): RunEvent[] {
  const out: RunEvent[] = [];
  for (const e of events) {
    if (e.status !== "started") {
      const i = out.findIndex((p) => p.step === e.step && p.status === "started");
      if (i >= 0) out.splice(i, 1);
    }
    out.push(e);
  }
  return out;
}

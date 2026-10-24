#!/usr/bin/env python3
"""Keep a history of eval runs and show how stable each scenario really is.

  python3 scripts/eval_history.py snapshot   # copy eval/last-run-live.json into eval/history/
  python3 scripts/eval_history.py report     # pass/fail/skip per scenario across all snapshots
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # app/
EVAL = ROOT.parent / "eval"                     # repo-level eval/ folder (where last-run-live.json is)
HIST = EVAL / "history"


def snapshot():
    src = EVAL / "last-run-live.json"
    data = json.loads(src.read_text())
    HIST.mkdir(parents=True, exist_ok=True)
    stamp = data.get("at", "unknown").replace(":", "-")
    dst = HIST / f"{stamp}.json"
    shutil.copy(src, dst)
    print(f"saved {dst.relative_to(EVAL.parent)}")


def outcome(item):
    if item.get("inconclusive"):
        return "skip"
    if item.get("info"):
        return "info"
    return "pass" if all(c.get("ok") for c in item.get("checks", [])) else "fail"


def report():
    files = sorted(HIST.glob("*.json"))
    if not files:
        sys.exit("no snapshots yet: run `snapshot` first")
    stats = {}
    for f in files:
        for item in json.loads(f.read_text()).get("report", []):
            s = stats.setdefault(item["id"], {"title": item["title"], "pass": 0, "fail": 0, "skip": 0, "info": 0, "ms": []})
            o = outcome(item)
            s[o] += 1
            if o in ("pass", "fail") and "ms" in item:
                s["ms"].append(item["ms"])
    print(f"{len(files)} snapshot(s)\n")
    print(f"{'#':>3}  {'pass':>4} {'fail':>4} {'skip':>4}  {'avg s':>6}  title")
    for i in sorted(stats):
        s = stats[i]
        avg = sum(s["ms"]) / len(s["ms"]) / 1000 if s["ms"] else 0
        print(f"{i:>3}  {s['pass']:>4} {s['fail']:>4} {s['skip']:>4}  {avg:>6.1f}  {s['title']}")


if __name__ == "__main__":
    {"snapshot": snapshot, "report": report}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()

# 0004: Saved runs, approval and execution

Status: accepted

## Decision
- Every workflow run and every event is saved (workflow_runs, run_events).
- The browser only sends a run id and "approve" or "reject". The proposal that was checked is read from the database.
- Approving runs in ONE transaction: lock the run, re-check the business rules against the current stock,
  remove stock (never below zero), create the order, record the approval and the audit trail. Otherwise nothing changes.
- A run can have at most one approval and one order (database constraints), so double clicks are safe.
- Tables have row level security enabled with no policies, so a hosted database's public API cannot read or write them.

## Known gaps
- No login yet. The decision endpoint must be protected before any public deployment.
- Approval of "modify", retry and cancel are not built.

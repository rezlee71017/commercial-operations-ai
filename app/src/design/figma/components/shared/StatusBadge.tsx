import type { RunStatus } from "../../types"

const labels: Record<RunStatus, string> = {
  running: "Running",
  needs_input: "Needs input",
  awaiting_approval: "Awaiting approval",
  rejected_by_policy: "Rejected by policy",
  approved: "Approved",
  executed: "Executed",
  rejected: "Rejected",
  failed: "Failed",
}

export function DemoBadge() {
  return <span className="demo-badge">Synthetic demo data</span>
}

export default function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span className={`status-badge status-${status}`}>{labels[status]}</span>
  )
}

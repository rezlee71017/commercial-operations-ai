import type { ReactNode } from "react"
import type { View } from "../../types"
import Brand from "../shared/Brand"
import Icon from "../shared/Icon"
import { DemoBadge } from "../shared/StatusBadge"

export type MerchantSection = "Overview" | "Inventory" | "Copilot" | "Approvals" | "Rules" | "Activity"

type Props = {
  section: MerchantSection
  approvalCount: number
  children: ReactNode
  onSectionChange: (section: MerchantSection) => void
  onNavigate: (view: View) => void
  onSignOut: () => void
}

const nav: {
  name: MerchantSection
  icon: "grid" | "inventory" | "spark" | "shield" | "timeline"
}[] = [
  { name: "Overview", icon: "grid" },
  { name: "Inventory", icon: "inventory" },
  { name: "Copilot", icon: "spark" },
  { name: "Approvals", icon: "shield" },
  { name: "Rules", icon: "shield" },
  { name: "Activity", icon: "timeline" },
]

export default function MerchantShell({
  section,
  approvalCount,
  children,
  onSectionChange,
  onNavigate,
  onSignOut,
}: Props) {
  return (
    <div className="merchant">
      <aside className="merchant-sidebar">
        <button className="brand-button" onClick={() => onNavigate("owner")}>
          <Brand inverse />
        </button>
        <div className="workspace-label">Commercial operations</div>
        <nav aria-label="Merchant navigation">
          {nav.map((item) => (
            <button
              key={item.name}
              className={section === item.name ? "active" : ""}
              onClick={() => onSectionChange(item.name)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.name}</span>
              {item.name === "Approvals" && approvalCount > 0 && (
                <b>{approvalCount}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => onNavigate("store")}>
            <Icon name="arrow" size={17} />
            <span>Open storefront</span>
          </button>
          <button onClick={onSignOut}>
            <Icon name="user" size={17} />
            <span>Sign out</span>
          </button>
          <div className="operator">
            <span>MC</span>
            <div>
              <strong>Maya Chen</strong>
              <small>Demo operator</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="merchant-shell">
        <header className="merchant-header">
          <div>
            <span>Workspace</span>
            <i>/</i>
            <strong>{section}</strong>
          </div>
          <DemoBadge />
        </header>
        <main className="merchant-main">{children}</main>
      </div>
    </div>
  )
}

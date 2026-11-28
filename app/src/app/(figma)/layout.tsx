import type { Metadata } from "next"
import "@/design/rezalee/rezalee.css"

export const metadata: Metadata = {
  title: "REZLEE: shopping intelligence and commercial operations",
  description: "AI-assisted product discovery, comparison, bundles and human-approved merchant operations",
  icons: { icon: "/rezalee-favicon.svg" },
}

// Separate root layout: the storefront owns its own <html> and CSS, so nothing leaks from the legacy dashboards.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

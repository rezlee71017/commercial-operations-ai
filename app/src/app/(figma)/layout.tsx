import type { Metadata } from "next"
import "@/design/figma/figma.css"

export const metadata: Metadata = {
  title: "Commercial Operations AI",
  description: "AI-assisted commerce: smart shopping, bundles and human-approved operations",
}

// Separate root layout: the Figma site owns its own <html> and CSS, so nothing leaks from the old template.
export default function FigmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

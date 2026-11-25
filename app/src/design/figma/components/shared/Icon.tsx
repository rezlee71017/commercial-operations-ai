type IconName = "aperture" | "arrow" | "bag" | "check" | "chevron" | "close" | "compare" | "grid" | "inventory" | "menu" | "minus" | "plus" | "search" | "shield" | "spark" | "timeline" | "user" | "headphones" | "monitor" | "home" | "car" | "plane" | "camera" | "chart" | "box" | "layers" | "tag" | "truck" | "dollar" | "clipboard" | "package" | "alert" | "trend" | "filter" | "edit" | "zap"

export default function Icon({
  name,
  size = 20,
}: {
  name: IconName
  size?: number
}) {
  const paths: Record<IconName, React.ReactNode> = {
    aperture: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
        <path d="m7 5 4 7-7 1m13 6-4-7 7-1M5 17l8-1-1 7m7-16-8 1 1-7" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l-1 13H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    compare: (
      <>
        <path d="M8 3v18M16 3v18M3 8h5M16 16h5" />
        <path d="m5 5-2 3 2 3m14 2 2 3-2 3" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </>
    ),
    inventory: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.4L18 9l-4.6 1.6L12 15l-1.4-4.4L6 9l4.6-1.6L12 3Z" />
        <path d="m19 16 .6 1.8 1.9.7-1.9.7L19 21l-.6-1.8-1.9-.7 1.9-.7L19 16Z" />
      </>
    ),
    timeline: (
      <>
        <path d="M6 4v16" />
        <circle cx="6" cy="7" r="2" />
        <circle cx="6" cy="16" r="2" />
        <path d="M10 7h9M10 16h9" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    headphones: <><path d="M3 13v-1a9 9 0 0 1 18 0v1"/><path d="M3 13h4v7H5a2 2 0 0 1-2-2v-5Zm18 0h-4v7h2a2 2 0 0 0 2-2v-5Z"/></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z"/></>,
    car: <><path d="m5 11 1.5-5h11L19 11l2 2v5h-2v2h-3v-2H8v2H5v-2H3v-5l2-2Z"/><path d="M6 13h12M7 16h.01M17 16h.01"/></>,
    plane: <><path d="m3 12 18-8-6 17-3-7-9-2Z"/><path d="m12 14 4-4"/></>,
    camera: <><path d="M4 7h4l2-2h4l2 2h4v12H4V7Z"/><circle cx="12" cy="13" r="4"/></>,
    chart: <><path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    tag: <><path d="M20 13 13 20 3 10V4h6l11 9Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
    truck: <><path d="M3 6h12v11H3zM15 10h4l3 3v4h-7"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    dollar: <><path d="M12 2v20m5-16H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10h8m-8 4h8m-8 4h5"/></>,
    package: <><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7m-9 4v10"/></>,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5m0 3h.01"/></>,
    trend: <><path d="m3 17 6-6 4 3 8-9"/><path d="M15 5h6v6"/></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    edit: <><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></>,
    zap: <><path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z"/></>,
  }
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

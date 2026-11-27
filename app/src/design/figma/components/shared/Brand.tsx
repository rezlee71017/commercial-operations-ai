export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
          <path d="M8 25V7h9.2c4.1 0 6.6 2.1 6.6 5.5 0 2.4-1.3 4.1-3.7 4.9L25 25h-5.4l-4.1-6.7h-2.7V25H8Z" fill="currentColor"/>
          <path d="M4.5 13.2 16.2 4l11.3 8.1" stroke="#14b8a6" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="m21.6 22.5 5.9 4" stroke="#ff765e" strokeWidth="2.7" strokeLinecap="round"/>
        </svg>
      </span>
      <span className="brand-wordmark">REZLEE</span>
    </span>
  )
}

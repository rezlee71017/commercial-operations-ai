import Icon from "./Icon"

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-mark">
        <Icon name="aperture" size={24} />
      </span>
      Aperture
    </span>
  )
}

import { formatMoney, products } from "../../data/demo"
import type { CartLine } from "../../types"
import Icon from "./Icon"

type Props = {
  lines: CartLine[]
  onClose: () => void
  onChangeQuantity: (productId: string, qty: number) => void
}

export default function CartDrawer({
  lines,
  onClose,
  onChangeQuantity,
}: Props) {
  const detailed = lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    return product ? [{ ...line, product }] : []
  })
  const total = detailed.reduce(
    (sum, line) =>
      sum + (line.unitPriceCents ?? line.product.priceCents) * line.qty,
    0,
  )
  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside
        className="cart-drawer"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Shopping cart"
      >
        <div className="drawer-title">
          <div>
            <span className="kicker">Your selection</span>
            <h2>Cart</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close cart"
          >
            <Icon name="close" />
          </button>
        </div>
        {!detailed.length ? (
          <div className="empty-panel">
            <Icon name="bag" size={30} />
            <h3>Your cart is empty</h3>
            <p>Add an in-stock product or a recommended bundle to begin.</p>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {detailed.map(({ product, qty, unitPriceCents, bundleLabel }) => (
                <article key={product.id}>
                  <div className={`product-glyph glyph-${product.category}`}>
                    <span />
                  </div>
                  <div>
                    <small>{bundleLabel ?? product.category}</small>
                    <strong>{product.name}</strong>
                    <span>
                      {formatMoney(unitPriceCents ?? product.priceCents)}
                    </span>
                    <div className="qty">
                      <button
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => onChangeQuantity(product.id, qty - 1)}
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span>{qty}</span>
                      <button
                        aria-label={`Increase ${product.name}`}
                        onClick={() => onChangeQuantity(product.id, qty + 1)}
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <button
              className="primary wide"
              onClick={() =>
                window.alert("Demo only — no checkout or payment was started.")
              }
            >
              Preview checkout <Icon name="arrow" size={17} />
            </button>
            <p className="demo-note">
              <Icon name="shield" size={14} /> Prototype only. No order or
              payment will be created.
            </p>
          </>
        )}
      </aside>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import BundleView from "./components/bundle/BundleView"
import AIChat from "./components/store/AIChat"
import CartDrawer from "./components/shared/CartDrawer"
import Brand from "./components/shared/Brand"
import Icon from "./components/shared/Icon"
import OpsWorkspace from "./components/ops/OpsWorkspace"
import OwnerWorkspace from "./components/owner/OwnerWorkspace"
import Storefront from "./components/store/Storefront"
import { defaultRules, initialRuns, orders, products } from "./data/demo"
import type { CartLine, Rules, Run, View } from "./types"

export default function App() {
  const [view, setView] = useState<View>("store")
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [runs, setRuns] = useState<Run[]>(initialRuns)
  const [rules, setRules] = useState<Rules>(defaultRules)
  const [toast, setToast] = useState("")
  const [opsStart, setOpsStart] = useState<"Copilot" | "Approvals">("Copilot")
  const [ownerStart, setOwnerStart] =
    useState<"Overview" | "Inventory" | "Rules" | "Activity">("Overview")
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0)

  const navigate = (next: View) => {
    if ((next === "ops" || next === "owner") && !signedIn) {
      setSignInOpen(true)
      return
    }
    setView(next)
  }
  const addToCart = (productId: string, qty = 1) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId)
      return existing
        ? current.map((line) =>
            line.productId === productId
              ? { ...line, qty: line.qty + qty }
              : line,
          )
        : [...current, { productId, qty }]
    })
    setToast("Added to demo cart")
  }
  const addBundle = (productIds: string[], discountPct: number) => {
    setCart((current) => {
      const withoutBundleItems = current.filter(
        (line) => !productIds.includes(line.productId),
      )
      return [
        ...withoutBundleItems,
        ...productIds.map((productId) => {
          const product = products.find((item) => item.id === productId)
          return {
            productId,
            qty: 1,
            unitPriceCents: Math.round(
              (product?.priceCents ?? 0) * (1 - discountPct / 100),
            ),
            bundleLabel: `Smart bundle · ${discountPct}% off`,
          }
        }),
      ]
    })
    setToast("Bundle added at the displayed demo price")
  }
  const changeQuantity = (productId: string, qty: number) => {
    setCart((current) =>
      qty <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId ? { ...line, qty } : line,
          ),
    )
  }
  const updateRun = (runId: string, status: Run["status"], message: string) => {
    setRuns((current) =>
      current.map((run) =>
        run.id === runId
          ? {
              ...run,
              status,
              events: [
                ...run.events,
                { step: "Human decision", status: "ok", message, at: "Now" },
              ],
            }
          : run,
      ),
    )
    setToast(message)
  }
  const submitRun = (request: string) => {
    const next: Run = {
      ...initialRuns[0],
      id: `RUN-${1050 + runs.length}`,
      request,
      status: "awaiting_approval",
      createdAt: "Now",
      events: initialRuns[0].events.map((event) => ({ ...event, at: "Now" })),
    }
    setRuns((current) => [next, ...current])
    setToast("Synthetic run created for review")
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <>
      {view === "store" && (
        <Storefront
          products={products}
          state="ready"
          cartCount={cartCount}
          signedIn={signedIn}
          onNavigate={navigate}
          onAddToCart={addToCart}
          onCompare={() => undefined}
          onOpenCart={() => setCartOpen(true)}
          onSignIn={() => setSignInOpen(true)}
        />
      )}
      {view === "ai" && (
        <AIChat
          products={products}
          cartCount={cartCount}
          onNavigate={navigate}
          onAddToCart={addToCart}
          onOpenCart={() => setCartOpen(true)}
        />
      )}
      {view === "bundle" && (
        <BundleView
          products={products}
          cartCount={cartCount}
          onNavigate={navigate}
          onAddBundle={addBundle}
          onOpenCart={() => setCartOpen(true)}
          onSubmitRequest={() =>
            setToast("Recommendation refreshed from synthetic catalog")
          }
        />
      )}
      {view === "ops" && (
        <OpsWorkspace
          products={products}
          runs={runs}
          rules={rules}
          initialSection={opsStart}
          onOpenOwner={(section) => {
            setOwnerStart(section)
            setView("owner")
          }}
          onNavigate={navigate}
          onApprove={(id, note) =>
            updateRun(id, "approved", note || "Proposal approved in prototype")
          }
          onReject={(id, note) =>
            updateRun(id, "rejected", note || "Proposal rejected in prototype")
          }
          onRetry={(id) =>
            updateRun(id, "running", "Run restarted in prototype")
          }
          onSubmitRequest={submitRun}
          onSignOut={() => {
            setSignedIn(false)
            setView("store")
          }}
        />
      )}
      {view === "owner" && (
        <OwnerWorkspace
          products={products}
          runs={runs}
          rules={rules}
          orderCount={orders.length}
          initialSection={ownerStart}
          onOpenOps={(section) => {
            setOpsStart(section)
            setView("ops")
          }}
          onNavigate={navigate}
          onSaveRules={setRules}
          onSignOut={() => {
            setSignedIn(false)
            setView("store")
          }}
        />
      )}
      {cartOpen && (
        <CartDrawer
          lines={cart}
          onClose={() => setCartOpen(false)}
          onChangeQuantity={changeQuantity}
        />
      )}
      {signInOpen && (
        <div className="modal-scrim" onMouseDown={() => setSignInOpen(false)}>
          <section
            className="sign-in-modal"
            onMouseDown={(event) => event.stopPropagation()}
            aria-labelledby="sign-in-title"
          >
            <button
              className="icon-button modal-close"
              aria-label="Close sign in"
              onClick={() => setSignInOpen(false)}
            >
              <Icon name="close" />
            </button>
            <Brand />
            <span className="kicker">Merchant workspace</span>
            <h2 id="sign-in-title">Sign in to continue</h2>
            <p>
              This is a design-prototype gate. No credentials are collected, no
              account is created, and no session is persisted.
            </p>
            <button
              className="primary wide"
              onClick={() => {
                setSignedIn(true)
                setSignInOpen(false)
                setView("owner")
                setToast("Signed in to local demo")
              }}
            >
              Continue as demo operator <Icon name="arrow" size={17} />
            </button>
            <small>
              <Icon name="shield" size={14} /> Local interface state only
            </small>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          {toast}
        </div>
      )}
    </>
  )
}

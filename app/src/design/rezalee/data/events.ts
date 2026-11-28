export type UIEvent = { type: "view_product" | "add_to_cart" | "ask" | "no_match"; productId?: string; query?: string; at: string }
const events: UIEvent[] = []
export function trackEvent(event: Omit<UIEvent,"at">) { events.push({ ...event, at: new Date().toISOString() }) }
export function getTrackedEvents() { return [...events] }

# REZalee UI update — changed files

This archive contains only files changed or added relative to the supplied `Interactive Web Prototype Design (9)(1).zip`. Copy the contents over the project root.

## Changed files

- `index.html` — set the ReZalee page title and favicon reference.
- `src/App.tsx` — load the catalog through the async data-access layer; add AI Mode entry and store theme state.
- `src/types.ts` — add explicit compatibility and future chat/API contracts (`ChatRequest`, `ChatResponse`, `Block`).
- `src/index.css` — define the ReZalee green/orange/cream design tokens and light/dark theme variables.
- `src/data/demo.ts` — expand the synthetic catalog from 20 to 100 distinct models across the existing 7 categories; include low/out-of-stock states, independent costs, specs, strengths, limitations, and explicit compatibility status maps.
- `src/data/api.ts` — async catalog access layer (`getProducts`, `getProduct`, `searchProducts`, `getInventorySummary`).
- `src/data/chatAdapter.ts` — deterministic catalog matcher with budget, brand, category/type, specification, and basic follow-up context parsing; no live LLM.
- `src/data/events.ts` — in-memory `trackEvent` log for product views, cart adds, asks, and no-match requests.
- `src/components/store/AIChat.tsx` — full-page chat experience, product cards, comparison table, clarification chips, shopping-project preview, limitation disclosure, and notification Preview control.
- `src/components/store/Storefront.tsx` — AI Mode entry point, light/dark toggle, and event tracking.
- `src/components/shared/UI.tsx` — replace the old text-only REZLEE® wordmark with the ReZalee logo asset.
- `src/components/owner/Workspace.tsx` — add catalog-computed stock-by-category and inventory-health charts, unmet-demand panel, discount what-if simulator, and visible policy checks for proposed bundles.
- `src/components/ops/RunDetail.tsx` — align legacy violet styling with the new brand palette.
- `src/components/store/ShoppingTools.tsx` — align legacy violet styling with the new brand palette.
- `public/favicon.svg` — add a compact ReZalee brand favicon.
- `public/brand/rezalee.svg` — add a scalable ReZalee wordmark asset on the deep-green brand surface.

## Important implementation notes

- The ZIP did not contain a separate approved logo image. `public/brand/rezalee.svg` is therefore a lightweight SVG brand placeholder based on the agreed palette and ReZalee lettering; replace this single asset with the final approved script-logo artwork when available. The shared `Wordmark` component already points to this path.
- All catalog products remain synthetic. No ratings or reviews were invented.
- Compatibility records default to `unknown`; only relationships already present in the original demo compatibility graph are marked `confirmed`. No unrecorded relationship is presented as confirmed.
- The AI Mode adapter is deterministic and local. The notification control, shopping project persistence, and future API connection are explicitly Preview/demo behavior.
- Existing merchant approval and execution workflow is retained; the chat does not execute merchant actions.
- No new dependencies were added. The unused `supabase/functions/server` stub was left untouched and is not wired into the app.
- A TypeScript/JSX transpile syntax pass completed without diagnostics. A full `tsc`/Vite build could not be completed in this environment because dependencies could not be installed (the install timed out); run the commands below in your project environment.

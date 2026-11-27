# REZLEE prototype redesign

## Audit and decisions
- Existing project was branded Aperture, with a customer storefront, bundle section, cart modal, merchant workspace, and proposal detail.
- Preserved typed product/run/rule contracts, cents-based money, catalog filters, comparison selection, cart stock checks, approval notes, retry, and rule confirmation.
- Replaced formula-generated repetitive products, price-only comparisons, artificial duplicate gallery views, isolated assistant modal, and unconnected execution labels.
- Retained and fixed the shared modal focus trap: state updates no longer reset focus on each keystroke.
- Inspected IntelliCart's public HTML and navigation bundle. Relevant patterns: grouped operations, actionable inventory attention, contextual AI entry, and audit/approval separation. No live sales claims or visual design copied.

## Implemented structure
- Unified REZLEE wordmark, violet identity, bright decision-oriented storefront, and related ink merchant theme.
- Discover, Explore, Product Detail, same-type Compare, inline Advisor, editable Bundle Studio, compatibility checks, product Q&A, alternatives, and cart.
- Merchant Overview, Inventory, Catalog, Opportunities, Copilot, Approvals, Insights, Rules, and Activity.
- Shared in-memory catalog, specifications, compatibility graph, proposals, pricing, rules, and published bundles.
- Twenty distinct fictional technology products across seven categories. Representative photographs are explicitly not exact SKU images. Specifications and brands are demonstration data, not manufacturer claims.
- Category-aware comparison uses specification keys from the selected product type and highlights differences. No unrelated categories can be selected together.
- Advisor uses deterministic request parsing, budget, product type, stock, and declared ANC specifications. It retains follow-up context, clarifies ambiguous requests, and provides explicit failure/retry and no-match alternatives.
- Merchant proposal edits revalidate policy. Approval publishes the proposal into the same customer bundle model; duplicate decisions are guarded. Catalog edits update both experiences.
- Sales insights derive only from the four labeled demo order records. No fabricated growth or co-purchase analysis.

## Deliberate limitations
- All state is memory-only and resets on reload. No database, real authentication, AI provider, payment, tracking, fulfillment, or external workflow is connected.
- Advisor supports a small explicit vocabulary and is not an LLM. Product Q&A searches recorded specification keys and admits unknowns.
- Two bundle templates support deterministic merchant proposals. No statistical opportunity model or real purchasing-pattern inference.
- No heavy 3D or animation dependencies. Product-card lift, focus feedback, surface depth, and reduced-motion variants only.
- Product images use external Unsplash assets; availability depends on that service. Some broad-category images are editorial illustrations, not exact product representations.
- Current catalog editing covers retail price and stock, not a full product-content CMS.
- Mobile comparison and inventory use contained horizontal table scrolling. Physical-device and assistive-technology testing remains necessary.

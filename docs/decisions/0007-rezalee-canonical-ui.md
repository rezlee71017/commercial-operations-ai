# 0007: One canonical UI, `app/src/design/rezalee`

Status: accepted (2026-11-28). Updates 0005 (the path and the source of the UI).

## Context
Three UI lines existed: the earlier Figma export (`design/figma`, branch `feat/rezlee-ui-refresh`), a lean Ink & Coral port (commit 2bc5550, tag `archive/ink-coral-ui`) and the Vite preview (`snapshot/rezalee-preview`: REZLEE brand, 100-product catalog, AI Mode, merchant workspace with approvals). The preview is the newest and the most complete line, and it is the design direction going forward.

## Decision
- `app/src/design/rezalee` is the only storefront and merchant UI, mounted by `app/src/app/(figma)`.
- The earlier UI is removed from the tree and kept as tag `archive/refresh-ui` (commit 8431899).
- The Vite preview project is retired after the port: one runtime (Next.js).
- Both UIs ran on in-memory demo data and called no backend. Connecting the real API, database and AI is done through adapters outside `design/` (see `docs/figma-integration.md`).

## Not done yet
- The AI Mode uses a deterministic matcher; `/api/assistant` returns plain text and does not yet fill the chat blocks.
- No authentication, database or payments are connected to this UI.

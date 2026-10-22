# 0005: The Figma design is the website

Status: accepted (2026-10-22). Supersedes 0002.

## Decision
The website is designed in Figma Make and exported as React code. That export
(`app/src/design/figma`) is the only UI. The shadcn dashboard template from 0002 is retired:
its pages stay under `app/src/app/(legacy)` only until a Figma screen replaces each one, then they are deleted.

## How it is integrated
- Figma Make screens use typed demo data shaped exactly like our API. They must not use Figma Make's own backend, Supabase or any network call.
- Our code connects the screens to the real API through adapters that live outside `src/design/`.
- On every re-export only `src/design/figma` is replaced; the mechanical fixes listed in `docs/figma-integration.md` are re-applied.

## Consequences
- Look and layout changes happen in Figma, not in code.
- The design must use the real domain (phones, laptops, accessories) and the real data shapes, otherwise wiring causes rework.
- Figma's formatter drops `;` in inline type literals, which Next.js rejects. Fix after each export until the export is valid TypeScript.

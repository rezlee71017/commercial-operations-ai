# 0002: UI foundation

Status: superseded by 0005 (2026-10-22). Accepted on 2026-10-17.

## Decision
Use the MIT-licensed shadcn-dashboard-landing-template (Next.js version, commit 953300f,
https://github.com/silicondeck/shadcn-dashboard-landing-template) as the UI shell.
Our code (core, data, API route, scripts) was moved into it unchanged.

## Changes made to the template
- Removed demo pages with fake data (dashboards, mail, chat, tasks, calendar, users, auth, landing, pricing, settings).
- Removed vendor links, the upgrade button and the vendor footer; the MIT license text is kept in app/LICENSE-template.md.
- New sidebar, header, footer and a Workflow page. Switched the package manager to npm.

## Why
Faster start for dashboards, tables and forms, so effort can go to the AI, data and evaluation work.

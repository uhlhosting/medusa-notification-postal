# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Postal notification provider for Medusa v2, published as `@uhlhosting/medusa-notification-postal`. This repo is part of a local multi-repo plugin workspace; when working from that workspace checkout, also see `../CLAUDE.md`.

## Read first

- `AGENTS.md` — contains **binding numbered invariants**. The Postal-critical ones: three explicit auth modes selected via `auth_type` (`smtp-api`, `smtp-ip`, `smtp`) with only that mode's credentials required; email content/metadata passed in `provider_data` (`subject`, `html`, `text`, `workflow_event`, `workflow_run_id`), not nested custom payloads; debug/test sends go through the `send-postal-email` workflow; `/admin/plugin-settings/postal` is a configuration-visibility endpoint, not delivery assurance. Update `AGENTS.md` in the same commit when a change alters architecture, auth, or route contracts.
- `SKILL.md` — routes to the shared Medusa workspace skills (`/Users/cosmic/Developer/MedusaJS/AGENTS.md` first).

## Commands (pnpm only, Node >= 20, Medusa pinned 2.17.1)

```bash
pnpm build            # medusa plugin:build → outputs to .medusa/server
pnpm dev              # medusa plugin:develop (watch mode into a consuming backend)
pnpm lint             # medusa lint
pnpm typecheck        # tsc --noEmit
pnpm test             # node:test files (src/**/*.test.ts) via tsx — NOT jest
pnpm test:unit        # jest --runInBand (src/**/__tests__/**/*.spec.ts)
pnpm test:coverage    # c8 over the node:test suite
pnpm release:check    # lint + typecheck + test + build + scripts/verify-release.mjs
```

Note this repo differs from its sibling plugins: the primary `test` script runs Node's built-in test runner over `src/**/*.test.ts` via tsx; jest is the secondary `test:unit`. Single node:test file: `pnpm tsx --test src/<path>/<name>.test.ts`. Single jest spec: `pnpm jest src/<path>/__tests__/<name>.spec.ts --runInBand`.

## Architecture

Standard Medusa v2 plugin layering — **module → workflow → route**:

- `src/providers/` — the notification provider implementation (Postal API / SMTP delivery per `auth_type`).
- `src/modules/` — module + service for persisted settings; must be registered in the consuming backend's `medusa-config.ts`.
- `src/workflows/` — mutation logic (`createWorkflow`/`createStep` with compensation), including `send-postal-email`. Routes never mutate directly. Workflow declarations are plain synchronous functions; do value transformation inside `transform()`; steps return `StepResponse(result, rollbackData)` and never log secrets/PII.
- `src/api/admin/` — HTTP routes; admin settings at `/admin/plugin-settings/postal`.
- `src/admin/` — Admin UI (React, `@medusajs/admin-sdk`, `@medusajs/ui`); use the Medusa JS SDK client, not raw `fetch`.

`pnpm build` compiles into `.medusa/server/`, and `package.json` exports point exclusively there — the plugin is unusable until built, and only `.medusa/server` is published. Releases go to GitLab (`gitlab.uhlhost.net`) as generic package assets aligned with the version tag; stay within GitLab Free-tier features.

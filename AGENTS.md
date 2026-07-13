# AGENTS.md

## Operating mode
- Act as a senior implementation partner
- Default to implementation-first execution
- Optimize for production correctness and smallest viable fix
- Avoid speculative rewrites and preserve existing architecture unless explicitly requested

## Shared Medusa Skills
- Follow `/Users/cosmic/Developer/MedusaJS/AGENTS.md` first.
- Then read this repo's root `SKILL.md`.
- Use the shared Medusa skills from the workspace policy when the task matches those surfaces.

## Repository Scope
- This repository is the standalone source for `@uhlhosting/medusa-notification-postal`
- Treat this repo as the canonical source for the postal plugin package
- Keep changes scoped to the postal plugin unless the user explicitly asks for broader repo or ecosystem work
- Do not import instructions, invariants, or paths from other Medusa repositories

## Working Rules
- Keep mutation logic in workflows, not routes
- Keep route handlers thin and typed
- Prefer `AuthenticatedMedusaRequest` for protected admin endpoints and enforce auth in `src/api/middlewares.ts`
- Keep workflow composition in `src/workflows/*.ts` and import workflows statically from routes and handlers
- Use Medusa SDK clients where applicable instead of raw `fetch`
- Preserve the compiled `.medusa/server` bundle as the package publish surface
- Do not add npm tokens, automation tokens, or `.npmrc` auth entries
- Use `glab` for GitLab CI and variable management, and `gh` for GitHub mirror checks when needed

## Postal Plugin Invariants
1. Provider auth mode is `smtp-api`
2. `provider_data` must carry email content and workflow metadata such as `subject`, `html`, `text`, `workflow_event`, and `workflow_run_id`
3. The admin settings route under `/admin/plugin-settings/postal` is a configuration visibility surface and must not expose secrets
4. Postal admin routes must require authenticated Medusa admin users through route-local middleware
5. Postal debug or test sends must use the plugin workflow path so trace metadata is preserved
6. Secrets (`POSTAL_API_KEY`, `POSTAL_WEBHOOK_TOKEN`) are sourced from provider options/environment at boot only — never persisted by the plugin and read-only in the admin UI. Non-secret settings (`from`, `base_url`, `auth_type`, `test_to`) persist in the `postal_setting` DML model via the module service; the plugin never writes to `.env` or mutates `process.env` on a request path. A boot loader reconciles the persisted row into `process.env` in memory.
7. Postal HTTP calls must fail fast with a bounded timeout, configurable via `POSTAL_REQUEST_TIMEOUT_MS` and clamped to 1–60s
8. Postal webhook callbacks must use a tokenized store route, and the exact tokenized URL should be surfaced from an admin-only view rather than the settings surface
9. Persistence goes through Medusa data primitives: the `postal_setting` and `postal_webhook_events` DML models + module service (no raw SQL, no PG-connection probing), with tables created by migrations (never on request paths)
10. The admin webhook URL endpoint should return the tokenized path plus an absolute callback URL when the request origin can be resolved
11. The provider must reject CR/LF characters in the sender address, subject, and recipients, and require an http/https `base_url`
12. The public webhook route must validate its body and enforce a bounded body-size cap
13. Admin message-inspection must delegate to the resolved provider service, not a duplicated Postal HTTP client
14. The build must emit TypeScript declarations so every `types`/`exports` target advertised in `package.json` resolves for consumers
15. Recording a Postal webhook is idempotent (a replayed message + event type must not duplicate a row) and emits a best-effort `postal.<status>` event on the event bus for subscribers
16. Sends carry an `idempotency_key` derived from the workflow run id + template + recipient when a run id is present, so workflow retries do not duplicate emails
17. Postal admin UI requests use the Medusa dashboard session through the shared JS SDK client; do not switch the plugin client to standalone JWT storage
18. Provider-backed admin routes resolve the configured `postal` provider through Medusa's Notification module provider registry, and health must report unavailable when that provider cannot be resolved

## Publish and CI Rules
1. Versioning and releases are automated with **semantic-release** on the default branch, per GitLab's documented example (`docs.gitlab.com/ci/examples/semantic-release/`). Commits MUST follow Conventional Commits (`fix:` → patch, `feat:` → minor, `feat!:`/`BREAKING CHANGE:` → major) — the commit type drives the version bump; never hand-edit `package.json` version.
2. The `release:semantic` job (stage `deploy`, default branch only) runs `pnpm exec semantic-release`, which computes the next version, publishes to the GitLab npm registry (authenticated with the ephemeral `CI_JOB_TOKEN` via a generated `.npmrc`), creates a GitLab Release with generated notes, and commits the bumped `package.json` + `v*` tag back to the default branch.
3. semantic-release requires a masked project CI/CD variable `GITLAB_TOKEN` (scopes `api` + `write_repository`) allowed to push to the protected default branch and create protected `v*` tags. The npm publish uses `CI_JOB_TOKEN`, not a static npm token. The GitLab package registry does not support provenance, so the release job sets `NPM_CONFIG_PROVENANCE=false`.
4. The semantic-release plugin chain and options live in `.releaserc.json`; keep it aligned with the plugins declared in `devDependencies`.
5. Keep release validation in the repo: `release:verify` (`pnpm release:check`) must pass before `release:semantic` runs (`needs`).
6. Onboarding/reconciliation: semantic-release derives the last release from git tags, so every published version must have a matching `v<version>` tag reachable from the default branch (e.g. the `v0.1.17` baseline tag added when adopting semantic-release).
7. GitHub npm publishing (public npmjs) uses OIDC Trusted Publishing and must verify protected refs and tag/version alignment before publishing.
8. The GitLab mirror job (`mirror:github`) mirrors to GitHub, uses a masked/protected token, and pushes tag refs specifically (`refs/tags/...`) to avoid conflicts with GitLab's background mirroring.
9. Security scanning uses the native `Jobs/SAST.gitlab-ci.yml` and `Jobs/Secret-Detection.gitlab-ci.yml` templates and runs on merge-request and default-branch pipelines (`AST_ENABLE_MR_PIPELINES: "true"`). The security findings **merge-request widget is Premium/Ultimate-only** and this instance is Community Edition (Free), so the `security:report` job surfaces findings in the job log and exposes the raw reports as a downloadable MR artifact (`artifacts:expose_as`) — tokenless and Free-tier-safe. `SECURITY_FAIL_ON_FINDINGS=true` turns it into a gate.

## Validation Checklist
1. `pnpm release:check` passes (includes admin typecheck via `typecheck:admin`)
2. `npm pack --dry-run` includes the compiled `.medusa/server` bundle and the emitted `.d.ts` type targets
3. GitHub Actions publish workflow runs without npm tokens
4. GitLab CI validates, builds, and mirrors to GitHub on the allowed pipeline sources

## Maintenance Rule
- Update this file in the same commit whenever you change plugin architecture, auth behavior, route contracts, publish behavior, or CI/CD mirror behavior

# Project security best practices

- Always run **snyk_code_scan** tool for new first party code that is generated in a Snyk-supported language.
- If any security issues are found based on newly introduced or modified code or dependencies, attempt to fix the issues using the results context from **Snyk**.
- Rescan the code after fixing the issues to ensure that the issues were fixed and that there are no newly introduced issues.
- Repeat this process until no new issues are found.

## Release assets
- Use GitLab release assets as generic packages for distributable artifacts
- Keep release assets aligned with the published package version and tag
- Prefer Free-tier-safe release automation: avoid Ultimate-only security or release features unless explicitly requested

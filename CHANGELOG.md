# Changelog

## 0.3.2 - 2026-08-09

- Keep pnpm's supply-chain verification (`minimumReleaseAge`, 24h by default since pnpm 11) enabled on the npm publish path. Registry throttling is handled by exempting only the `@medusajs/*` scope from the release-age check, so every other dependency is still quarantined before it can enter a published build.
- Ship `CHANGELOG.md` inside the published package. The `files` array overrides `.npmignore`, so releases up to and including `0.3.1` did not contain it despite the README linking to it.
- Ignore major-version bumps for the packages the Medusa admin dashboard pins and shares with this plugin at runtime (`react`, `react-dom`, `react-router-dom`, `react-i18next` and their types), and for `@types/node`, which tracks the minimum supported runtime rather than the newest release.

## 0.3.1 - 2026-08-09

> **Note for npm users.** The public npm registry was last updated at `0.1.7`. Releases `0.1.13` through `0.3.0` were published to the GitLab package registry only; this release brings npmjs back in sync. The entries below cover everything between `0.1.7` and `0.3.1`, so upgrading directly from `0.1.7` means adopting all of them at once — most notably the `0.1.18` removal of runtime `.env` writing and the `0.3.1` move to Medusa 2.18 peer dependencies.

- Require Medusa `2.18.0` peer dependencies (`@medusajs/framework`, `@medusajs/medusa`, `@medusajs/admin-sdk`, `@medusajs/js-sdk`, `@medusajs/icons`) and `@medusajs/ui` `4.2.0`. Consumers on Medusa 2.17.x should stay on `0.3.0`.
- Validate admin route query parameters through `validateAndTransformQuery` and read `req.validatedQuery`, matching the 2.18 HTTP contract; the admin webhook-events route now applies a validated, bounded `limit`.
- Replace `z.record(..., z.any())` with `z.record(..., z.unknown())` in the admin request schemas and export the schemas for reuse.
- Document the explicit `@uhlhosting/medusa-notification-postal/providers/postal` subpath in the `medusa-config.ts` example.
- Document the native admin invitation template usage.

## 0.3.0 - 2026-07-29

- Add a native admin invitation email template so Medusa's built-in admin invite flow renders through Postal.

## 0.2.3 - 2026-07-18

- Refresh compatible development tooling, including TypeScript 5.9.3 and current patch releases.
- Defer breaking upgrades to React 19, ESLint 10, TypeScript 7, React Router 7, react-i18next 17, c8 12, and Node.js 26 types.
- Treat `chore(deps)` commits as patch releases so dependency refreshes ship on their own.
- Make the commit checks run in minimal CI images.

## 0.2.2 - 2026-07-13

- Resolve the Postal provider through the notification module instead of direct container lookup, fixing provider resolution in consuming backends.

## 0.2.1 - 2026-07-13

- Restore admin authentication on the Postal admin routes and fix provider resolution for the settings and test-send surfaces.

## 0.2.0 - 2026-07-13

- Persist Postal delivery/webhook events through a `postal_webhook_events` DML model (removing raw SQL and the PG-connection probing helper). Recording is now idempotent, and each recorded event emits a best-effort `postal.<status>` event on the event bus for subscribers.
- Add a notification `idempotency_key` (workflow run id + template + recipient) so workflow retries do not send duplicate emails.
- Surface SAST and Secret Detection results on merge requests via a `security:report` job (job-log summary plus downloadable report artifacts), and fail the release job fast with a clear message when `GITLAB_TOKEN` is missing.

## 0.1.19 - 2026-07-12

- Scope npm provenance to the public npmjs publish only; the GitLab package registry publish no longer requests provenance it cannot issue.

## 0.1.18 - 2026-07-10

- Replace runtime `.env` writing with a `postal_setting` DML model persisted through the plugin module service. Non-secret settings (`from`, `base_url`, `test_to`) are stored in the database; secrets (`POSTAL_API_KEY`, `POSTAL_WEBHOOK_TOKEN`) are sourced from the environment only and are now read-only in the admin UI. A boot loader reconciles persisted settings into the process environment. **This removes the previous behavior of writing the backend `.env` file, which failed on read-only/containerized filesystems and non-monorepo layouts.**
- Fix a crash on the Postal admin settings page caused by referencing the settings query result before its declaration.
- Add `@medusajs/js-sdk` as an explicit dependency (previously imported by the admin client but undeclared).
- Typecheck the admin extension in CI and emit TypeScript declarations during the build so the advertised `types`/`exports` entry points now resolve for consumers; `verify-release` asserts the declarations ship.
- Reject CR/LF characters in the sender address, subject, and recipients, and validate the provider `base_url` protocol.
- Validate and size-cap (512 KB) the public Postal webhook payload.
- Delegate the admin message-inspection route to the notification provider instead of a duplicated Postal HTTP client.
- Report the configured `auth_type` (`smtp-api`) from the health snapshot.
- Loosen the `zod` peer dependency to `^4.4.3`, document all `POSTAL_*` environment variables, and correct the single-auth-mode guidance.

## 0.1.17 - 2026-07-09

- Revamp the Postal admin settings layout and improve its mobile UX.
- Make the GitHub mirror job manual so tags are mirrored deliberately rather than on every pipeline.

## 0.1.13 - 0.1.16 - 2026-07-02

- Publish the package to the GitLab package registry ahead of the GitHub mirror, and align the npm publish guard with the sibling plugins (tag must match the package version and be reachable from `main`).
- Verify that a mirrored release tag resolves to the commit the pipeline validated, and restrict which tags may be pushed to the GitHub mirror.
- Enforce TLS for SMTP transports and require admin authentication for the test-send route.
- Harden Postal settings and webhook persistence, resolve the Postal env path at runtime, and stop committing compiled build artifacts.
- Improve the Postal template browser and extend email configuration, customizable test payloads, and webhook event handling.
- Restore GitLab coverage badge reporting, switch coverage to c8, and broaden settings/workflow test coverage.
- Add GitHub issue/PR templates, contributing guidelines, and a code of conduct; correct the LICENSE copyright holder.
- Releases `0.1.14` through `0.1.16` were version bumps to exercise the release pipeline and contain no functional changes.

## 0.1.12 - 2026-07-02

- Remove prefilled CC, BCC, reply-to, sender, and advanced payload sample values from the Postal admin test-send UI.
- Keep admin test sends on the native `send-postal-email` workflow path with workflow trace metadata.
- Tag Postal API sends from this plugin and only record tagged `message.sent` webhook callbacks.
- Add settings-route and webhook-filter regression coverage.

## 0.1.7

- Refresh the Postal admin and settings route icons with a branded inline SVG.

## 0.1.0

- Initial public release of `@uhlhosting/medusa-notification-postal`.
- Added Postal notification provider support for the Postal API auth mode.
- Added Medusa admin settings UI for Postal configuration and delivery testing.
- Added workflow-tracked notification sends with `provider_data` trace metadata.
- Added Postal health and message inspection endpoints for runtime validation.
- Added package-local MIT licensing and repository-scoped npm naming.

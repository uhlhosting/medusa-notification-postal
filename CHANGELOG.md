# Changelog

## Unreleased

- Accept any Medusa 2.x from 2.21.0. The Medusa peers were pinned to exactly `2.21.0` (`@medusajs/ui` to `4.2.4`), so npm raised `ERESOLVE` next to Medusa 2.21.1+ or 2.22.x. They are now `^2.21.0` / `^4.2.4`.
- The `@tanstack/react-query` peer is now `~5.64.2`, the version every dashboard from 2.19 to 2.22 pins. `^5.101.2` excluded it, so npm installed a second copy next to the dashboard's and the plugin's admin hooks could not see the dashboard's `QueryClientProvider`.
- Declare the `@medusajs/dashboard` and `react` peers the admin bundle imports at runtime, and drop the unused `zod` peer (the plugin uses `@medusajs/framework/zod`).

- The admin webhook-URL view percent-encodes the token as one path segment. A token containing `/`, `?`, `#` or `%` (about half of `openssl rand -base64 32` values contain `/`) produced a callback URL that could never authenticate (`404`, `400` or `500`).
- `GET /dashboard/postal/activity`: replay-ledger entries now live for the assertion's lifetime plus 60 s instead of only its remaining validity on the consuming replica, so a replica with a lagging clock can no longer accept a replayed assertion after its key expired.
- The retention jobs log a warning (counts only) when a run stops at its per-run limit of 100,000 rows, instead of a line that reads like a complete purge while expired rows remain.

- **Changed:** workflow sends no longer copy the subject and bodies into the notification's `provider_data` and `data`. Those are stored on the notification row and returned by the admin API, and bodies can carry password-reset or invite links; the content now travels only in `content`, which reaches the provider in memory and is never stored. Anything that read `data.html`/`data.text` from stored notifications loses them for new rows; existing rows are unchanged (`notification_retention_days` can purge them). The `sendPostalEmailWorkflow` input is unchanged.
- A multi-recipient send attaches `cc`/`bcc` to the first per-recipient notification only. Every notification carried them, so each copy address received one message per `to` recipient.
- Template names are looked up as own registry keys. A custom or mixed-case name in an admin test send now borrows the matching (or the admin-test) example instead of failing, and inherited names such as `constructor` resolve to the default template instead of a `TypeError`.

- `request_timeout_ms` now bounds the whole Postal exchange. The timer was cleared as soon as the response headers arrived, so a Postal server or proxy that stalled the JSON body held a send (or an admin message lookup) open for minutes. A body-read abort now fails with `Postal API request timed out`.
- A valid `Reply-To` passed only in `provider_data.headers` (the contact-form case) is also sent as Postal's `reply_to` field. Postal sets the Reply-To field from `reply_to` after applying custom headers and deletes it when that is empty, so the header never reached the recipient.
- Caller headers can no longer smuggle `X-Postal-Sandbox*` headers through a different letter case or an underscore (`x-postal-sandbox-to`, `X-Postal_Sandbox-To`); the reserved names are dropped before the real sandbox headers are added.
- `from_name` is quoted when it contains RFC 5322 specials, so `Example Store, Inc.` no longer produces a From header that parsers read as two mailboxes.
- The `base_url` SSRF guard also refuses `localhost.` (trailing dot) and `*.localhost` names, which resolve to loopback.

- Postal webhooks are recorded once per Postal delivery instead of once per `message_id` + `event_type`. The row id is derived from the envelope `uuid`, which Postal keeps across retries, and a replay is found by re-reading that id. The previous unique index rejected every repeated open, click and delay of one message, and every cc/bcc copy (they share Postal's RFC Message-ID), with a `400`, so Postal retried and then dropped them; and its replay handling looked for pg code `23505`, which Medusa's error mapper strips, so genuine retries got a `400` too. `Migration20261107090000` drops that index — run `medusa db:migrate` after upgrading. Rows the earlier migration soft-deleted are not restored (their payloads were already redacted); the webhook retention purge now includes them.
- **Changed meaning:** a webhook row's `message_id` (in `/admin/postal/webhooks`, `/dashboard/postal/activity` and `postal.<status>` event data) is now Postal's numeric per-recipient message id — the notification's `external_id` and the id `GET /admin/postal/messages/:id` accepts — instead of the RFC Message-ID. Rows recorded before the upgrade keep the RFC value.
- `postal.<status>` is emitted through `emitEventStep` only when a row was newly inserted, so Postal's retries no longer re-fire subscribers. If the emit fails, the row is removed and the request fails, so the retry records and emits it; previously the failure was swallowed and the event was lost.

- Send-side and webhook-side now share one `POSTAL_WEBHOOK_TAG_PREFIX`. The provider declared its own copy of the literal the webhook matcher tests with `startsWith`, so a one-sided edit would have left sends working while every inbound callback was silently dropped as "not from this plugin".
- Saving settings costs one database round trip instead of four. `persistPostalSettings` read the settings, re-read the row for an existence check, wrote, then re-read to build its return value; the returned snapshot is now built from the values just written plus the environment secrets. A "save + test" admin request drops from five reads to one, since the test path reuses the workflow's returned snapshot.
- Inbound webhooks normalize their payload once instead of twice — the `sent`-and-from-this-plugin gate ran the full ~20-key normalization pass, then `recordPostalWebhookEvent` ran it again.
- The tokenized webhook route now calls `handlePostalWebhookPost`, which previously had no production caller: the route reimplemented the identical response contract, so the handler's tests covered a copy rather than the shipped endpoint.
- Template example payloads and the template option list are module-level constants instead of being rebuilt on every call, and the admin settings page memoizes its per-template lookups — that page has ~15 controlled inputs, so they were re-running on every keystroke.
- Module resolution (`try { resolve } catch { null }`) was copy-pasted at five call sites and is now `resolvePostalModule()`; `toAbsoluteOrigin` was duplicated between the admin bundle and an API route; nine route entries repeated the same `authenticate("user", [...])` argument list.
- The boot loader and the send workflow re-declared types that `modules/postal/settings.ts` and the send step already export.

## 0.3.4 - 2026-08-10

- Update the release tooling to `semantic-release` 25.0.9. Build-time only — no runtime or Medusa-facing change. (The commit subject says 25.0.8, the patch that was open at the time; 25.0.9 had landed by the time the range resolved.)

## 0.3.3 - 2026-08-09

- Accept the i18next version Medusa actually ships. The admin extension calls `addResourceBundle` on i18next's default singleton — the instance `@medusajs/dashboard` creates, currently i18next `23.7.11` — but the peer range demanded `^26.3.6`, which excludes it, so installing this plugin with npm raised an `ERESOLVE` conflict against the host project's own Medusa install. The peer is now `>=23.2.3`, the same constraint `react-i18next@13.5.0` declares.
- Replace the real mailboxes used in two README send examples with `example.com` placeholders.
- Stop tracking the compiled `.medusa` bundle in git; it is rebuilt by CI before packing and still ships in the published package.

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

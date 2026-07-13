# Changelog

## 0.2.0 - 2026-07-13

- Persist Postal delivery/webhook events through a `postal_webhook_events` DML model (removing raw SQL and the PG-connection probing helper). Recording is now idempotent, and each recorded event emits a best-effort `postal.<status>` event on the event bus for subscribers.
- Add a notification `idempotency_key` (workflow run id + template + recipient) so workflow retries do not send duplicate emails.
- Surface SAST and Secret Detection results on merge requests via a `security:report` job (job-log summary plus downloadable report artifacts), and fail the release job fast with a clear message when `GITLAB_TOKEN` is missing.

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

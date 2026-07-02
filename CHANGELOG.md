# Changelog

## 0.1.10 - 2026-07-02

- Remove prefilled CC, BCC, reply-to, sender, and advanced payload sample values from the Postal admin test-send UI.
- Keep admin test sends on the native `send-postal-email` workflow path with workflow trace metadata.
- Tag Postal API sends from this plugin and only record tagged `message.sent` webhook callbacks.
- Add settings-route and webhook-filter regression coverage.

## 0.2.1 - 2026-06-29

- Restored the Postal admin test payload helper so the admin route typechecks and the GitLab validate job can complete.
- Kept the Postal admin settings UI aligned with the current template reference workflow.

## 0.2.0 - 2026-06-29

- Update `nodemailer` to `^9.0.1` and `@types/nodemailer` to `^8.0.1`, while keeping the existing attachment-only delivery path that does not rely on v9's remote-content or raw-message behavior changes.
- Normalize repository metadata to a browser-safe GitLab web URL for npm and package-manager link resolution.
- Expanded the postal template registry and admin client handling for the current plugin runtime.
- Reworked the postal settings and provider surfaces to keep callback and template behavior aligned with the standalone plugin package.
- Kept the GitLab mirror flow unchanged while aligning release metadata with the package registry publishing model.

## 0.1.7

- Refresh the Postal admin and settings route icons with a branded inline SVG.

## 0.1.0

- Initial public release of `@uhlhosting/medusa-notification-postal`.
- Added Postal notification provider support for the Postal API auth mode.
- Added Medusa admin settings UI for Postal configuration and delivery testing.
- Added workflow-tracked notification sends with `provider_data` trace metadata.
- Added Postal health and message inspection endpoints for runtime validation.
- Added package-local MIT licensing and repository-scoped npm naming.

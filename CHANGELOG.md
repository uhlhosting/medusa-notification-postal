# Changelog

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
- Added Postal notification provider support for `smtp-api`, `smtp-ip`, and `smtp` auth modes.
- Added Medusa admin settings UI for Postal configuration and delivery testing.
- Added workflow-tracked notification sends with `provider_data` trace metadata.
- Added Postal health and message inspection endpoints for runtime validation.
- Added package-local MIT licensing and repository-scoped npm naming.

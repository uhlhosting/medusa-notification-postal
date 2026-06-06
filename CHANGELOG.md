# Changelog

## Unreleased
- Normalize admin i18n resources to `en` and `de`
- Keep the Postal settings surface under the plugin-owned admin route set
- Harden Postal provider runtime resolution for plugin builds and runtime packaging
- Colocate shared Admin UI layout components locally under `src/admin/components/admin-ui`, prune unused ones, and remove `@uhlhosting/plugin-admin-ui` workspace dependency
- Simplify the configuration checklist layout by utilizing the native `StatusBadge` component

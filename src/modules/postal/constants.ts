// Module registration name used to resolve the Postal plugin module service.
export const POSTAL_PLUGIN_MODULE = "postalPlugin"

// Stable primary key for the single Postal settings row.
export const POSTAL_SETTINGS_ID = "postal"

// Resolving the module can throw when the plugin module is not registered in
// the consuming backend. Every caller wants the same fallback — a null service,
// which the settings/webhook helpers already handle by degrading to
// environment-only configuration.
export const resolvePostalModule = <T>(container: {
  resolve: (key: string) => unknown
}): T | null => {
  try {
    return container.resolve(POSTAL_PLUGIN_MODULE) as T
  } catch {
    return null
  }
}

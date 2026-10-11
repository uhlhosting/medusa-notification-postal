import { asValue } from "@medusajs/framework/awilix"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { LoaderOptions } from "@medusajs/framework/types"
import { POSTAL_SETTINGS_ID } from "../constants"
import type { PostalSettingService as SettingsService } from "../settings"
import PostalPluginModuleService from "../service"

// Capture non-secret settings once per boot in the module-local container.
// Provider options remain the immutable operator-approved transport destination.
// No global environment mutation or premature restart acknowledgment occurs.
// A module loader is handed the module's LOCAL container, not the application
// one, and the module service is registered in the outer container only AFTER
// every loader has run (see @medusajs/modules-sdk load-internal: runLoaders is
// called before `container.register({ [keyName]: asValue(moduleService) })`).
// So `container.resolve(POSTAL_PLUGIN_MODULE)` inside a loader can never
// succeed — it threw on every boot, and because the whole body is wrapped in a
// try/catch the failure surfaced only as a warning with no cause attached.
//
// The service is therefore constructed the same way Medusa constructs it, from
// the local cradle. This is the documented shape: `new moduleService(
// localContainer.cradle, resolution.options, resolution.moduleDeclaration)`.
export type SettingsServiceFactory = (
  cradle: Record<string, unknown>,
  options: unknown,
  moduleDeclaration: unknown
) => SettingsService

const defaultServiceFactory: SettingsServiceFactory = (
  cradle,
  options,
  moduleDeclaration
) =>
  new PostalPluginModuleService(
    cradle as never,
    options as never,
    moduleDeclaration as never
  ) as unknown as SettingsService

// The factory is a parameter with a default so the boot behaviour is testable
// without a module mocker — Medusa calls this with two arguments and gets the
// real service.
const syncPostalSettingsLoader = async (
  { container, options }: LoaderOptions,
  moduleDeclaration?: unknown,
  createService: SettingsServiceFactory = defaultServiceFactory
) => {
  const logger = (() => {
    try {
      return container.resolve(ContainerRegistrationKeys.LOGGER) as {
        warn: (...args: unknown[]) => void
      }
    } catch {
      return { warn: console.warn.bind(console) }
    }
  })()

  try {
    const service = createService(
      (container as unknown as { cradle: Record<string, unknown> }).cradle,
      options,
      moduleDeclaration
    )

    const records = await service.listPostalSettings(
      { id: POSTAL_SETTINGS_ID },
      { take: 1 }
    )
    const record = service.readBootSettings ? await service.readBootSettings() : records?.[0]

    if (record) {
      container.register({ postalBootSettings: asValue(Object.freeze({ ...record })) })
      return
    }
    container.register({ postalBootSettings: asValue(null) })

    // No persisted row yet — seed one from any env-provided non-secret values so
    // the admin surface shows the effective configuration.
    const seed = {
      auth_type: process.env.POSTAL_AUTH_TYPE || "smtp-api",
      from_address: process.env.POSTAL_FROM || "",
      base_url: process.env.POSTAL_BASE_URL || "",
      test_to: process.env.POSTAL_TEST_TO || "",
    }

    if (seed.from_address || seed.base_url || seed.test_to) {
      await service.createPostalSettings({
        id: POSTAL_SETTINGS_ID,
        ...seed,
        pending_restart: false,
      })
    }
  } catch {
    container.register({ postalBootSettings: asValue({ unavailable: true }) })
    logger.warn("[postal] Settings unavailable during boot; persisted provider configuration is blocked.")
  }
}

export default syncPostalSettingsLoader

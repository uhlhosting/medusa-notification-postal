import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { LoaderOptions } from "@medusajs/framework/types"
import { POSTAL_SETTINGS_ID } from "../constants"
import PostalPluginModuleService from "../service"

type PostalSettingRecord = {
  id: string
  auth_type: string
  from_address: string
  base_url: string
  test_to: string
  pending_restart: boolean
}

// Reconciles persisted (non-secret) Postal settings with the process
// environment at boot, so the provider — constructed from env/options — reflects
// admin-saved values after a restart. Only in-memory `process.env` is touched;
// nothing is written to disk. Secrets are never persisted, so they are never
// synced here.
type SettingsService = {
  listPostalSettings: (
    filter: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<PostalSettingRecord[]>
  createPostalSettings: (data: Record<string, unknown>) => Promise<unknown>
  updatePostalSettings: (data: Record<string, unknown>) => Promise<unknown>
}

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
    const record = records?.[0]

    if (record) {
      if (record.auth_type) process.env.POSTAL_AUTH_TYPE = record.auth_type
      if (record.from_address) process.env.POSTAL_FROM = record.from_address
      if (record.base_url) process.env.POSTAL_BASE_URL = record.base_url
      if (record.test_to) process.env.POSTAL_TEST_TO = record.test_to

      if (record.pending_restart) {
        await service.updatePostalSettings({
          id: POSTAL_SETTINGS_ID,
          pending_restart: false,
        })
      }

      return
    }

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
  } catch (err) {
    // The cause is interpolated rather than passed as a second argument:
    // Medusa's winston logger drops extra arguments, which is how the previous
    // failure stayed a mystery through every boot.
    const cause = err instanceof Error ? err.message : String(err)
    logger.warn(
      `[postal] Failed to sync settings from DB during boot — continuing with env-only config. Cause: ${cause}`
    )
  }
}

export default syncPostalSettingsLoader

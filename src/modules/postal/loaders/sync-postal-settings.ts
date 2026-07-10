import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { LoaderOptions } from "@medusajs/framework/types"
import { POSTAL_PLUGIN_MODULE, POSTAL_SETTINGS_ID } from "../constants"

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
const syncPostalSettingsLoader = async ({ container }: LoaderOptions) => {
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
    const service = container.resolve(POSTAL_PLUGIN_MODULE) as {
      listPostalSettings: (
        filter: Record<string, unknown>,
        config?: Record<string, unknown>
      ) => Promise<PostalSettingRecord[]>
      createPostalSettings: (data: Record<string, unknown>) => Promise<unknown>
      updatePostalSettings: (data: Record<string, unknown>) => Promise<unknown>
    }

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
    logger.warn(
      "[postal] Failed to sync settings from DB during boot — continuing with env-only config.",
      err instanceof Error ? err.message : String(err)
    )
  }
}

export default syncPostalSettingsLoader

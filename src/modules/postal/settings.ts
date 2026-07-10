import { POSTAL_SETTINGS_ID } from "./constants"

export { POSTAL_PLUGIN_MODULE, POSTAL_SETTINGS_ID } from "./constants"

export type PostalAuthType = "smtp-api"

export type PostalSettingsInput = {
  auth_type?: PostalAuthType
  from?: string
  from_name?: string
  reply_to?: string
  base_url?: string
  api_key?: string
  test_to?: string
  webhook_token?: string
}

// The persisted (non-secret) settings row. Secrets (POSTAL_API_KEY,
// POSTAL_WEBHOOK_TOKEN) are never stored here — they come from the environment.
export type PostalSettingRecord = {
  id: string
  auth_type: string
  from_address: string
  base_url: string
  test_to: string
  pending_restart: boolean
}

// Minimal shape of the generated module service methods this file relies on.
export type PostalSettingService = {
  listPostalSettings: (
    filter: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<PostalSettingRecord[]>
  createPostalSettings: (data: Record<string, unknown>) => Promise<unknown>
  updatePostalSettings: (data: Record<string, unknown>) => Promise<unknown>
}

export type PostalSettings = PostalSettingsSnapshot

export type PostalSettingsSnapshot = {
  provider_id: "postal"
  auth_type: PostalAuthType
  from: string | null
  base_url: string | null
  api_key: string
  test_to: string | null
  webhook_token: string
  configured: {
    from: boolean
    api_key: boolean
    base_url: boolean
    webhook_token: boolean
  }
  secret_hints: {
    api_key_masked: string | null
    webhook_token_masked: string | null
  }
}

const sanitizeValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const maskSecret = (value?: string | null) => {
  const secret = sanitizeValue(value)
  if (!secret) {
    return null
  }

  const visibleTail = secret.slice(-4)
  return `${"*".repeat(Math.max(8, secret.length - 4))}${visibleTail}`
}

type EffectivePostalValues = {
  auth_type: PostalAuthType
  from: string
  base_url: string
  test_to: string
  api_key: string
  webhook_token: string
}

const buildSnapshot = (
  values: EffectivePostalValues
): PostalSettingsSnapshot => ({
  provider_id: "postal",
  auth_type: values.auth_type,
  from: values.from || null,
  base_url: values.base_url || null,
  api_key: values.api_key || "",
  test_to: values.test_to || null,
  webhook_token: values.webhook_token || "",
  configured: {
    from: Boolean(values.from),
    api_key: Boolean(values.api_key),
    base_url: Boolean(values.base_url),
    webhook_token: Boolean(values.webhook_token),
  },
  secret_hints: {
    api_key_masked: maskSecret(values.api_key),
    webhook_token_masked: maskSecret(values.webhook_token),
  },
})

export const toPublicPostalSettings = (settings: PostalSettingsSnapshot) => ({
  ...settings,
  api_key: "",
  webhook_token: "",
})

const readSettingRecord = async (
  service: PostalSettingService | null | undefined
): Promise<PostalSettingRecord | undefined> => {
  if (!service?.listPostalSettings) {
    return undefined
  }

  try {
    const rows = await service.listPostalSettings(
      { id: POSTAL_SETTINGS_ID },
      { take: 1 }
    )
    return rows?.[0]
  } catch {
    // Fall back to environment-only configuration.
    return undefined
  }
}

// Secrets come from the environment only; non-secret values come from the
// persisted row when present, otherwise from the environment.
export const getPostalSettings = async (
  service: PostalSettingService | null | undefined
): Promise<PostalSettingsSnapshot> => {
  const record = await readSettingRecord(service)

  return buildSnapshot({
    auth_type: "smtp-api",
    from: record?.from_address || process.env.POSTAL_FROM || "",
    base_url: record?.base_url || process.env.POSTAL_BASE_URL || "",
    test_to: record?.test_to || process.env.POSTAL_TEST_TO || "",
    api_key: process.env.POSTAL_API_KEY || "",
    webhook_token: process.env.POSTAL_WEBHOOK_TOKEN || "",
  })
}

// Persists non-secret settings via the module service. Secret fields in the
// payload are ignored — secrets are managed through the environment only.
export const persistPostalSettings = async (
  service: PostalSettingService | null | undefined,
  payload: PostalSettingsInput
): Promise<PostalSettingsSnapshot> => {
  const current = await getPostalSettings(service)

  const next = {
    auth_type: "smtp-api" as const,
    from_address: sanitizeValue(payload.from) || current.from || "",
    base_url: sanitizeValue(payload.base_url) || current.base_url || "",
    test_to: sanitizeValue(payload.test_to) || current.test_to || "",
    pending_restart: true,
  }

  if (service?.listPostalSettings) {
    const existing = await readSettingRecord(service)
    if (existing) {
      await service.updatePostalSettings({ id: POSTAL_SETTINGS_ID, ...next })
    } else {
      await service.createPostalSettings({ id: POSTAL_SETTINGS_ID, ...next })
    }
  }

  return getPostalSettings(service)
}

export const validateModeRequirements = (settings: PostalSettingsSnapshot) => {
  if (!settings.from) {
    return "POSTAL_FROM is required"
  }

  switch (settings.auth_type) {
    case "smtp-api":
      if (!settings.base_url) return "POSTAL_BASE_URL is required for API mode"
      if (!settings.configured.api_key)
        return "POSTAL_API_KEY is required for API mode"
      break
  }

  return null
}

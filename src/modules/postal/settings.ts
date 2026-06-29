import fs from "node:fs"
import { randomBytes } from "node:crypto"
import { rename, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

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

export type PostalSettingsRecord = {
  POSTAL_AUTH_TYPE?: string
  POSTAL_FROM?: string
  POSTAL_BASE_URL?: string
  POSTAL_API_KEY?: string
  POSTAL_TEST_TO?: string
  POSTAL_WEBHOOK_TOKEN?: string
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

const createWebhookToken = () => randomBytes(32).toString("hex")

const maskSecret = (value?: string | null) => {
  const secret = sanitizeValue(value)
  if (!secret) {
    return null
  }

  const visibleTail = secret.slice(-4)
  return `${"*".repeat(Math.max(8, secret.length - 4))}${visibleTail}`
}

const toEnvValue = (value: string) =>
  /[\s#"'`]/.test(value) ? JSON.stringify(value) : value

const resolveBackendRoot = () => {
  const cwd = process.cwd()
  return cwd.endsWith(path.join("apps", "backend"))
    ? cwd
    : path.join(cwd, "apps", "backend")
}

const ENV_FILE_PATH = path.join(resolveBackendRoot(), ".env")

const ENV_KEYS = [
  "POSTAL_AUTH_TYPE",
  "POSTAL_FROM",
  "POSTAL_BASE_URL",
  "POSTAL_API_KEY",
  "POSTAL_TEST_TO",
  "POSTAL_WEBHOOK_TOKEN",
] as const

const DB_SETTINGS_KEY = "postal"
const SETTINGS_TABLE = "admin_plugin_settings"

const readEnvMap = () => {
  const envMap = new Map<string, string>()

  if (!fs.existsSync(ENV_FILE_PATH)) {
    return envMap
  }

  const content = fs.readFileSync(ENV_FILE_PATH, "utf8")
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue
    }

    const idx = line.indexOf("=")
    if (idx < 1) {
      continue
    }

    const key = line.slice(0, idx).trim()
    const rawValue = line.slice(idx + 1).trim()
    if (!key) {
      continue
    }

    if (rawValue.startsWith("\"") && rawValue.endsWith("\"")) {
      try {
        envMap.set(key, JSON.parse(rawValue))
        continue
      } catch {
        // Fall back to the raw env value when a quoted value is not JSON-escaped.
      }
    }

    envMap.set(key, rawValue)
  }

  return envMap
}

const writeEnvValues = async (
  updates: Partial<Record<(typeof ENV_KEYS)[number], string>>
) => {
  const existing = fs.existsSync(ENV_FILE_PATH)
    ? fs.readFileSync(ENV_FILE_PATH, "utf8")
    : ""
  const lines = existing ? existing.split(/\r?\n/) : []
  const seen = new Set<string>()

  const nextLines = lines.map((line) => {
    const idx = line.indexOf("=")
    if (idx < 1 || line.trim().startsWith("#")) {
      return line
    }

    const key = line.slice(0, idx).trim()
    if (!(key in updates)) {
      return line
    }

    seen.add(key)
    const nextValue = updates[key as keyof typeof updates] ?? ""
    return `${key}=${toEnvValue(nextValue)}`
  })

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${toEnvValue(value ?? "")}`)
    }
  }

  const normalized = nextLines.filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
  const content = `${normalized.join("\n")}\n`
  const tmpPath = `${ENV_FILE_PATH}.tmp`

  try {
    await writeFile(tmpPath, content, "utf8")
    await rename(tmpPath, ENV_FILE_PATH)
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      await unlink(tmpPath).catch(() => {})
    }
    throw error
  }
}

export const normalizeSettings = (
  source?: Partial<Record<string, string>>
): PostalSettingsSnapshot => ({
  provider_id: "postal",
  auth_type: (source?.POSTAL_AUTH_TYPE || "smtp-api") as PostalAuthType,
  from: source?.POSTAL_FROM || null,
  base_url: source?.POSTAL_BASE_URL || null,
  api_key: source?.POSTAL_API_KEY || "",
  test_to: source?.POSTAL_TEST_TO || null,
  webhook_token: source?.POSTAL_WEBHOOK_TOKEN || "",
  configured: {
    from: Boolean(source?.POSTAL_FROM),
    api_key: Boolean(source?.POSTAL_API_KEY),
    base_url: Boolean(source?.POSTAL_BASE_URL),
    webhook_token: Boolean(source?.POSTAL_WEBHOOK_TOKEN),
  },
  secret_hints: {
    api_key_masked: maskSecret(source?.POSTAL_API_KEY),
    webhook_token_masked: maskSecret(source?.POSTAL_WEBHOOK_TOKEN),
  },
})

export const toPublicPostalSettings = (settings: PostalSettingsSnapshot) => ({
  ...settings,
  api_key: "",
  webhook_token: "",
})

const readPostalSettingsFromDb = async (
  pgConnection: any
): Promise<PostalSettingsRecord> => {
  if (!pgConnection) {
    return {}
  }

  try {
    const result = await pgConnection.raw(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = ? LIMIT 1`,
      [DB_SETTINGS_KEY]
    )

    const value = result.rows[0]?.value
    if (!value || typeof value !== "object") {
      return {}
    }

    return value as PostalSettingsRecord
  } catch {
    return {}
  }
}

const writePostalSettingsToDb = async (
  pgConnection: any,
  values: PostalSettingsRecord
) => {
  if (!pgConnection) {
    return
  }

  await pgConnection.raw(
    `INSERT INTO ${SETTINGS_TABLE} (key, value, updated_at)
     VALUES (?, ?::jsonb, now())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [DB_SETTINGS_KEY, JSON.stringify(values)]
  )
}

export const getPostalSettings = async (pgConnection: any) => {
  const envFileValues = readEnvMap()
  const dbValues = await readPostalSettingsFromDb(pgConnection)
  const merged: Record<string, string> = {}

  for (const key of ENV_KEYS) {
    const value =
      dbValues[key as keyof PostalSettingsRecord] ||
      envFileValues.get(key) ||
      process.env[key] ||
      ""
    if (value) {
      merged[key] = value
    }
  }

  return normalizeSettings(merged)
}

export const persistPostalSettings = async (
  pgConnection: any,
  payload: PostalSettingsInput
) => {
  const current = await getPostalSettings(pgConnection)

  const nextApiKey = sanitizeValue(payload.api_key) || (current.api_key || "")
  const nextWebhookToken =
    sanitizeValue(payload.webhook_token) ||
    current.webhook_token ||
    createWebhookToken()

  const updates: Partial<Record<(typeof ENV_KEYS)[number], string>> = {
    POSTAL_AUTH_TYPE: "smtp-api",
    POSTAL_FROM: sanitizeValue(payload.from) || (current.from || ""),
    POSTAL_BASE_URL: sanitizeValue(payload.base_url) || (current.base_url || ""),
    POSTAL_API_KEY: nextApiKey,
    POSTAL_TEST_TO: sanitizeValue(payload.test_to) || (current.test_to || ""),
    POSTAL_WEBHOOK_TOKEN: nextWebhookToken,
  }

  const dbValues: PostalSettingsRecord = {
    POSTAL_AUTH_TYPE: updates.POSTAL_AUTH_TYPE,
    POSTAL_FROM: updates.POSTAL_FROM,
    POSTAL_BASE_URL: updates.POSTAL_BASE_URL,
    POSTAL_API_KEY: updates.POSTAL_API_KEY,
    POSTAL_TEST_TO: updates.POSTAL_TEST_TO,
    POSTAL_WEBHOOK_TOKEN: updates.POSTAL_WEBHOOK_TOKEN,
  }

  await writePostalSettingsToDb(pgConnection, dbValues)
  await writeEnvValues(updates)

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value || ""
  }

  return getPostalSettings(pgConnection)
}

export const validateModeRequirements = (
  settings: PostalSettingsSnapshot
) => {
  if (!settings.from) {
    return "POSTAL_FROM is required"
  }

  switch (settings.auth_type) {
    case "smtp-api":
      if (!settings.base_url) return "POSTAL_BASE_URL is required for smtp-api mode"
      if (!settings.configured.api_key) return "POSTAL_API_KEY is required for smtp-api mode"
      break
  }

  return null
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import fs from "node:fs"
import { writeFile, rename, unlink } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"

type PostalAuthType = "smtp-api" | "smtp-ip" | "smtp"

type PostalSettingsInput = {
  auth_type?: PostalAuthType
  from?: string
  base_url?: string
  api_key?: string
  smtp_host?: string
  smtp_port?: string
  smtp_secure?: string
  smtp_user?: string
  smtp_pass?: string
  test_to?: string
}

type PostalPostBody = {
  action?: "save" | "test"
  to?: string
  settings?: PostalSettingsInput
}

const ENV_KEYS = [
  "POSTAL_AUTH_TYPE",
  "POSTAL_FROM",
  "POSTAL_BASE_URL",
  "POSTAL_API_KEY",
  "POSTAL_SMTP_HOST",
  "POSTAL_SMTP_PORT",
  "POSTAL_SMTP_SECURE",
  "POSTAL_SMTP_USER",
  "POSTAL_SMTP_PASS",
  "POSTAL_TEST_TO",
] as const

const DB_SETTINGS_KEY = "postal"
const SETTINGS_TABLE = "admin_plugin_settings"
const requireModule = createRequire(__filename)

const createPgClient = (connectionString: string) => {
  const pg = requireModule("pg")
  return new pg.Client({ connectionString })
}

const resolveBackendRoot = () => {
  const cwd = process.cwd()
  return cwd.endsWith(path.join("apps", "backend"))
    ? cwd
    : path.join(cwd, "apps", "backend")
}

const ENV_FILE_PATH = path.join(resolveBackendRoot(), ".env")

const sanitizeValue = (value?: string | null) => value?.trim() || ""
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

const writeEnvValues = (updates: Partial<Record<(typeof ENV_KEYS)[number], string>>) => {
  const existing = fs.existsSync(ENV_FILE_PATH) ? fs.readFileSync(ENV_FILE_PATH, "utf8") : ""
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
  const backupPath = `${ENV_FILE_PATH}.bak`

  return Promise.resolve()
    .then(async () => {
      if (existing) {
        await writeFile(backupPath, existing, "utf8")
      }
      await writeFile(tmpPath, content, "utf8")
      await rename(tmpPath, ENV_FILE_PATH)
    })
    .catch(async (error) => {
      if (fs.existsSync(tmpPath)) {
        await unlink(tmpPath).catch(() => {})
      }
      throw error
    })
}

const normalizeSettings = (source?: Partial<Record<string, string>>) => ({
  provider_id: "postal",
  auth_type: (source?.POSTAL_AUTH_TYPE || "smtp-api") as PostalAuthType,
  from: source?.POSTAL_FROM || null,
  base_url: source?.POSTAL_BASE_URL || null,
  api_key: source?.POSTAL_API_KEY || "",
  test_to: source?.POSTAL_TEST_TO || null,
  smtp_host: source?.POSTAL_SMTP_HOST || null,
  smtp_port: source?.POSTAL_SMTP_PORT || null,
  smtp_secure: source?.POSTAL_SMTP_SECURE || null,
  smtp_user: source?.POSTAL_SMTP_USER || null,
  smtp_pass: source?.POSTAL_SMTP_PASS || "",
  configured: {
    from: Boolean(source?.POSTAL_FROM),
    api_key: Boolean(source?.POSTAL_API_KEY),
    base_url: Boolean(source?.POSTAL_BASE_URL),
    smtp_host: Boolean(source?.POSTAL_SMTP_HOST),
    smtp_port: Boolean(source?.POSTAL_SMTP_PORT),
    smtp_user: Boolean(source?.POSTAL_SMTP_USER),
    smtp_pass: Boolean(source?.POSTAL_SMTP_PASS),
  },
  secret_hints: {
    api_key_masked: maskSecret(source?.POSTAL_API_KEY),
    smtp_pass_masked: maskSecret(source?.POSTAL_SMTP_PASS),
  },
})

const readPostalSettingsFromDb = async (): Promise<Partial<Record<string, string>>> => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return {}
  }

  const client = createPgClient(databaseUrl)
  try {
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const result = await client.query(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = $1 LIMIT 1`,
      [DB_SETTINGS_KEY]
    )

    const value = result.rows[0]?.value
    if (!value || typeof value !== "object") {
      return {}
    }

    return value as Partial<Record<string, string>>
  } catch {
    return {}
  } finally {
    await client.end().catch(() => {})
  }
}

const writePostalSettingsToDb = async (values: Partial<Record<string, string>>) => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return
  }

  const client = createPgClient(databaseUrl)
  try {
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    await client.query(
      `INSERT INTO ${SETTINGS_TABLE} (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [DB_SETTINGS_KEY, JSON.stringify(values)]
    )
  } finally {
    await client.end().catch(() => {})
  }
}

const getPostalSettings = async () => {
  const envFileValues = readEnvMap()
  const dbValues = await readPostalSettingsFromDb()
  const merged: Record<string, string> = {}

  for (const key of ENV_KEYS) {
    const value = dbValues[key] || envFileValues.get(key) || process.env[key] || ""
    if (value) {
      merged[key] = value
    }
  }

  return normalizeSettings(merged)
}

const persistPostalSettings = async (payload: PostalSettingsInput) => {
  const current = await getPostalSettings()
  const nextAuthType: PostalAuthType =
    payload.auth_type === "smtp" || payload.auth_type === "smtp-ip" || payload.auth_type === "smtp-api"
      ? payload.auth_type
      : "smtp-api"

  const updates: Partial<Record<(typeof ENV_KEYS)[number], string>> = {
    POSTAL_AUTH_TYPE: nextAuthType,
    POSTAL_FROM: sanitizeValue(payload.from) || (current.from || ""),
    POSTAL_BASE_URL: sanitizeValue(payload.base_url) || (current.base_url || ""),
    POSTAL_API_KEY: sanitizeValue(payload.api_key),
    POSTAL_SMTP_HOST: sanitizeValue(payload.smtp_host) || (current.smtp_host || ""),
    POSTAL_SMTP_PORT: sanitizeValue(payload.smtp_port) || (current.smtp_port || ""),
    POSTAL_SMTP_SECURE: sanitizeValue(payload.smtp_secure) || (current.smtp_secure || ""),
    POSTAL_SMTP_USER: sanitizeValue(payload.smtp_user) || (current.smtp_user || ""),
    POSTAL_SMTP_PASS: sanitizeValue(payload.smtp_pass),
    POSTAL_TEST_TO: sanitizeValue(payload.test_to) || (current.test_to || ""),
  }

  // Keep existing secrets when UI posts empty secret fields.
  if (!updates.POSTAL_API_KEY) {
    const envMap = readEnvMap()
    updates.POSTAL_API_KEY = envMap.get("POSTAL_API_KEY") || process.env.POSTAL_API_KEY || ""
  }
  if (!updates.POSTAL_SMTP_PASS) {
    const envMap = readEnvMap()
    updates.POSTAL_SMTP_PASS = envMap.get("POSTAL_SMTP_PASS") || process.env.POSTAL_SMTP_PASS || ""
  }

  await writePostalSettingsToDb(updates as Partial<Record<string, string>>)
  await writeEnvValues(updates)

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value || ""
  }

  return getPostalSettings()
}

const validateModeRequirements = (settings: ReturnType<typeof normalizeSettings>) => {
  const authType = settings.auth_type

  if (!settings.from) {
    return "POSTAL_FROM is required"
  }

  if (authType === "smtp-api") {
    if (!settings.base_url) {
      return "POSTAL_BASE_URL is required for smtp-api mode"
    }
    if (!settings.configured.api_key) {
      return "POSTAL_API_KEY is required for smtp-api mode"
    }
  }

  if (authType === "smtp-ip") {
    if (!settings.smtp_host) {
      return "POSTAL_SMTP_HOST is required for smtp-ip mode"
    }
  }

  if (authType === "smtp") {
    if (!settings.smtp_host) {
      return "POSTAL_SMTP_HOST is required for smtp mode"
    }
    if (!settings.smtp_user) {
      return "POSTAL_SMTP_USER is required for smtp mode"
    }
    if (!settings.configured.smtp_pass) {
      return "POSTAL_SMTP_PASS is required for smtp mode"
    }
  }

  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = await getPostalSettings()
  res.json({
    ...settings,
    diagnostics: {
      settings_source: "db_over_env",
    },
  })
}

export async function POST(
  req: MedusaRequest<PostalPostBody>,
  res: MedusaResponse
) {
  const body = req.validatedBody || req.body || {}
  const action = body.action

  if (action === "save") {
    const settings = await persistPostalSettings(body.settings || {})
    const validationError = validateModeRequirements(settings)

    return res.json({
      ok: true,
      action: "save",
      code: "postal_settings_saved",
      type: "postal_settings_result",
      status: 200,
      settings,
      requires_restart: true,
      ready_for_test: !validationError,
      validation_error: validationError,
    })
  }

  if (action !== "test") {
    return res.status(400).json({
      code: "postal_action_invalid",
      type: "postal_validation_error",
      status: 400,
      message: "Invalid action. Use `save` or `test`.",
    })
  }

  if (body.settings) {
    await persistPostalSettings(body.settings)
  }

  const currentSettings = await getPostalSettings()
  const validationError = validateModeRequirements(currentSettings)
  if (validationError) {
    return res.status(400).json({
      ok: false,
      action: "test",
      code: "postal_settings_invalid_for_test",
      type: "postal_validation_error",
      status: 400,
      message: validationError,
      settings: currentSettings,
      requires_restart: true,
    })
  }

  const to =
    body.to?.trim() ||
    currentSettings.test_to ||
    currentSettings.from

  if (!to) {
    return res.status(400).json({
      code: "postal_recipient_missing",
      type: "postal_validation_error",
      status: 400,
      message: "Missing recipient. Provide `to` or set POSTAL_TEST_TO/POSTAL_FROM.",
    })
  }

  const subject = "Postal test from Medusa Admin"
  const runId = `admin_${Date.now()}`
  const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION) as any

  const result = await notificationModuleService
    .createNotifications({
      to,
      channel: "email",
      from: currentSettings.from || undefined,
      template: "postal-admin-test",
      provider_id: "postal",
      provider_data: {
        subject,
        text: "Postal provider test message from Medusa Admin settings.",
        html: "<p>Postal provider test message from <strong>Medusa Admin settings</strong>.</p>",
        workflow_event: "admin.postal.test",
        workflow_run_id: runId,
      },
    })
    .catch((error: any) => {
      const message = String(error?.message || "")
      if (message.includes("Could not find a notification provider for channel: email")) {
        return Promise.reject(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Postal provider is not loaded. Save settings and restart backend."
          )
        )
      }

      return Promise.reject(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          message || "Postal test send failed"
        )
      )
    })

  return res.json({
    ok: true,
    action: "test",
    code: "postal_test_queued",
    type: "postal_test_result",
    status: 200,
    provider_id: "postal",
    to,
    workflow_run_id: runId,
    result,
    settings: currentSettings,
  })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import fs from "node:fs"
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

const ENV_FILE_PATH = path.join(process.cwd(), ".env")

const sanitizeValue = (value?: string | null) => value?.trim() || ""

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
        // Fall back to raw value when JSON parsing fails.
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

  fs.writeFileSync(ENV_FILE_PATH, `${nextLines.filter((line, i, arr) => !(i === arr.length - 1 && line === "")).join("\n")}\n`, "utf8")
}

const normalizeSettings = (source?: Partial<Record<string, string>>) => ({
  provider_id: "postal",
  auth_type: (source?.POSTAL_AUTH_TYPE || "smtp-api") as PostalAuthType,
  from: source?.POSTAL_FROM || null,
  base_url: source?.POSTAL_BASE_URL || null,
  test_to: source?.POSTAL_TEST_TO || null,
  smtp_host: source?.POSTAL_SMTP_HOST || null,
  smtp_port: source?.POSTAL_SMTP_PORT || null,
  smtp_secure: source?.POSTAL_SMTP_SECURE || null,
  smtp_user: source?.POSTAL_SMTP_USER || null,
  configured: {
    from: Boolean(source?.POSTAL_FROM),
    api_key: Boolean(source?.POSTAL_API_KEY),
    base_url: Boolean(source?.POSTAL_BASE_URL),
    smtp_host: Boolean(source?.POSTAL_SMTP_HOST),
    smtp_port: Boolean(source?.POSTAL_SMTP_PORT),
    smtp_user: Boolean(source?.POSTAL_SMTP_USER),
    smtp_pass: Boolean(source?.POSTAL_SMTP_PASS),
  },
})

const getPostalSettings = () => {
  const envFileValues = readEnvMap()
  const merged: Record<string, string> = {}

  for (const key of ENV_KEYS) {
    const value = process.env[key] || envFileValues.get(key) || ""
    if (value) {
      merged[key] = value
    }
  }

  return normalizeSettings(merged)
}

const persistPostalSettings = (payload: PostalSettingsInput) => {
  const nextAuthType: PostalAuthType =
    payload.auth_type === "smtp" || payload.auth_type === "smtp-ip" || payload.auth_type === "smtp-api"
      ? payload.auth_type
      : "smtp-api"

  const updates: Partial<Record<(typeof ENV_KEYS)[number], string>> = {
    POSTAL_AUTH_TYPE: nextAuthType,
    POSTAL_FROM: sanitizeValue(payload.from),
    POSTAL_BASE_URL: sanitizeValue(payload.base_url),
    POSTAL_API_KEY: sanitizeValue(payload.api_key),
    POSTAL_SMTP_HOST: sanitizeValue(payload.smtp_host),
    POSTAL_SMTP_PORT: sanitizeValue(payload.smtp_port),
    POSTAL_SMTP_SECURE: sanitizeValue(payload.smtp_secure),
    POSTAL_SMTP_USER: sanitizeValue(payload.smtp_user),
    POSTAL_SMTP_PASS: sanitizeValue(payload.smtp_pass),
    POSTAL_TEST_TO: sanitizeValue(payload.test_to),
  }

  writeEnvValues(updates)

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value || ""
  }

  return getPostalSettings()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json(getPostalSettings())
}

export async function POST(
  req: MedusaRequest<PostalPostBody>,
  res: MedusaResponse
) {
  const action = req.body?.action

  if (action === "save") {
    const settings = persistPostalSettings(req.body?.settings || {})

    return res.json({
      ok: true,
      action: "save",
      code: "postal_settings_saved",
      type: "postal_settings_result",
      status: 200,
      settings,
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

  if (req.body?.settings) {
    persistPostalSettings(req.body.settings)
  }

  const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION) as any
  const currentSettings = getPostalSettings()
  const to =
    req.body?.to?.trim() ||
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

  const result = await notificationModuleService.createNotifications({
    to,
    channel: "email",
    template: "postal-admin-test",
    provider_id: "postal",
    provider_data: {
      subject: "Postal test from Medusa Admin",
      text: "Postal provider test message from Medusa Admin settings.",
      html: "<p>Postal provider test message from <strong>Medusa Admin settings</strong>.</p>",
      workflow_event: "admin.postal.test",
      workflow_run_id: `admin_${Date.now()}`,
    },
  })

  return res.json({
    ok: true,
    action: "test",
    code: "postal_test_queued",
    type: "postal_test_result",
    status: 200,
    provider_id: "postal",
    to,
    result,
    settings: currentSettings,
  })
}

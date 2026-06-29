import test from "node:test"
import assert from "node:assert/strict"
import { chdir, cwd } from "node:process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import {
  normalizeSettings,
  toPublicPostalSettings,
  validateModeRequirements,
} from "./settings"

test("normalizeSettings fills configuration and masks secrets", () => {
  const settings = normalizeSettings({
    POSTAL_AUTH_TYPE: "smtp-api",
    POSTAL_FROM: "  Postal <no-reply@uhlhosting.ch>  ",
    POSTAL_BASE_URL: "https://postal.example.test",
    POSTAL_API_KEY: "  postal-api-key-test  ",
    POSTAL_TEST_TO: "ops@uhlhosting.ch",
    POSTAL_WEBHOOK_TOKEN: "postal-webhook-token-test",
  })

  assert.equal(settings.provider_id, "postal")
  assert.equal(settings.auth_type, "smtp-api")
  assert.equal(settings.from, "  Postal <no-reply@uhlhosting.ch>  ")
  assert.equal(settings.base_url, "https://postal.example.test")
  assert.equal(settings.api_key, "  postal-api-key-test  ")
  assert.equal(settings.test_to, "ops@uhlhosting.ch")
  assert.equal(settings.webhook_token, "postal-webhook-token-test")
  assert.equal(settings.configured.from, true)
  assert.equal(settings.configured.api_key, true)
  assert.equal(settings.configured.base_url, true)
  assert.equal(settings.configured.webhook_token, true)
  assert.match(settings.secret_hints.api_key_masked ?? "", /^\*+7890$/)
  assert.match(settings.secret_hints.webhook_token_masked ?? "", /^\*+oken$/)
})

test("toPublicPostalSettings strips secrets from the snapshot", () => {
  const publicSettings = toPublicPostalSettings({
    provider_id: "postal",
    auth_type: "smtp-api",
    from: "Postal <no-reply@uhlhosting.ch>",
    base_url: "https://postal.example.test",
    api_key: "postal-api-key-test",
    test_to: null,
    webhook_token: "postal-webhook-token-test",
    configured: {
      from: true,
      api_key: true,
      base_url: true,
      webhook_token: true,
    },
    secret_hints: {
      api_key_masked: "********key",
      webhook_token_masked: "********oken",
    },
  })

  assert.equal(publicSettings.api_key, "")
  assert.equal(publicSettings.webhook_token, "")
  assert.equal(publicSettings.from, "Postal <no-reply@uhlhosting.ch>")
})

test("validateModeRequirements enforces smtp-api configuration", () => {
  assert.equal(
    validateModeRequirements({
      provider_id: "postal",
      auth_type: "smtp-api",
      from: null,
      base_url: null,
      api_key: "",
      test_to: null,
      webhook_token: "",
      configured: {
        from: false,
        api_key: false,
        base_url: false,
        webhook_token: false,
      },
      secret_hints: {
        api_key_masked: null,
        webhook_token_masked: null,
      },
    }),
    "POSTAL_FROM is required"
  )

  assert.equal(
    validateModeRequirements({
      provider_id: "postal",
      auth_type: "smtp-api",
      from: "Postal <no-reply@uhlhosting.ch>",
      base_url: null,
      api_key: "",
      test_to: null,
      webhook_token: "",
      configured: {
        from: true,
        api_key: false,
        base_url: false,
        webhook_token: false,
      },
      secret_hints: {
        api_key_masked: null,
        webhook_token_masked: null,
      },
    }),
    "POSTAL_BASE_URL is required for smtp-api mode"
  )

  assert.equal(
    validateModeRequirements({
      provider_id: "postal",
      auth_type: "smtp-api",
      from: "Postal <no-reply@uhlhosting.ch>",
      base_url: "https://postal.example.test",
      api_key: "",
      test_to: null,
      webhook_token: "",
      configured: {
        from: true,
        api_key: false,
        base_url: true,
        webhook_token: false,
      },
      secret_hints: {
        api_key_masked: null,
        webhook_token_masked: null,
      },
    }),
    "POSTAL_API_KEY is required for smtp-api mode"
  )
})

test("validateModeRequirements allows complete smtp-api settings", () => {
  assert.equal(
    validateModeRequirements({
      provider_id: "postal",
      auth_type: "smtp-api",
      from: "Postal <no-reply@uhlhosting.ch>",
      base_url: "https://postal.example.test",
      api_key: "secret-key",
      test_to: null,
      webhook_token: "secret-token",
      configured: {
        from: true,
        api_key: true,
        base_url: true,
        webhook_token: true,
      },
      secret_hints: {
        api_key_masked: null,
        webhook_token_masked: null,
      },
    }),
    null
  )
})

test("normalizeSettings falls back to default auth type and nullish fields", () => {
  const settings = normalizeSettings({})

  assert.equal(settings.auth_type, "smtp-api")
  assert.equal(settings.from, null)
  assert.equal(settings.base_url, null)
  assert.equal(settings.api_key, "")
  assert.equal(settings.test_to, null)
  assert.equal(settings.webhook_token, "")
  assert.equal(settings.secret_hints.api_key_masked, null)
  assert.equal(settings.secret_hints.webhook_token_masked, null)
})

test("getPostalSettings and persistPostalSettings merge env and db state", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-merge-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })
  writeFileSync(
    path.join(backendDir, ".env"),
    [
      'POSTAL_AUTH_TYPE="smtp-api"',
      'POSTAL_FROM=Env Postal <env@uhlhosting.ch>',
      "POSTAL_BASE_URL=https://postal.env.example.test",
      "POSTAL_API_KEY=env-key",
      "POSTAL_TEST_TO=env-test@uhlhosting.ch",
      "POSTAL_WEBHOOK_TOKEN=env-token",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(
      "/Users/cosmic/Developer/MedusaJS/Plugins/medusa-notification-postal/src/modules/postal/settings.ts"
    )
    const settings = await import(`${moduleUrl.href}?merge=env`)
    const pgState: { value: Record<string, unknown> | null } = { value: null }
    const rawCalls: Array<{ sql: string; params?: unknown[] }> = []
    const pgConnection = {
      raw: async (sql: string, params?: unknown[]) => {
        rawCalls.push({ sql, params })

        if (sql.includes("SELECT value FROM admin_plugin_settings")) {
          return { rows: [{ value: pgState.value }] }
        }

        if (sql.includes("INSERT INTO admin_plugin_settings")) {
          const value = params?.[1]
          pgState.value = typeof value === "string" ? JSON.parse(value) : null
        }

        return { rows: [] }
      },
    }

    const initial = await settings.getPostalSettings(pgConnection)
    assert.equal(initial.from, "Env Postal <env@uhlhosting.ch>")
    assert.equal(initial.base_url, "https://postal.env.example.test")
    assert.equal(initial.api_key, "env-key")
    assert.equal(initial.webhook_token, "env-token")

    await settings.persistPostalSettings(pgConnection, {
      from: "Saved Postal <saved@uhlhosting.ch>",
      base_url: "https://postal.saved.example.test",
      api_key: "saved-key",
      test_to: "saved-test@uhlhosting.ch",
      webhook_token: "saved-token",
    })

    const updated = await settings.getPostalSettings(pgConnection)
    assert.equal(updated.from, "Saved Postal <saved@uhlhosting.ch>")
    assert.equal(updated.base_url, "https://postal.saved.example.test")
    assert.equal(updated.api_key, "saved-key")
    assert.equal(updated.webhook_token, "saved-token")
    assert.ok(rawCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")))
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

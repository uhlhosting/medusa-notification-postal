import test from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { chdir, cwd } from "node:process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"

test("postal settings reads and writes the backend env file", async () => {
  const apiKeyValue = randomUUID().replace(/-/g, "").slice(0, 12)
  const webhookTokenValue = randomUUID().replace(/-/g, "").slice(0, 12)
  const newApiKeyValue = randomUUID().replace(/-/g, "").slice(0, 12)
  const newWebhookTokenValue = randomUUID().replace(/-/g, "").slice(0, 12)
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  const envPath = path.join(backendDir, ".env")
  writeFileSync(
    envPath,
    [
      "# postal settings",
      'POSTAL_AUTH_TYPE="smtp-api"',
      "POSTAL_FROM=Postal <no-reply@uhlhosting.ch>",
      'POSTAL_BASE_URL="https://postal.example.test"',
      `POSTAL_API_KEY=${apiKeyValue}`,
      "POSTAL_TEST_TO=ops@uhlhosting.ch",
      `POSTAL_WEBHOOK_TOKEN=${webhookTokenValue}`,
      "INVALID_LINE",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=env`)

    const pgCalls: Array<{ sql: string; params?: unknown[] }> = []
    let storedDbValue: Record<string, unknown> | null = {
      POSTAL_FROM: "Db Postal <db@uhlhosting.ch>",
    }
    const pgConnection = {
      raw: async (sql: string, params?: unknown[]) => {
        pgCalls.push({ sql, params })
        if (sql.includes("SELECT value FROM admin_plugin_settings")) {
          return {
            rows: [
              {
                value: storedDbValue,
              },
            ],
          }
        }

        if (sql.includes("INSERT INTO admin_plugin_settings")) {
          const rawValue = params?.[1]
          storedDbValue =
            typeof rawValue === "string" ? (JSON.parse(rawValue) as Record<string, unknown>) : storedDbValue
        }

        return { rows: [] }
      },
    }

    const snapshot = await settings.getPostalSettings(pgConnection)
    assert.equal(snapshot.from, "Db Postal <db@uhlhosting.ch>")
    assert.equal(snapshot.base_url, "https://postal.example.test")
    assert.equal(snapshot.api_key, apiKeyValue)
    assert.equal(snapshot.webhook_token, webhookTokenValue)

    const persisted = await settings.persistPostalSettings(pgConnection, {
      from: "Postal <admin@uhlhosting.ch>",
      base_url: "https://postal.example.test",
      api_key: newApiKeyValue,
      test_to: "test@uhlhosting.ch",
      webhook_token: newWebhookTokenValue,
    })

    assert.equal(persisted.from, "Postal <admin@uhlhosting.ch>")
    assert.equal(persisted.api_key, newApiKeyValue)
    assert.equal(persisted.webhook_token, newWebhookTokenValue)
    assert.ok(pgCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")))

    const writtenEnv = readFileSync(envPath, "utf8")
    assert.match(writtenEnv, /POSTAL_FROM="Postal <admin@uhlhosting\.ch>"/)
    assert.match(writtenEnv, new RegExp(`POSTAL_API_KEY=${newApiKeyValue}`))
    assert.match(writtenEnv, new RegExp(`POSTAL_WEBHOOK_TOKEN=${newWebhookTokenValue}`))
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

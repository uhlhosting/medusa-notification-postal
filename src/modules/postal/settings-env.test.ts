import test from "node:test"
import assert from "node:assert/strict"
import { chdir, cwd } from "node:process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"

test("postal settings reads and writes the backend env file", async () => {
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
      "POSTAL_API_KEY=key_1234",
      "POSTAL_TEST_TO=ops@uhlhosting.ch",
      "POSTAL_WEBHOOK_TOKEN=token_1234",
      "INVALID_LINE",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(
      "/Users/cosmic/Developer/MedusaJS/Plugins/medusa-notification-postal/src/modules/postal/settings.ts"
    )
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
    assert.equal(snapshot.api_key, "key_1234")
    assert.equal(snapshot.webhook_token, "token_1234")

    const persisted = await settings.persistPostalSettings(pgConnection, {
      from: "Postal <admin@uhlhosting.ch>",
      base_url: "https://postal.example.test",
      api_key: "new-key",
      test_to: "test@uhlhosting.ch",
      webhook_token: "new-token",
    })

    assert.equal(persisted.from, "Postal <admin@uhlhosting.ch>")
    assert.equal(persisted.api_key, "new-key")
    assert.equal(persisted.webhook_token, "new-token")
    assert.ok(pgCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")))

    const writtenEnv = readFileSync(envPath, "utf8")
    assert.match(writtenEnv, /POSTAL_FROM="Postal <admin@uhlhosting\.ch>"/)
    assert.match(writtenEnv, /POSTAL_API_KEY=new-key/)
    assert.match(writtenEnv, /POSTAL_WEBHOOK_TOKEN=new-token/)
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

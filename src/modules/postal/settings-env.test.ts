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

test("postal settings preserves unrelated env entries when persisting updates", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-preserve-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  const envPath = path.join(backendDir, ".env")
  writeFileSync(
    envPath,
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.example.test",
      "POSTAL_API_KEY=existing-key",
      "POSTAL_WEBHOOK_TOKEN=existing-token",
      "OTHER_SETTING=keep-me",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=preserve-env`)

    await settings.persistPostalSettings(
      {
        raw: async (sql: string) => {
          if (sql.includes("SELECT value FROM admin_plugin_settings")) {
            return { rows: [] }
          }
          return { rows: [] }
        },
      },
      {
        from: "Postal <ops@uhlhosting.ch>",
        base_url: "https://postal.example.test",
        api_key: "updated-key",
        test_to: "test@uhlhosting.ch",
        webhook_token: "updated-token",
      }
    )

    const writtenEnv = readFileSync(envPath, "utf8")
    assert.match(writtenEnv, /OTHER_SETTING=keep-me/)
    assert.match(writtenEnv, /POSTAL_API_KEY=updated-key/)
    assert.match(writtenEnv, /POSTAL_WEBHOOK_TOKEN=updated-token/)
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings keeps malformed quoted env values as raw text", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-quoted-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  writeFileSync(
    path.join(backendDir, ".env"),
    [
      'POSTAL_AUTH_TYPE="smtp-api"',
      'POSTAL_API_KEY="bad\\q"',
      'POSTAL_WEBHOOK_TOKEN="token_quoted"',
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=quoted`)

    const snapshot = await settings.getPostalSettings(undefined)

    assert.equal(snapshot.api_key, '"bad\\q"')
    assert.equal(snapshot.webhook_token, "token_quoted")
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings ignores malformed env assignments with missing keys", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-malformed-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  writeFileSync(
    path.join(backendDir, ".env"),
    [
      " =orphaned-value",
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Malformed Postal <malformed@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.malformed.example.test",
      "POSTAL_API_KEY=malformed-key",
      "POSTAL_WEBHOOK_TOKEN=malformed-token",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=malformed-env`)

    const snapshot = await settings.getPostalSettings(undefined)

    assert.equal(snapshot.from, "Malformed Postal <malformed@uhlhosting.ch>")
    assert.equal(snapshot.api_key, "malformed-key")
    assert.equal(snapshot.webhook_token, "malformed-token")
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings resolves the env file when already inside apps/backend", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-root-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  writeFileSync(
    path.join(backendDir, ".env"),
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Backend Postal <backend@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.backend.example.test",
      "POSTAL_API_KEY=backend-key",
      "POSTAL_WEBHOOK_TOKEN=backend-token",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(backendDir)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=backend-root`)

    const snapshot = await settings.getPostalSettings(undefined)

    assert.equal(snapshot.from, "Backend Postal <backend@uhlhosting.ch>")
    assert.equal(snapshot.base_url, "https://postal.backend.example.test")
    assert.equal(snapshot.api_key, "backend-key")
    assert.equal(snapshot.webhook_token, "backend-token")
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings generates a webhook token when one is missing", async () => {
  const originalCwd = cwd()
  const previousWebhookToken = process.env.POSTAL_WEBHOOK_TOKEN
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-generate-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })
  writeFileSync(
    path.join(backendDir, ".env"),
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.example.test",
      "POSTAL_API_KEY=existing-key",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)
  delete process.env.POSTAL_WEBHOOK_TOKEN

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=generate-token`)

    const persisted = await settings.persistPostalSettings(
      {
        raw: async (sql: string) => {
          if (sql.includes("SELECT value FROM admin_plugin_settings")) {
            return { rows: [] }
          }
          return { rows: [] }
        },
      },
      {
        from: "Postal <ops@uhlhosting.ch>",
        base_url: "https://postal.example.test",
        api_key: "",
        test_to: "ops@example.com",
      }
    )

    assert.equal(persisted.from, "Postal <ops@uhlhosting.ch>")
    assert.equal(persisted.api_key, "existing-key")
    assert.match(persisted.webhook_token, /^[a-f0-9]{64}$/)
  } finally {
    chdir(originalCwd)
    if (previousWebhookToken === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previousWebhookToken
    }
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings falls back to process.env when no env file values exist", async () => {
  const previousCwd = cwd()
  const previousEnv = {
    POSTAL_AUTH_TYPE: process.env.POSTAL_AUTH_TYPE,
    POSTAL_FROM: process.env.POSTAL_FROM,
    POSTAL_BASE_URL: process.env.POSTAL_BASE_URL,
    POSTAL_API_KEY: process.env.POSTAL_API_KEY,
    POSTAL_WEBHOOK_TOKEN: process.env.POSTAL_WEBHOOK_TOKEN,
  }
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-process-env-"))
  mkdirSync(path.join(tempRoot, "apps", "backend"), { recursive: true })

  process.env.POSTAL_AUTH_TYPE = "smtp-api"
  process.env.POSTAL_FROM = "Process Env <env@uhlhosting.ch>"
  process.env.POSTAL_BASE_URL = "https://postal.process.example.test"
  process.env.POSTAL_API_KEY = "process-key"
  process.env.POSTAL_WEBHOOK_TOKEN = "process-token"

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=process-env`)

    const snapshot = await settings.getPostalSettings(undefined)

    assert.equal(snapshot.from, "Process Env <env@uhlhosting.ch>")
    assert.equal(snapshot.base_url, "https://postal.process.example.test")
    assert.equal(snapshot.api_key, "process-key")
    assert.equal(snapshot.webhook_token, "process-token")
  } finally {
    chdir(previousCwd)
    rmSync(tempRoot, { recursive: true, force: true })

    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
})

test("postal settings cleans up when writing the env file fails", async () => {
  const previousCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-write-fail-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })
  mkdirSync(path.join(backendDir, ".env.tmp"))
  writeFileSync(
    path.join(backendDir, ".env"),
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.example.test",
      "POSTAL_API_KEY=existing-key",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=write-fail`)

    await assert.rejects(
      () =>
        settings.persistPostalSettings(
          {
            raw: async (sql: string) => {
              if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                return { rows: [] }
              }
              return { rows: [] }
            },
          },
          {
            from: "Postal <ops@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: "new-key",
            test_to: "ops@example.com",
            webhook_token: "token-new",
          }
        ),
      /EISDIR|illegal operation on a directory/i
    )
  } finally {
    chdir(previousCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings can persist without a database connection", async () => {
  const previousCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-no-db-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })
  writeFileSync(
    path.join(backendDir, ".env"),
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.example.test",
      "POSTAL_API_KEY=existing-key",
      "POSTAL_WEBHOOK_TOKEN=existing-token",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=no-db`)

    const persisted = await settings.persistPostalSettings(undefined, {
      from: "Postal <new@uhlhosting.ch>",
      base_url: "https://postal.example.test",
      api_key: "new-key",
      test_to: "ops@example.com",
      webhook_token: "new-token",
    })

    assert.equal(persisted.from, "Postal <new@uhlhosting.ch>")
    assert.equal(persisted.api_key, "new-key")
    assert.equal(persisted.webhook_token, "new-token")
  } finally {
    chdir(previousCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings falls back cleanly when the database read fails", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-db-fallback-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })
  writeFileSync(
    path.join(backendDir, ".env"),
    [
      "POSTAL_AUTH_TYPE=smtp-api",
      "POSTAL_FROM=Fallback Postal <fallback@uhlhosting.ch>",
      "POSTAL_BASE_URL=https://postal.fallback.example.test",
      "POSTAL_API_KEY=fallback-key",
      "POSTAL_WEBHOOK_TOKEN=fallback-token",
      "",
    ].join("\n"),
    "utf8"
  )

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?db-fallback`)

    const snapshot = await settings.getPostalSettings({
      raw: async () => {
        throw new Error("db unavailable")
      },
    })

    assert.equal(snapshot.from, "Fallback Postal <fallback@uhlhosting.ch>")
    assert.equal(snapshot.api_key, "fallback-key")
    assert.equal(snapshot.webhook_token, "fallback-token")
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("postal settings can persist when the env file does not exist yet", async () => {
  const originalCwd = cwd()
  const tempRoot = mkdtempSync(path.join(tmpdir(), "postal-settings-create-env-"))
  const backendDir = path.join(tempRoot, "apps", "backend")
  mkdirSync(backendDir, { recursive: true })

  chdir(tempRoot)

  try {
    const moduleUrl = pathToFileURL(path.join(__dirname, "settings.js"))
    const settings = await import(`${moduleUrl.href}?case=create-env`)

    const persisted = await settings.persistPostalSettings(
      {
        raw: async (sql: string) => {
          if (sql.includes("SELECT value FROM admin_plugin_settings")) {
            return { rows: [] }
          }
          return { rows: [] }
        },
      },
      {
        from: "Postal <ops@uhlhosting.ch>",
        base_url: "https://postal.example.test",
        api_key: "created-key",
        test_to: "ops@example.com",
        webhook_token: "created-token",
      }
    )

    assert.equal(persisted.api_key, "created-key")
    assert.equal(persisted.webhook_token, "created-token")
    assert.ok(readFileSync(path.join(backendDir, ".env"), "utf8").includes("POSTAL_FROM"))
  } finally {
    chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

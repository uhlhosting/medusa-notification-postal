import test from "node:test"
import assert from "node:assert/strict"
import {
  getPostalSettings,
  persistPostalSettings,
  toPublicPostalSettings,
  validateModeRequirements,
  POSTAL_SETTINGS_ID,
  type PostalSettingRecord,
  type PostalSettingService,
} from "./settings"

// In-memory fake of the generated module service methods used by settings.ts.
const createFakeService = (seed?: Partial<PostalSettingRecord>) => {
  const rows = new Map<string, PostalSettingRecord>()
  if (seed) {
    rows.set(POSTAL_SETTINGS_ID, {
      id: POSTAL_SETTINGS_ID,
      auth_type: "smtp-api",
      from_address: "",
      base_url: "",
      test_to: "",
      pending_restart: false,
      ...seed,
    })
  }

  const service: PostalSettingService & {
    rows: Map<string, PostalSettingRecord>
  } = {
    rows,
    listPostalSettings: async (filter) => {
      const id = (filter?.id as string) ?? POSTAL_SETTINGS_ID
      const row = rows.get(id)
      return row ? [row] : []
    },
    createPostalSettings: async (data) => {
      const record = { ...(data as PostalSettingRecord) }
      rows.set(record.id, record)
      return record
    },
    updatePostalSettings: async (data) => {
      const record = data as Partial<PostalSettingRecord> & { id: string }
      const existing = rows.get(record.id)
      const merged = { ...(existing as PostalSettingRecord), ...record }
      rows.set(record.id, merged)
      return merged
    },
  }

  return service
}

const withEnv = async (
  overrides: Record<string, string | undefined>,
  run: () => Promise<void>
) => {
  const previous: Record<string, string | undefined> = {}
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key]
    if (overrides[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = overrides[key]
    }
  }

  try {
    await run()
  } finally {
    for (const key of Object.keys(previous)) {
      if (previous[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previous[key]
      }
    }
  }
}

test("getPostalSettings sources secrets from env and non-secret from the record", async () => {
  await withEnv(
    {
      POSTAL_API_KEY: "secret-key",
      POSTAL_WEBHOOK_TOKEN: "whtoken1234",
      POSTAL_FROM: "env@example.com",
      POSTAL_BASE_URL: "https://env.example.com",
      POSTAL_TEST_TO: "env-test@example.com",
    },
    async () => {
      const service = createFakeService({
        from_address: "db@example.com",
        base_url: "https://db.example.com",
        test_to: "db-test@example.com",
      })

      const settings = await getPostalSettings(service)

      // DB overrides env for non-secret fields.
      assert.equal(settings.from, "db@example.com")
      assert.equal(settings.base_url, "https://db.example.com")
      assert.equal(settings.test_to, "db-test@example.com")
      // Secrets come from env only.
      assert.equal(settings.api_key, "secret-key")
      assert.equal(settings.webhook_token, "whtoken1234")
      assert.equal(settings.configured.api_key, true)
      assert.equal(settings.configured.webhook_token, true)
      assert.equal(settings.secret_hints.api_key_masked?.endsWith("-key"), true)
    }
  )
})

test("getPostalSettings falls back to env when there is no record or service", async () => {
  await withEnv(
    {
      POSTAL_API_KEY: "",
      POSTAL_WEBHOOK_TOKEN: "",
      POSTAL_FROM: "env@example.com",
      POSTAL_BASE_URL: "https://env.example.com",
      POSTAL_TEST_TO: undefined,
    },
    async () => {
      const settings = await getPostalSettings(null)
      assert.equal(settings.from, "env@example.com")
      assert.equal(settings.base_url, "https://env.example.com")
      assert.equal(settings.api_key, "")
      assert.equal(settings.configured.api_key, false)
      assert.equal(settings.secret_hints.api_key_masked, null)
      assert.equal(settings.test_to, null)
    }
  )
})

test("persistPostalSettings creates a row, ignores secret fields, and flags restart", async () => {
  await withEnv(
    {
      POSTAL_API_KEY: "env-key",
      POSTAL_WEBHOOK_TOKEN: "env-token",
      POSTAL_FROM: undefined,
      POSTAL_BASE_URL: undefined,
      POSTAL_TEST_TO: undefined,
    },
    async () => {
      const service = createFakeService()

      const result = await persistPostalSettings(service, {
        from: "  new@example.com  ",
        base_url: "https://new.example.com",
        test_to: "qa@example.com",
        // Secret fields must be ignored.
        api_key: "attacker-supplied",
        webhook_token: "attacker-token",
      })

      const stored = service.rows.get(POSTAL_SETTINGS_ID)
      assert.ok(stored)
      assert.equal(stored?.from_address, "new@example.com")
      assert.equal(stored?.base_url, "https://new.example.com")
      assert.equal(stored?.test_to, "qa@example.com")
      assert.equal(stored?.pending_restart, true)
      // Secret fields never touch the persisted row.
      assert.equal("api_key" in (stored as object), false)

      // Returned snapshot reflects saved non-secret values + env secrets.
      assert.equal(result.from, "new@example.com")
      assert.equal(result.api_key, "env-key")
      assert.equal(result.webhook_token, "env-token")
    }
  )
})

test("persistPostalSettings updates an existing row and preserves prior values", async () => {
  await withEnv(
    { POSTAL_FROM: undefined, POSTAL_BASE_URL: undefined, POSTAL_TEST_TO: undefined },
    async () => {
      const service = createFakeService({
        from_address: "old@example.com",
        base_url: "https://old.example.com",
        test_to: "old-test@example.com",
      })

      await persistPostalSettings(service, { from: "changed@example.com" })

      const stored = service.rows.get(POSTAL_SETTINGS_ID)
      assert.equal(stored?.from_address, "changed@example.com")
      // Untouched fields fall back to the current values.
      assert.equal(stored?.base_url, "https://old.example.com")
      assert.equal(stored?.test_to, "old-test@example.com")
      assert.equal(service.rows.size, 1)
    }
  )
})

test("toPublicPostalSettings strips secret values", async () => {
  await withEnv(
    { POSTAL_API_KEY: "secret-key", POSTAL_WEBHOOK_TOKEN: "whtoken1234" },
    async () => {
      const settings = await getPostalSettings(createFakeService())
      const publicView = toPublicPostalSettings(settings)
      assert.equal(publicView.api_key, "")
      assert.equal(publicView.webhook_token, "")
      // Masked hints remain for display.
      assert.ok(publicView.secret_hints.api_key_masked)
    }
  )
})

test("validateModeRequirements enforces from, base_url, and api_key", async () => {
  await withEnv(
    { POSTAL_API_KEY: "", POSTAL_FROM: undefined, POSTAL_BASE_URL: undefined },
    async () => {
      assert.equal(
        validateModeRequirements(await getPostalSettings(createFakeService())),
        "POSTAL_FROM is required"
      )
      assert.equal(
        validateModeRequirements(
          await getPostalSettings(createFakeService({ from_address: "a@b.com" }))
        ),
        "POSTAL_BASE_URL is required for API mode"
      )
      assert.equal(
        validateModeRequirements(
          await getPostalSettings(
            createFakeService({ from_address: "a@b.com", base_url: "https://p" })
          )
        ),
        "POSTAL_API_KEY is required for API mode"
      )
    }
  )

  await withEnv({ POSTAL_API_KEY: "k" }, async () => {
    assert.equal(
      validateModeRequirements(
        await getPostalSettings(
          createFakeService({ from_address: "a@b.com", base_url: "https://p" })
        )
      ),
      null
    )
  })
})

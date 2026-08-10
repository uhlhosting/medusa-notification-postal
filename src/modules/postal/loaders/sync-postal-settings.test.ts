import test from "node:test"
import assert from "node:assert/strict"
import syncPostalSettingsLoader, {
  type SettingsServiceFactory,
} from "./sync-postal-settings"
import { POSTAL_SETTINGS_ID } from "../constants"

type Row = {
  id: string
  auth_type: string
  from_address: string
  base_url: string
  test_to: string
  pending_restart: boolean
}

// In-memory stand-in for the generated module service, in the same style as
// settings.test.ts.
const createFakeService = (seed?: Partial<Row>) => {
  const rows: Row[] = seed
    ? [
        {
          id: POSTAL_SETTINGS_ID,
          auth_type: "smtp-api",
          from_address: "",
          base_url: "",
          test_to: "",
          pending_restart: false,
          ...seed,
        },
      ]
    : []
  const created: Record<string, unknown>[] = []
  const updated: Record<string, unknown>[] = []
  return {
    created,
    updated,
    service: {
      listPostalSettings: async () => rows,
      createPostalSettings: async (data: Record<string, unknown>) => {
        created.push(data)
      },
      updatePostalSettings: async (data: Record<string, unknown>) => {
        updated.push(data)
      },
    },
  }
}

// The module's LOCAL container: it resolves the module's own dependencies, and
// deliberately fails on anything else — including the module service, which is
// registered in the OUTER container only after every loader has run.
const createContainer = () => {
  const warnings: string[] = []
  return {
    warnings,
    container: {
      cradle: { manager: "entity-manager" },
      resolve: (key: string) => {
        if (key === "logger") {
          return { warn: (message: unknown) => warnings.push(String(message)) }
        }
        throw new Error(`Could not resolve '${key}'`)
      },
    } as never,
  }
}

const ENV_KEYS = [
  "POSTAL_AUTH_TYPE",
  "POSTAL_FROM",
  "POSTAL_BASE_URL",
  "POSTAL_TEST_TO",
] as const

// Each case owns its environment: the loader's whole purpose is mutating
// process.env, so leaking between tests would make them lie.
const withCleanEnv = async (run: () => Promise<void>) => {
  const saved = ENV_KEYS.map((key) => [key, process.env[key]] as const)
  for (const key of ENV_KEYS) delete process.env[key]
  try {
    await run()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test("constructs the service from the local cradle, never by module key", async () => {
  await withCleanEnv(async () => {
    const { container } = createContainer()
    const { service } = createFakeService()
    const seen: unknown[][] = []
    const factory: SettingsServiceFactory = (cradle, options, declaration) => {
      seen.push([cradle, options, declaration])
      return service
    }

    await syncPostalSettingsLoader(
      { container, options: { some: "option" } } as never,
      { declaration: true },
      factory
    )

    // Resolving POSTAL_PLUGIN_MODULE here would throw and land in the catch,
    // which is exactly the bug this replaces: the container above rejects every
    // key except the logger.
    assert.equal(seen.length, 1)
    assert.deepEqual(seen[0][0], { manager: "entity-manager" })
    assert.deepEqual(seen[0][1], { some: "option" })
    assert.deepEqual(seen[0][2], { declaration: true })
  })
})

test("a persisted row overrides the environment", async () => {
  await withCleanEnv(async () => {
    const { container } = createContainer()
    const { service, updated } = createFakeService({
      from_address: "saved@example.test",
      base_url: "https://saved.example.test",
      test_to: "qa@example.test",
    })

    await syncPostalSettingsLoader({ container } as never, undefined, () => service)

    assert.equal(process.env.POSTAL_FROM, "saved@example.test")
    assert.equal(process.env.POSTAL_BASE_URL, "https://saved.example.test")
    assert.equal(process.env.POSTAL_TEST_TO, "qa@example.test")
    assert.equal(updated.length, 0)
  })
})

test("clears pending_restart once the restart has happened", async () => {
  await withCleanEnv(async () => {
    const { container } = createContainer()
    const { service, updated } = createFakeService({
      from_address: "saved@example.test",
      pending_restart: true,
    })

    await syncPostalSettingsLoader({ container } as never, undefined, () => service)

    assert.equal(updated.length, 1)
    assert.equal(updated[0].pending_restart, false)
  })
})

test("seeds a row from the environment when none exists", async () => {
  await withCleanEnv(async () => {
    const { container } = createContainer()
    const { service, created } = createFakeService()
    process.env.POSTAL_FROM = "env@example.test"
    process.env.POSTAL_BASE_URL = "https://env.example.test"

    await syncPostalSettingsLoader({ container } as never, undefined, () => service)

    assert.equal(created.length, 1)
    assert.equal(created[0].from_address, "env@example.test")
    assert.equal(created[0].base_url, "https://env.example.test")
    assert.equal(created[0].pending_restart, false)
  })
})

test("writes nothing when there is neither a row nor anything to seed from", async () => {
  await withCleanEnv(async () => {
    const { container } = createContainer()
    const { service, created } = createFakeService()

    await syncPostalSettingsLoader({ container } as never, undefined, () => service)

    assert.equal(created.length, 0)
  })
})

test("warns with the cause and never throws", async () => {
  await withCleanEnv(async () => {
    const { container, warnings } = createContainer()
    const failing = {
      listPostalSettings: async () => {
        throw new Error("relation \"postal_setting\" does not exist")
      },
      createPostalSettings: async () => undefined,
      updatePostalSettings: async () => undefined,
    }

    // An uncaught loader error makes Medusa register the module as undefined,
    // taking the whole provider down — so catching is right. The cause has to
    // reach the log interpolated, because the winston logger drops extra
    // arguments and that is how this failure stayed invisible.
    await syncPostalSettingsLoader(
      { container } as never,
      undefined,
      () => failing as never
    )

    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /postal_setting" does not exist/)
  })
})

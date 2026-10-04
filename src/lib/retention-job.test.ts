import test from "node:test"
import assert from "node:assert/strict"
import { resolvePostalPluginOptions } from "../modules/postal/options"
import { runRetentionJob } from "./retention-job"

const makeContainer = (pluginOptions: Record<string, unknown> | null) => {
  const info: string[] = []
  const warn: string[] = []
  const container = {
    resolve: (key: string) => {
      if (key === "logger") {
        return {
          info: (message: string) => void info.push(message),
          warn: (message: string) => void warn.push(message),
        }
      }
      if (key === "postalPlugin") {
        if (pluginOptions === null) {
          throw new Error("postalPlugin is not registered")
        }
        return { getPluginOptions: () => resolvePostalPluginOptions(pluginOptions) }
      }
      throw new Error(`unexpected dependency: ${key}`)
    },
  }

  return { container: container as never, info, warn }
}

const now = () => new Date("2026-09-14T03:30:00.000Z")

test("does nothing when the option is unset", async () => {
  const { container, info, warn } = makeContainer({})
  let runs = 0

  const result = await runRetentionJob({
    container,
    option: "notification_retention_days",
    label: "notification records",
    run: async () => {
      runs += 1
      return { result: { deleted: 0, cutoff: "" } }
    },
    now,
  })

  assert.equal(result, null)
  assert.equal(runs, 0)
  assert.deepEqual(info, [])
  assert.deepEqual(warn, [])
})

test("does nothing when the plugin module is not registered", async () => {
  const { container } = makeContainer(null)
  let runs = 0

  await runRetentionJob({
    container,
    option: "webhook_event_retention_days",
    label: "Postal webhook events",
    run: async () => {
      runs += 1
      return { result: { deleted: 0, cutoff: "" } }
    },
    now,
  })

  assert.equal(runs, 0)
})

test("warns, naming the option but not its value, and stays off when the option is unusable", async () => {
  const { container, warn } = makeContainer({ notification_retention_days: "ninety" })
  let runs = 0

  await runRetentionJob({
    container,
    option: "notification_retention_days",
    label: "notification records",
    run: async () => {
      runs += 1
      return { result: { deleted: 0, cutoff: "" } }
    },
    now,
  })

  assert.equal(runs, 0)
  assert.equal(warn.length, 1)
  assert.match(warn[0]!, /notification_retention_days/)
  assert.doesNotMatch(warn[0]!, /ninety/)
})

test("purges from the current time with the configured period and logs only the count", async () => {
  const { container, info } = makeContainer({ notification_retention_days: 90 })
  const inputs: unknown[] = []

  const result = await runRetentionJob({
    container,
    option: "notification_retention_days",
    label: "notification records",
    run: async (input) => {
      inputs.push(input)
      return { result: { deleted: 4, cutoff: "2026-06-16T03:30:00.000Z" } }
    },
    now,
  })

  assert.deepEqual(inputs, [
    { now: "2026-09-14T03:30:00.000Z", retention_days: 90 },
  ])
  assert.deepEqual(result, { deleted: 4, cutoff: "2026-06-16T03:30:00.000Z" })
  assert.deepEqual(info, [
    "[postal] Deleted 4 notification records created before 2026-06-16T03:30:00.000Z.",
  ])
})

test("stays quiet when nothing expired", async () => {
  const { container, info } = makeContainer({ webhook_event_retention_days: "30" })

  await runRetentionJob({
    container,
    option: "webhook_event_retention_days",
    label: "Postal webhook events",
    run: async () => ({
      result: { deleted: 0, cutoff: "2026-08-15T03:30:00.000Z" },
    }),
    now,
  })

  assert.deepEqual(info, [])
})

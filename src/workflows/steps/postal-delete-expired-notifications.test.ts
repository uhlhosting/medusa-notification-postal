import test from "node:test"
import assert from "node:assert/strict"
import { Modules } from "@medusajs/framework/utils"
import { postalDeleteExpiredNotificationsStepHandler } from "./postal-delete-expired-notifications"
import {
  RETENTION_BATCH_SIZE,
  RETENTION_MAX_BATCHES,
  retentionCutoff,
} from "./retention"

const ids = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, index) => ({ id: `noti_${offset + index}` }))

const makeContainer = (
  batches: Array<Array<{ id: string }>> | (() => Array<{ id: string }>),
  registered = true
) => {
  const listCalls: Array<[Record<string, unknown>, Record<string, unknown>]> = []
  const deleteCalls: string[][] = []
  const resolveCalls: Array<[string, unknown]> = []
  const queue = Array.isArray(batches) ? [...batches] : null

  const service = {
    listNotifications: async (
      filters: Record<string, unknown>,
      config: Record<string, unknown>
    ) => {
      listCalls.push([filters, config])
      return queue ? queue.shift() ?? [] : (batches as () => Array<{ id: string }>)()
    },
    deleteNotifications: async (rowIds: string[]) => {
      deleteCalls.push(rowIds)
    },
  }

  const container = {
    resolve: (key: string, options?: { allowUnregistered?: boolean }) => {
      resolveCalls.push([key, options])
      if (key === Modules.NOTIFICATION) {
        if (registered) {
          return service
        }
        if (options?.allowUnregistered) {
          return undefined
        }
      }
      throw new Error(`Unexpected container key: ${key}`)
    },
  }

  return { container, listCalls, deleteCalls, resolveCalls }
}

const NOW = "2026-09-14T03:30:00.000Z"

test("the cutoff is measured the configured number of days back from now", () => {
  assert.equal(
    retentionCutoff(new Date(NOW), 90).toISOString(),
    "2026-06-16T03:30:00.000Z"
  )
  assert.equal(
    retentionCutoff(new Date(NOW), 30).toISOString(),
    "2026-08-15T03:30:00.000Z"
  )
})

test("deletes every notification row before the cutoff, whatever its resource, in batches", async () => {
  const { container, listCalls, deleteCalls } = makeContainer([
    ids(500),
    ids(2, 500),
  ])

  const response = await postalDeleteExpiredNotificationsStepHandler(
    { now: NOW, retention_days: 90 },
    { container }
  )

  assert.equal(listCalls.length, 2)
  for (const [filters, config] of listCalls) {
    // Only the age filter: no provider, resource_type, channel, template or
    // status, so every row in the shared table expires.
    assert.deepEqual(filters, {
      created_at: { $lt: new Date("2026-06-16T03:30:00.000Z") },
    })
    assert.deepEqual(config, { select: ["id"], take: RETENTION_BATCH_SIZE })
  }
  assert.deepEqual(deleteCalls[0], ids(500).map(({ id }) => id))
  assert.deepEqual(deleteCalls[1], ["noti_500", "noti_501"])
  assert.deepEqual(response.output, {
    deleted: 502,
    cutoff: "2026-06-16T03:30:00.000Z",
  })
})

test("deletes nothing when no row is old enough", async () => {
  const { container, listCalls, deleteCalls } = makeContainer([[]])

  const response = await postalDeleteExpiredNotificationsStepHandler(
    { now: NOW, retention_days: 90 },
    { container }
  )

  assert.equal(listCalls.length, 1)
  assert.equal(deleteCalls.length, 0)
  assert.equal(response.output.deleted, 0)
})

test("does nothing where no notification module is registered", async () => {
  const { container, listCalls, resolveCalls } = makeContainer([], false)

  const response = await postalDeleteExpiredNotificationsStepHandler(
    { now: NOW, retention_days: 90 },
    { container }
  )

  assert.deepEqual(resolveCalls, [
    [Modules.NOTIFICATION, { allowUnregistered: true }],
  ])
  assert.equal(listCalls.length, 0)
  assert.equal(response.output.deleted, 0)
})

test("stops after a bounded number of batches if deletes do not take effect", async () => {
  const { container, listCalls } = makeContainer(() => ids(500))

  const response = await postalDeleteExpiredNotificationsStepHandler(
    { now: NOW, retention_days: 90 },
    { container }
  )

  assert.equal(listCalls.length, RETENTION_MAX_BATCHES)
  assert.equal(response.output.deleted, RETENTION_MAX_BATCHES * 500)
})

test("rejects a timestamp or period it cannot measure from", async () => {
  const { container, listCalls } = makeContainer([])

  await assert.rejects(
    postalDeleteExpiredNotificationsStepHandler(
      { now: "not-a-date", retention_days: 90 },
      { container }
    ),
    /now must be an ISO timestamp/
  )
  for (const retention_days of [0, -5, 1.5, Number.NaN]) {
    await assert.rejects(
      postalDeleteExpiredNotificationsStepHandler(
        { now: NOW, retention_days },
        { container }
      ),
      /retention_days must be a positive whole number/
    )
  }
  assert.equal(listCalls.length, 0)
})

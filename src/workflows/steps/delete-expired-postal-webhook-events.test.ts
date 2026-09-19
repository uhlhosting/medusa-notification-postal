import test from "node:test"
import assert from "node:assert/strict"
import { POSTAL_PLUGIN_MODULE } from "../../modules/postal/constants"
import { deleteExpiredPostalWebhookEventsStepHandler } from "./delete-expired-postal-webhook-events"

const NOW = "2026-09-14T03:40:00.000Z"

test("deletes stored webhook events created before the cutoff", async () => {
  const listCalls: unknown[] = []
  const deleteCalls: string[][] = []
  const queue = [[{ id: "postal_webhook_1" }, { id: "postal_webhook_2" }]]
  const container = {
    resolve: (key: string) => {
      assert.equal(key, POSTAL_PLUGIN_MODULE)
      return {
        listPostalWebhookEvents: async (filters: unknown, config: unknown) => {
          listCalls.push([filters, config])
          return queue.shift() ?? []
        },
        deletePostalWebhookEvents: async (ids: string[]) => {
          deleteCalls.push(ids)
        },
      }
    },
  }

  const response = await deleteExpiredPostalWebhookEventsStepHandler(
    { now: NOW, retention_days: 30 },
    { container }
  )

  assert.deepEqual(listCalls, [
    [
      { created_at: { $lt: new Date("2026-08-15T03:40:00.000Z") } },
      { select: ["id"], take: 500 },
    ],
  ])
  assert.deepEqual(deleteCalls, [["postal_webhook_1", "postal_webhook_2"]])
  assert.deepEqual(response.output, {
    deleted: 2,
    cutoff: "2026-08-15T03:40:00.000Z",
  })
})

test("does nothing where the plugin module is not registered", async () => {
  const container = {
    resolve: () => {
      throw new Error("not registered")
    },
  }

  const response = await deleteExpiredPostalWebhookEventsStepHandler(
    { now: NOW, retention_days: 30 },
    { container }
  )

  assert.equal(response.output.deleted, 0)
})

test("rejects a period it cannot measure from", async () => {
  await assert.rejects(
    deleteExpiredPostalWebhookEventsStepHandler(
      { now: NOW, retention_days: 0 },
      { container: { resolve: () => null } }
    ),
    /retention_days must be a positive whole number/
  )
})

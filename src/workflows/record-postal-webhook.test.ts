import test from "node:test"
import assert from "node:assert/strict"
import { asValue } from "@medusajs/framework/awilix"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { POSTAL_PLUGIN_MODULE } from "../modules/postal/constants"
import { recordPostalWebhookWorkflow } from "./record-postal-webhook"

test("recordPostalWebhookWorkflow returns the recorded webhook event", async () => {
  const workflow = recordPostalWebhookWorkflow({
    resolve: () => ({ raw: undefined }),
  } as never)

  const result = await workflow.run({
    input: {
      event_type: "message.sent",
      status: "sent",
      message: {
        tag: "uhlhosting.medusa-notification-postal:postal-test",
      },
    },
  })

  const recorded = result.result as NonNullable<typeof result.result>
  assert.notEqual(recorded, null)
  assert.equal(recorded.event_type, "message.sent")
  assert.equal(recorded.status, "sent")
})

const createEmitTestContainer = () => {
  const rows: Array<Record<string, unknown>> = []
  const emitted: Array<{ name: string; data: Record<string, unknown> }> = []
  const eventBus = {
    emit: async (messages: unknown) => {
      for (const message of [messages].flat() as Array<Record<string, any>>) {
        emitted.push({ name: message.name, data: message.data })
      }
    },
    releaseGroupedEvents: async () => {},
    clearGroupedEvents: async () => {},
  }
  const service = {
    listPostalWebhookEvents: async (filter: Record<string, unknown> = {}) =>
      rows.filter((row) => !filter.id || row.id === filter.id),
    createPostalWebhookEvents: async (data: Record<string, unknown>) => {
      rows.push(data)
      return data
    },
  }
  // The workflow runner rebuilds plain objects, so register on a real container.
  const container = createMedusaContainer()
  container.register({
    [POSTAL_PLUGIN_MODULE]: asValue(service),
    [Modules.EVENT_BUS]: asValue(eventBus),
  })
  return { container, rows, emitted }
}

const postalDeliveryEnvelope = {
  event: "MessageSent",
  timestamp: 1782839546.5,
  uuid: "0d7a1c9e-4b2f-4f6a-9c1e-2b3d4e5f6a7b",
  payload: {
    status: "Sent",
    timestamp: 1782839545.73,
    message: {
      id: 28638,
      to: "customer@example.com",
      tag: "uhlhosting.medusa-notification-postal:order-placed",
    },
  },
}

test("recordPostalWebhookWorkflow emits postal.<status> once per Postal delivery", async () => {
  const { container, rows, emitted } = createEmitTestContainer()

  const first = await recordPostalWebhookWorkflow(container as never).run({
    input: postalDeliveryEnvelope,
  })
  assert.equal(first.result?.status, "sent")
  assert.equal(rows.length, 1)
  assert.equal(emitted.length, 1)
  assert.equal(emitted[0]!.name, "postal.sent")
  assert.equal(emitted[0]!.data.message_id, "28638")

  // Postal retries until it gets a 2xx; the replay must not re-fire subscribers.
  const replay = await recordPostalWebhookWorkflow(container as never).run({
    input: postalDeliveryEnvelope,
  })
  assert.equal(replay.result?.id, first.result?.id)
  assert.equal(rows.length, 1)
  assert.equal(emitted.length, 1)
})

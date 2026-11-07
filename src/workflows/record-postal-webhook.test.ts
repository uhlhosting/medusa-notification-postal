import test from "node:test"
import assert from "node:assert/strict"
import { asValue } from "@medusajs/framework/awilix"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { POSTAL_PLUGIN_MODULE } from "../modules/postal/constants"
import { recordPostalWebhookWorkflow } from "./record-postal-webhook"

test("recordPostalWebhookWorkflow surfaces missing persistence", async () => {
  const workflow = recordPostalWebhookWorkflow({
    resolve: () => null,
  } as never)

  await assert.rejects(
    workflow.run({
      input: {
        event_type: "message.sent",
        status: "sent",
        message: {
          tag: "uhlhosting.medusa-notification-postal:postal-test",
        },
      },
    }),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      error.message === "Postal webhook persistence is unavailable"
  )
})

const createEmitTestContainer = ({
  failFirstEmit = false,
  ignoreEngagement = false,
} = {}) => {
  let rows: Array<Record<string, unknown>> = []
  const emitted: Array<{ name: string; data: Record<string, unknown> }> = []
  let emitCalls = 0
  const eventBus = {
    emit: async (messages: unknown) => {
      emitCalls++
      if (failFirstEmit && emitCalls === 1) {
        throw new Error("READONLY You can't write against a read only replica.")
      }
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
    deletePostalWebhookEvents: async (ids: string | string[]) => {
      const drop = new Set([ids].flat())
      rows = rows.filter((row) => !drop.has(row.id as string))
    },
    getPluginOptions: () => ({
      notification_retention_days: { days: null, invalid: false },
      webhook_event_retention_days: { days: null, invalid: false },
      ignore_engagement_webhooks: ignoreEngagement,
    }),
  }
  // The workflow runner rebuilds plain objects, so register on a real container.
  const container = createMedusaContainer()
  container.register({
    [POSTAL_PLUGIN_MODULE]: asValue(service),
    [Modules.EVENT_BUS]: asValue(eventBus),
  })
  return {
    container,
    get rows() {
      return rows
    },
    emitted,
  }
}

const postalDeliveryEnvelope = (
  event = "MessageSent",
  payload: Record<string, unknown> = { status: "Sent", timestamp: 1782839545.73 }
) => ({
  event,
  timestamp: 1782839546.5,
  uuid: "0d7a1c9e-4b2f-4f6a-9c1e-2b3d4e5f6a7b",
  payload: {
    ...payload,
    message: {
      id: 28638,
      to: "customer@example.com",
      tag: "uhlhosting.medusa-notification-postal:order-placed",
    },
  },
})

test("recordPostalWebhookWorkflow emits postal.<status> once per Postal delivery", async () => {
  const state = createEmitTestContainer()
  const { container, emitted } = state

  const first = await recordPostalWebhookWorkflow(container as never).run({
    input: postalDeliveryEnvelope(),
  })
  assert.equal(first.result?.status, "sent")
  assert.equal(state.rows.length, 1)
  assert.equal(emitted.length, 1)
  assert.equal(emitted[0]!.name, "postal.sent")
  assert.equal(emitted[0]!.data.message_id, "28638")
  assert.equal("recipient" in emitted[0]!.data, false)

  // Postal retries a failed delivery with the same uuid; a replay must not
  // re-fire subscribers.
  const replay = await recordPostalWebhookWorkflow(container as never).run({
    input: postalDeliveryEnvelope(),
  })
  assert.equal(replay.result?.id, first.result?.id)
  assert.equal(state.rows.length, 1)
  assert.equal(emitted.length, 1)
})

test("recordPostalWebhookWorkflow removes the row when emitting fails so the retry emits", async () => {
  const state = createEmitTestContainer({ failFirstEmit: true })

  await assert.rejects(
    recordPostalWebhookWorkflow(state.container as never).run({
      input: postalDeliveryEnvelope(),
    }),
    // The workflow runner rejects with a serialized error object.
    (error: { message?: string }) => /READONLY/.test(error?.message ?? "")
  )
  // The failed run must not leave a row behind, or the retry is a "replay".
  assert.equal(state.rows.length, 0)
  assert.equal(state.emitted.length, 0)

  const retry = await recordPostalWebhookWorkflow(state.container as never).run({
    input: postalDeliveryEnvelope(),
  })
  assert.equal(retry.result?.status, "sent")
  assert.equal(state.rows.length, 1)
  assert.equal(state.emitted.length, 1)
})

test("recordPostalWebhookWorkflow neither stores nor emits ignored engagement callbacks", async () => {
  const state = createEmitTestContainer({ ignoreEngagement: true })

  const run = await recordPostalWebhookWorkflow(state.container as never).run({
    input: postalDeliveryEnvelope("MessageLinkClicked", {
      url: "https://example.com/",
    }),
  })

  assert.equal(run.result, null)
  assert.equal(state.rows.length, 0)
  assert.equal(state.emitted.length, 0)
})

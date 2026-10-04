import test from "node:test"
import assert from "node:assert/strict"
import { recordPostalWebhookEventStepHandler } from "./record-postal-webhook"

const engagementPayload = {
  event: "message.link_clicked",
  status: "clicked",
  message: {
    id: "msg_click_wf",
    recipient: "r@example.com",
    tag: "uhlhosting.medusa-notification-postal:order-placed",
  },
}

const makeWebhookContainer = (ignoreEngagement: boolean | undefined) => {
  const created: unknown[] = []
  const emitted: Array<{ name: string }> = []
  const service = {
    createPostalWebhookEvents: async (data: unknown) => {
      created.push(data)
    },
    listPostalWebhookEvents: async () => [],
    ...(ignoreEngagement === undefined
      ? {}
      : {
          getPluginOptions: () => ({
            notification_retention_days: { days: null, invalid: false },
            webhook_event_retention_days: { days: null, invalid: false },
            ignore_engagement_webhooks: ignoreEngagement,
          }),
        }),
  }
  const container = {
    resolve: (key: string) => {
      if (key === "postalPlugin") {
        return service
      }
      if (key === "event_bus") {
        return {
          emit: async (message: { name: string }) => {
            emitted.push(message)
          },
        }
      }
      return null
    },
  }

  return { container, created, emitted }
}

test("recordPostalWebhookEventStep neither stores nor emits engagement callbacks when ignore_engagement_webhooks is on", async () => {
  const { container, created, emitted } = makeWebhookContainer(true)

  const { output: result } = await recordPostalWebhookEventStepHandler(
    engagementPayload,
    { container }
  )

  assert.equal(result, null)
  assert.equal(created.length, 0)
  assert.equal(emitted.length, 0)
})

test("recordPostalWebhookEventStep records engagement callbacks when the option is off or the service predates it", async () => {
  for (const ignore of [false, undefined]) {
    const { container, created, emitted } = makeWebhookContainer(ignore)

    const { output: result } = await recordPostalWebhookEventStepHandler(
      engagementPayload,
      { container }
    )

    assert.equal(result?.status, "clicked")
    assert.equal(created.length, 1)
    assert.deepEqual(
      emitted.map((message) => message.name),
      ["postal.clicked"]
    )
  }
})

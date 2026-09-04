import test from "node:test"
import assert from "node:assert/strict"
import { handlePostalWebhookPost } from "./handler"

test("handlePostalWebhookPost uses validated body and returns workflow result", async () => {
  const calls: Array<{ input: Record<string, unknown> }> = []
  const scope = {
    resolve: (name: string) => {
      assert.equal(name, "pgConnection")
      return {}
    },
  }

  const response = await handlePostalWebhookPost({
    scope,

    validatedBody: {
      event_type: "message.sent",
      status: "sent",
    },
    runWebhookWorkflow: async (payload) => {
      calls.push({ input: payload })
      return {
        result: {
          id: "postal_webhook_123",
          event_type: "message.sent",
          status: "sent",
        },
      }
    },
  })

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0]?.input, {
    event_type: "message.sent",
    status: "sent",
  })
  assert.equal(response.status, 202)
  assert.equal(response.body.id, "postal_webhook_123")
  assert.equal(response.body.status, "sent")
})

test("handlePostalWebhookPost surfaces missing webhook persistence", async () => {
  const scope = {
    resolve: () => null,
  }

  await assert.rejects(
    handlePostalWebhookPost({
      scope,
      validatedBody: {
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

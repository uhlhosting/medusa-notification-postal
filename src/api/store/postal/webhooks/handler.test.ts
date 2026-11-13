import test from "node:test"
import assert from "node:assert/strict"
import { handlePostalWebhookPost } from "./handler"

test("handlePostalWebhookPost passes redacted metadata to the workflow", async () => {
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
      message: { id: "123", recipient: "private@example.test", subject: "private subject" },
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
  assert.equal((calls[0]?.input.event as { event_type: string }).event_type, "message.sent")
  assert.equal((calls[0]?.input.event as { message_id: string }).message_id, "123")
  assert.equal(JSON.stringify(calls[0]?.input).includes("private"), false)
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

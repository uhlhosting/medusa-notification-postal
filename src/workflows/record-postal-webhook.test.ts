import test from "node:test"
import assert from "node:assert/strict"
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

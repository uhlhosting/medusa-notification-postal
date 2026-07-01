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
    },
  })

  assert.equal(result.result.event_type, "message.sent")
  assert.equal(result.result.status, "sent")
})

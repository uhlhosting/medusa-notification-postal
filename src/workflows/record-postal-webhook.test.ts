import test from "node:test"
import assert from "node:assert/strict"
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

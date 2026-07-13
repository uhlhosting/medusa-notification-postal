import test from "node:test"
import assert from "node:assert/strict"
import { buildPostalNotificationInput } from "./steps/send-postal-email"

test("buildPostalNotificationInput routes admin test sends through the postal provider", () => {
  const providerData = {
    from: "no-reply@example.com",
    from_name: undefined,
    reply_to: undefined,
    subject: "Postal test",
    text: "Postal test body",
    html: "<p>Postal test body</p>",
    cc: undefined,
    bcc: undefined,
    headers: undefined,
    custom_args: undefined,
    metadata: undefined,
    workflow_event: "postal.admin.test",
    workflow_run_id: "admin_test_1",
  }

  const notification = buildPostalNotificationInput(
    {
      to: "recipient@example.com",
      from: "no-reply@example.com",
      template: "postal-test",
      provider_data: {
        subject: providerData.subject,
        text: providerData.text,
        html: providerData.html,
        workflow_event: providerData.workflow_event,
        workflow_run_id: providerData.workflow_run_id,
      },
    },
    "recipient@example.com",
    "postal-test",
    providerData
  )

  assert.equal(notification.provider_id, "postal")
  assert.equal(notification.channel, "email")
  assert.equal(notification.template, "postal-test")
  assert.equal(notification.provider_data.workflow_event, "postal.admin.test")
  assert.equal(notification.provider_data.workflow_run_id, "admin_test_1")
  assert.deepEqual(notification.data, notification.provider_data)
  // Idempotency key derived from run id + template + recipient dedupes retries.
  assert.equal(
    notification.idempotency_key,
    "postal:admin_test_1:postal-test:recipient@example.com"
  )
})

test("buildPostalNotificationInput omits idempotency_key without a workflow run id", () => {
  const notification = buildPostalNotificationInput(
    {
      to: "recipient@example.com",
      provider_data: { subject: "Hi" },
    },
    "recipient@example.com",
    "postal-test",
    { subject: "Hi" } as never
  )

  assert.equal(notification.idempotency_key, undefined)
})

import test from "node:test"
import assert from "node:assert/strict"
import {
  buildPostalNotificationInput,
  buildPostalNotificationsStep,
  buildProviderData,
} from "./steps/send-postal-email"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createMedusaContainer } from "@medusajs/framework/utils"

test("buildPostalNotificationInput creates a typed email notification", () => {
  const input = {
    to: "recipient@example.com",
    from: "no-reply@example.com",
    template: "postal-test",
    provider_data: {
      subject: "Postal test",
      text: "Postal test body",
      html: "<p>Postal test body</p>",
      workflow_event: "postal.admin.test",
      workflow_run_id: "admin_test_1",
    },
  }

  const notification = buildPostalNotificationInput(
    input,
    "recipient@example.com",
    "postal-test",
    buildProviderData(input)
  )

  assert.equal(notification.channel, "email")
  assert.equal(notification.template, "postal-test")
  assert.equal(notification.provider_data.workflow_event, "postal.admin.test")
  assert.equal(notification.provider_data.workflow_run_id, "admin_test_1")
  assert.deepEqual(notification.content, {
    subject: "Postal test",
    html: "<p>Postal test body</p>",
    text: "Postal test body",
  })
  // provider_data and data are persisted on the notification row and readable
  // through the admin API; bodies (reset or invite links) must not be copied.
  for (const field of ["subject", "html", "text"]) {
    assert.equal(field in notification.provider_data, false, field)
    assert.equal(field in notification.data, false, field)
  }
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

import { normalizeRecipients } from "./steps/send-postal-email"

test("normalizeRecipients formats a single string recipient", () => {
  const result = normalizeRecipients(" recipient@example.com  ")
  assert.deepEqual(result, ["recipient@example.com"])
})

test("normalizeRecipients formats an array of string recipients", () => {
  const result = normalizeRecipients([" a@example.com ", "b@example.com", "   c@example.com"])
  assert.deepEqual(result, ["a@example.com", "b@example.com", "c@example.com"])
})

test("normalizeRecipients filters out empty strings after trimming", () => {
  const result = normalizeRecipients([" a@example.com ", "", "   ", "b@example.com"])
  assert.deepEqual(result, ["a@example.com", "b@example.com"])
})

test("normalizeRecipients returns empty array for only empty strings", () => {
  const result = normalizeRecipients(["", "   "])
  assert.deepEqual(result, [])
})

test("normalizeRecipients returns empty array for a single empty string", () => {
  assert.deepEqual(normalizeRecipients(""), [])
})

test("normalizeRecipients returns empty array for a single whitespace string", () => {
  assert.deepEqual(normalizeRecipients("   "), [])
})

const buildNotificationsWorkflow = createWorkflow(
  "test-build-postal-notifications",
  function (input: Parameters<typeof buildProviderData>[0]) {
    return new WorkflowResponse(buildPostalNotificationsStep(input))
  }
)

test("buildPostalNotificationsStep attaches cc and bcc to the first recipient only", async () => {
  const { result } = await buildNotificationsWorkflow(createMedusaContainer()).run({
    input: {
      to: ["a@example.com", "b@example.com", "c@example.com"],
      from: "no-reply@example.com",
      provider_data: {
        subject: "Hi",
        text: "t",
        cc: "billing@example.com",
        bcc: ["archive@example.com"],
      },
    },
  })

  assert.equal(result.length, 3)
  assert.equal(result[0]!.provider_data.cc, "billing@example.com")
  assert.deepEqual(result[0]!.provider_data.bcc, ["archive@example.com"])
  assert.equal(result[0]!.data.cc, "billing@example.com")
  for (const notification of result.slice(1)) {
    assert.equal(notification.provider_data.cc, undefined)
    assert.equal(notification.provider_data.bcc, undefined)
    assert.equal(notification.data.cc, undefined)
    assert.equal(notification.data.bcc, undefined)
    // Everything else, the body included, still reaches every recipient.
    assert.equal(notification.content.text, "t")
    assert.equal(notification.from, "no-reply@example.com")
  }
})

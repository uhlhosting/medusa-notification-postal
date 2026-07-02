import test from "node:test"
import assert from "node:assert/strict"
import { buildPostalNotificationInput } from "./steps/send-postal-email"

test("buildPostalNotificationInput routes admin test sends through the postal provider", () => {
  const providerData = {
    from: "no-reply@uhl.site",
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
      to: "kosmos@highacid.com",
      from: "no-reply@uhl.site",
      template: "postal-test",
      provider_data: {
        subject: providerData.subject,
        text: providerData.text,
        html: providerData.html,
        workflow_event: providerData.workflow_event,
        workflow_run_id: providerData.workflow_run_id,
      },
    },
    "kosmos@highacid.com",
    "postal-test",
    providerData
  )

  assert.equal(notification.provider_id, "postal")
  assert.equal(notification.channel, "email")
  assert.equal(notification.template, "postal-test")
  assert.equal(notification.provider_data.workflow_event, "postal.admin.test")
  assert.equal(notification.provider_data.workflow_run_id, "admin_test_1")
  assert.deepEqual(notification.data, notification.provider_data)
})

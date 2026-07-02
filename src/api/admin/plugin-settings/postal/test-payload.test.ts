import test from "node:test"
import assert from "node:assert/strict"
import { buildPostalAdminTestProviderData } from "./test-payload"

test("buildPostalAdminTestProviderData uses template defaults when fields are empty", () => {
  const providerData = buildPostalAdminTestProviderData(
    {
      from: "no-reply@example.com",
      test_to: "admin@example.com",
      auth_type: "smtp-api",
    },
    {
      template: "order-placed",
      subject: "",
      html: "",
      text: "",
    },
    "admin_123"
  )

  assert.equal(providerData.template, "order-placed")
  assert.equal(providerData.subject, "Order confirmation")
  assert.match(providerData.html || "", /Thanks for your order/)
  assert.match(providerData.text || "", /We have received your order/)
  assert.equal(providerData.from, "no-reply@example.com")
  assert.equal(providerData.reply_to, undefined)
  assert.equal(providerData.workflow_run_id, "admin_123")
  assert.deepEqual(providerData.cc, undefined)
  assert.deepEqual(providerData.headers, {})
  assert.deepEqual(providerData.custom_args, {})
  assert.deepEqual(providerData.metadata, {})
})

test("buildPostalAdminTestProviderData preserves explicit overrides", () => {
  const providerData = buildPostalAdminTestProviderData(
    {
      from: "no-reply@example.com",
      test_to: "admin@example.com",
      auth_type: "smtp-api",
    },
    {
      template: "postal-admin-test",
      from_name: "Ops Admin",
      reply_to: "reply@example.com",
      subject: "Custom subject",
      html: "<p>Custom</p>",
      text: "Custom text",
      cc: ["copy@example.com"],
      bcc: "audit@example.com",
      headers: {
        "X-Trace-Id": "trace_123",
      },
      custom_args: {
        custom: "value",
      },
      metadata: {
        scope: "unit-test",
      },
    },
    "admin_456"
  )

  assert.equal(providerData.from_name, "Ops Admin")
  assert.equal(providerData.reply_to, "reply@example.com")
  assert.equal(providerData.subject, "Custom subject")
  assert.equal(providerData.html, "<p>Custom</p>")
  assert.equal(providerData.text, "Custom text")
  assert.deepEqual(providerData.cc, ["copy@example.com"])
  assert.equal(providerData.bcc, "audit@example.com")
  assert.equal(providerData.headers["X-Trace-Id"], "trace_123")
  assert.equal(providerData.custom_args?.custom, "value")
  assert.equal(providerData.metadata?.scope, "unit-test")
})

test("buildPostalAdminTestProviderData trims list inputs and falls back to template defaults", () => {
  const providerData = buildPostalAdminTestProviderData(
    {
      from: "no-reply@example.com",
      test_to: "admin@example.com",
      auth_type: "smtp-api",
    },
    {
      template: "   ",
      cc: " copy@example.com ",
      bcc: [" audit@example.com ", ""],
    },
    "admin_789"
  )

  assert.equal(providerData.template, "postal-admin-test")
  assert.equal(providerData.subject, "Postal test from Medusa Admin")
  assert.deepEqual(providerData.cc, "copy@example.com")
  assert.deepEqual(providerData.bcc, ["audit@example.com"])
})

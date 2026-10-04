import test from "node:test"
import assert from "node:assert/strict"
import { postalSettingsSchema } from "../../api/admin/plugin-settings/postal/validators"
import { postalSendTestSchema } from "../../api/admin/postal/send-test/validators"
import { toPostalSettingsPayload } from "./postal-payloads"

// The page keeps an `api_key` field for display only; it must never be sent.
const pageForm = {
  auth_type: "smtp-api" as const,
  from: "shop@example.com",
  base_url: "https://postal.example.com",
  api_key: "",
  test_to: "",
}

test("the admin save payload is accepted by the strict settings schema", () => {
  const settings = toPostalSettingsPayload(pageForm)
  assert.equal("api_key" in settings, false)

  const result = postalSettingsSchema.safeParse({ action: "save", settings })
  assert.equal(result.success, true, JSON.stringify(result.error?.issues))
})

test("the admin test-send payload is accepted by the strict send-test schema", () => {
  // What the page sends when only the defaults are used.
  const minimal = postalSendTestSchema.safeParse({
    cc: [],
    bcc: [],
    headers: {},
    custom_args: {},
    metadata: {},
    settings: toPostalSettingsPayload(pageForm),
  })
  assert.equal(minimal.success, true, JSON.stringify(minimal.error?.issues))

  const full = postalSendTestSchema.safeParse({
    to: "customer@example.com",
    template: "order-placed",
    subject: "Postal smoke test",
    text: "Hello",
    html: "<p>Hello</p>",
    cc: ["boss@example.com"],
    bcc: ["audit@example.com"],
    from_name: "Shop",
    reply_to: "support@example.com",
    headers: { "X-Campaign": "smoke" },
    custom_args: { order_id: "order_1" },
    metadata: { source: "admin" },
    settings: toPostalSettingsPayload(pageForm),
  })
  assert.equal(full.success, true, JSON.stringify(full.error?.issues))
})

test("the strict schemas still reject what the page used to send", () => {
  assert.equal(
    postalSettingsSchema.safeParse({ action: "save", settings: pageForm }).success,
    false
  )
  assert.equal(
    postalSendTestSchema.safeParse({
      action: "test",
      settings: toPostalSettingsPayload(pageForm),
    }).success,
    false
  )
})

import test from "node:test"
import assert from "node:assert/strict"
import { postalSettingsSchema } from "./validators"

test("postal settings schema accepts only non-secret save fields", () => {
  const result = postalSettingsSchema.safeParse({
    action: "save",
    settings: {
      auth_type: "smtp-api",
      from: "sender@example.com",
      base_url: "https://postal.example.com",
      test_to: "test@example.com",
    },
  })

  assert.equal(result.success, true)
})

test("postal settings schema strictly rejects secrets and test actions", () => {
  assert.equal(
    postalSettingsSchema.safeParse({
      action: "save",
      settings: { api_key: "must-not-be-accepted" },
    }).success,
    false
  )
  assert.equal(
    postalSettingsSchema.safeParse({ action: "test", settings: {} }).success,
    false
  )
})

test("postal settings schema validates persisted URL and email formats", () => {
  assert.equal(
    postalSettingsSchema.safeParse({
      action: "save",
      settings: {
        from: "bad\r\naddress@example.com",
        base_url: "ftp://postal.example.com",
      },
    }).success,
    false
  )
})

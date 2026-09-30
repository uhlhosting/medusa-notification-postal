import test from "node:test"
import assert from "node:assert/strict"
import { postalSendTestSchema } from "./validators"

test("Postal test schema accepts workflow metadata values", () => {
  const result = postalSendTestSchema.safeParse({
    to: ["recipient@example.com"],
    subject: "Delivery test",
    metadata: { attempt: 2, preview: true },
  })

  assert.equal(result.success, true)
})

test("Postal test schema allows workflow recipient and content fallbacks", () => {
  assert.equal(postalSendTestSchema.safeParse({}).success, true)
})

test("Postal test schema rejects settings, actions, and malformed recipients", () => {
  assert.equal(
    postalSendTestSchema.safeParse({ settings: { from: "x@example.com" } })
      .success,
    false
  )
  assert.equal(
    postalSendTestSchema.safeParse({ action: "test" }).success,
    false
  )
  assert.equal(
    postalSendTestSchema.safeParse({ to: "bad\r\naddress@example.com" }).success,
    false
  )
})

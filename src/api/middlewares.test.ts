import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
import { authenticatePostalWebhook } from "./middlewares"

const originalWebhookToken = process.env.POSTAL_WEBHOOK_TOKEN

test.afterEach(() => {
  if (originalWebhookToken === undefined) {
    delete process.env.POSTAL_WEBHOOK_TOKEN
  } else {
    process.env.POSTAL_WEBHOOK_TOKEN = originalWebhookToken
  }
})

test("Postal webhook authentication accepts the exact token", () => {
  process.env.POSTAL_WEBHOOK_TOKEN = "test-webhook-token"
  let nextCalls = 0

  authenticatePostalWebhook(
    { params: { token: "test-webhook-token" } } as never,
    {} as never,
    () => {
      nextCalls++
    }
  )

  assert.equal(nextCalls, 1)
})

test("Postal webhook authentication rejects byte-length mismatches safely", () => {
  process.env.POSTAL_WEBHOOK_TOKEN = "aa"

  assert.throws(
    () =>
      authenticatePostalWebhook(
        { params: { token: "é" } } as never,
        {} as never,
        () => undefined
      ),
    MedusaError
  )
})

test("Postal webhook authentication rejects missing configuration", () => {
  delete process.env.POSTAL_WEBHOOK_TOKEN

  assert.throws(
    () =>
      authenticatePostalWebhook(
        { params: { token: "provided" } } as never,
        {} as never,
        () => undefined
      ),
    MedusaError
  )
})

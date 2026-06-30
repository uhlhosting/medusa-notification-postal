import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
import { PostalNotificationService } from "./postal"

const originalFetch = globalThis.fetch

test.beforeEach(() => {
  globalThis.fetch = undefined as never
})

test.after(() => {
  globalThis.fetch = originalFetch
})

test("validates options and builds a send payload", async () => {
  assert.doesNotThrow(() =>
    PostalNotificationService.validateOptions({
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
    })
  )

  const logger = { info: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined }
  const service = new PostalNotificationService(
    { logger },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )

  const fetchMock = (async () => ({
    ok: true,
    json: async () => ({
      status: "ok",
      data: {
        message_id: "msg_1",
        messages: {
          "user@example.com": {
            id: 99,
          },
        },
      },
    }),
  })) as unknown as typeof fetch

  globalThis.fetch = fetchMock

  const result = await service.send({
    to: [{ email: "user@example.com" }],
    provider_data: {
      subject: "Order confirmation",
      html: "<p>Thanks for your order</p>",
      custom_args: {
        order_id: "ord_1",
      },
    },
    template: "order-placed",
    attachments: [
      {
        filename: "invoice.pdf",
        content: "aGVsbG8=",
      },
      {
        filename: "",
        content: "ignored",
      },
    ],
  } as never)

  assert.deepEqual(result, { id: "99" })
})

test("wraps Postal API failures as Medusa errors", async () => {
  const logger = { info: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined }
  const service = new PostalNotificationService(
    { logger },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )

  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({
      status: "error",
      data: { message: "boom" },
    }),
  })) as unknown as typeof fetch

  await assert.rejects(() => service.getMessageDetails("123"), MedusaError)
})

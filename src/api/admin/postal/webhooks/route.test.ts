import test from "node:test"
import assert from "node:assert/strict"
import { GET } from "./route"

test("admin webhook route returns webhook events from the module service", async () => {
  let lastConfig: any
  const service = {
    listPostalWebhookEvents: async (_filter: any, config: any) => {
      lastConfig = config
      return [
        {
          id: "postal_webhook_1",
          event_type: "message.sent",
          status: "sent",
          message_id: "msg_1",
          recipient: "recipient@example.com",
          occurred_at: "2026-06-28T12:00:00.000Z",
          created_at: "2026-06-28T12:01:00.000Z",
          payload: {},
        },
      ]
    },
  }

  const req = {
    scope: { resolve: () => service },
    query: { limit: "500" },
  } as any

  const responseBody: any = {}
  const res = {
    status(code: number) {
      responseBody.status = code
      return {
        json(payload: any) {
          responseBody.payload = payload
          return payload
        },
      }
    },
  } as any

  await GET(req, res)

  assert.equal(responseBody.status, 200)
  // Limit is clamped to 100.
  assert.equal(lastConfig?.take, 100)
  assert.equal(responseBody.payload.events[0].id, "postal_webhook_1")
  assert.equal(responseBody.payload.events[0].status, "sent")
})

test("admin webhook route returns an empty list when the module is unavailable", async () => {
  const req = {
    scope: {
      resolve: () => {
        throw new Error("module not registered")
      },
    },
    query: {},
  } as any

  const responseBody: any = {}
  const res = {
    status(code: number) {
      responseBody.status = code
      return {
        json(payload: any) {
          responseBody.payload = payload
          return payload
        },
      }
    },
  } as any

  await GET(req, res)

  assert.equal(responseBody.status, 200)
  assert.deepEqual(responseBody.payload.events, [])
})

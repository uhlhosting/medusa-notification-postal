import test from "node:test"
import assert from "node:assert/strict"
import { POST } from "./route"

test("postal webhook route accepts a MessageSent payload and returns 202", async () => {
  const previousToken = process.env.POSTAL_WEBHOOK_TOKEN
  process.env.POSTAL_WEBHOOK_TOKEN = "f17a2062502dc152436874b100f488a260a65007599b02f8ea64d31df873e34e"

  try {
    const payload = {
      message: {
        id: 28638,
        token: "l0QZ6rBrTJNX9bTr",
        direction: "outgoing",
        message_id: "20260630171223.124694.63496@uhlhosting.ch",
        to: "cosmin@uhlhost.net",
        from: "sentry@uhlhosting.ch",
        subject:
          "[Sentry] PHP-CP-ALL-34 - ErrorException: Warning: Constant SAVEQUERIES already defined",
        timestamp: 1782839544.2800682,
        spam_status: "NotSpam",
        tag: null,
      },
      status: "Sent",
      details:
        "Message for cosmin@uhlhost.net accepted by 91.98.211.155:25 (mail.uhlhost.net)",
      output: "250 2.0.0 Ok: queued as AEE3E12055E",
      sent_with_ssl: true,
      timestamp: 1782839545.7319343,
      time: 0.11,
      event_type: "MessageSent",
    }

    const req = {
      params: {
        token:
          "f17a2062502dc152436874b100f488a260a65007599b02f8ea64d31df873e34e",
      },
      body: payload,
      scope: {},
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

    await POST(req, res)

    assert.equal(responseBody.status, 202)
    assert.equal(responseBody.payload.ok, true)
    assert.equal(responseBody.payload.status, "sent")
    assert.equal(responseBody.payload.event_type, "message.sent")
  } finally {
    if (previousToken === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previousToken
    }
  }
})

test("postal webhook route acknowledges the webhook when persistence fails", async () => {
  const previousToken = process.env.POSTAL_WEBHOOK_TOKEN
  process.env.POSTAL_WEBHOOK_TOKEN = "token_abc"

  try {
    const req = {
      params: { token: "token_abc" },
      body: {
        event_type: "MessageSent",
        status: "Sent",
        message: {
          message_id: "msg_123",
          to: "customer@uhlhost.net",
        },
      },
      scope: {
        resolve: () => ({
          raw: async () => {
            throw new Error("database unavailable")
          },
        }),
      },
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

    await POST(req, res)

    assert.equal(responseBody.status, 202)
    assert.equal(responseBody.payload.ok, true)
    assert.equal(responseBody.payload.status, "sent")
    assert.equal(responseBody.payload.event_type, "message.sent")
  } finally {
    if (previousToken === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previousToken
    }
  }
})

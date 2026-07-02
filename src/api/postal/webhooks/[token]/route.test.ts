import test from "node:test"
import assert from "node:assert/strict"
import { POST } from "./route"

const WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:"

test("postal webhook route accepts a MessageSent payload and returns 202", async () => {
  const previousToken = process.env.POSTAL_WEBHOOK_TOKEN
  process.env.POSTAL_WEBHOOK_TOKEN = "postal-webhook-token-test"

  try {
    const payload = {
      message: {
        id: 28638,
        token: "message-token-test",
        direction: "outgoing",
        message_id: "20260630171223.124694.63496@uhlhosting.ch",
        to: "cosmin@uhlhost.net",
        from: "sentry@uhlhosting.ch",
        subject:
          "[Sentry] PHP-CP-ALL-34 - ErrorException: Warning: Constant SAVEQUERIES already defined",
        timestamp: 1782839544.2800682,
        spam_status: "NotSpam",
        tag: `${WEBHOOK_TAG_PREFIX}order-placed`,
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
        token: "postal-webhook-token-test",
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
          tag: `${WEBHOOK_TAG_PREFIX}order-placed`,
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

test("postal webhook route ignores non-plugin webhook payloads", async () => {
  const previousToken = process.env.POSTAL_WEBHOOK_TOKEN
  process.env.POSTAL_WEBHOOK_TOKEN = "token_abc"

  try {
    const req = {
      params: { token: "token_abc" },
      body: {
        event_type: "MessageSent",
        status: "Sent",
        message: {
          message_id: "msg_external",
          to: "customer@uhlhost.net",
          tag: "external-app:order-placed",
        },
      },
      scope: {
        resolve: () => ({
          raw: async () => {
            throw new Error("should not be called")
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
    assert.equal(responseBody.payload.ignored, true)
    assert.equal(responseBody.payload.id, undefined)
  } finally {
    if (previousToken === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previousToken
    }
  }
})

test("postal webhook route ignores untagged sent messages", async () => {
  const previousToken = process.env.POSTAL_WEBHOOK_TOKEN
  process.env.POSTAL_WEBHOOK_TOKEN = "token_abc"

  try {
    const req = {
      params: { token: "token_abc" },
      body: {
        event_type: "MessageSent",
        status: "Sent",
        message: {
          message_id: "msg_untagged",
          to: "customer@uhlhost.net",
        },
      },
      scope: {
        resolve: () => ({
          raw: async () => {
            throw new Error("should not be called")
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
    assert.equal(responseBody.payload.ignored, true)
  } finally {
    if (previousToken === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previousToken
    }
  }
})

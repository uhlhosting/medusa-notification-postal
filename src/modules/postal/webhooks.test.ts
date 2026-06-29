import test from "node:test"
import assert from "node:assert/strict"
import {
  listPostalWebhookEvents,
  normalizePostalWebhookPayload,
  recordPostalWebhookEvent,
} from "./webhooks"

test("normalizePostalWebhookPayload maps Postal message delivery events", () => {
  const event = normalizePostalWebhookPayload({
    event_type: "MessageDelivered",
    status: "message_sent",
    message: {
      id: "msg_123",
      recipient: "customer@uhlhost.net",
      created_at: "2026-06-28T10:00:00Z",
    },
  })

  assert.equal(event.event_type, "MessageDelivered")
  assert.equal(event.status, "sent")
  assert.equal(event.message_id, "msg_123")
  assert.equal(event.recipient, "customer@uhlhost.net")
  assert.equal(event.occurred_at, "2026-06-28T10:00:00.000Z")
})

test("normalizePostalWebhookPayload falls back to nested message data", () => {
  const event = normalizePostalWebhookPayload({
    data: {
      message: {
        event: "MessageHeld",
        status: "held",
        id: "msg_held",
        to: "audit@highacid.com",
        occurred_at: "2026-06-28 11:30:00Z",
      },
    },
  })

  assert.equal(event.event_type, "message.held")
  assert.equal(event.status, "held")
  assert.equal(event.message_id, "msg_held")
  assert.equal(event.recipient, "audit@highacid.com")
  assert.equal(event.occurred_at, "2026-06-28T11:30:00.000Z")
})

test("normalizePostalWebhookPayload maps bounce and click style events", () => {
  const bounced = normalizePostalWebhookPayload({
    event: "MessageBounced",
    bounce: {
      message_id: "msg_bounced",
      recipient: "bounce@uhlhosting.ch",
      timestamp: "2026-06-28T12:15:00Z",
    },
  })

  const clicked = normalizePostalWebhookPayload({
    event_type: "MessageLinkClicked",
    url: "https://uhlhosting.ch",
    message: {
      id: "msg_clicked",
      to: "click@uhlhost.net",
      created_at: "2026-06-28T12:20:00Z",
    },
  })

  assert.equal(bounced.event_type, "message.bounced")
  assert.equal(bounced.status, "bounced")
  assert.equal(bounced.message_id, "msg_bounced")
  assert.equal(bounced.recipient, "bounce@uhlhosting.ch")
  assert.equal(bounced.occurred_at, "2026-06-28T12:15:00.000Z")

  assert.equal(clicked.event_type, "message.link_clicked")
  assert.equal(clicked.status, "clicked")
  assert.equal(clicked.message_id, "msg_clicked")
  assert.equal(clicked.recipient, "click@uhlhost.net")
})

test("normalizePostalWebhookPayload handles missing values safely", () => {
  const event = normalizePostalWebhookPayload({})

  assert.equal(event.event_type, "postal.webhook")
  assert.equal(event.status, "unknown")
  assert.equal(event.message_id, null)
  assert.equal(event.recipient, null)
  assert.equal(event.occurred_at, null)
})

test("normalizePostalWebhookPayload maps explicit delivery statuses", () => {
  const delayed = normalizePostalWebhookPayload({
    status: "message_delayed",
    message: { id: "msg_delayed" },
  })
  const failed = normalizePostalWebhookPayload({
    status: "error",
    message: { id: "msg_failed" },
  })
  const loaded = normalizePostalWebhookPayload({
    message_status: "loaded",
    message: {
      id: "msg_loaded",
      recipient: "loaded@uhlhosting.ch",
      user_agent: "Mozilla",
      created_at: "2026-06-28T12:30:00Z",
    },
  })
  const dnsError = normalizePostalWebhookPayload({
    delivery_status: "domain_dns_error",
    domain: "uhlhosting.ch",
  })

  assert.equal(delayed.status, "delayed")
  assert.equal(delayed.event_type, "message.delayed")
  assert.equal(failed.status, "failed")
  assert.equal(failed.event_type, "message.delivery_failed")
  assert.equal(loaded.status, "loaded")
  assert.equal(loaded.event_type, "message.loaded")
  assert.equal(dnsError.status, "dns_error")
  assert.equal(dnsError.event_type, "domain.dns_error")
})

test("normalizePostalWebhookPayload infers status from nested bounce and click payloads", () => {
  const bounced = normalizePostalWebhookPayload({
    bounce: {
      message_id: "msg_nested_bounced",
      recipient: "bounce@uhlhosting.ch",
    },
  })

  const clicked = normalizePostalWebhookPayload({
    url: "https://uhlhosting.ch",
    original_message: {
      message_id: "msg_nested_clicked",
      recipient: "click@uhlhosting.ch",
    },
  })

  assert.equal(bounced.status, "bounced")
  assert.equal(bounced.event_type, "message.bounced")
  assert.equal(clicked.status, "clicked")
  assert.equal(clicked.event_type, "message.link_clicked")
})

test("recordPostalWebhookEvent persists a normalized event", async () => {
  const calls: Array<{ sql: string; params?: unknown[] }> = []
  const pgConnection = {
    raw: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params })
      return { rows: [] }
    },
  }

  const event = await recordPostalWebhookEvent(pgConnection, {
    event: "message.sent",
    status: "sent",
    message: {
      id: "msg_recorded",
      recipient: "recipient@uhlhosting.ch",
      created_at: "2026-06-28T12:00:00Z",
    },
  })

  assert.equal(calls.length, 1)
  assert.match(calls[0]!.sql, /INSERT INTO postal_webhook_events/)
  assert.equal(event.status, "sent")
  assert.equal(event.message_id, "msg_recorded")
  assert.equal(event.recipient, "recipient@uhlhosting.ch")
})

test("recordPostalWebhookEvent returns event when pg connection is unavailable", async () => {
  const event = await recordPostalWebhookEvent(undefined, {
    status: "sent",
    message: {
      id: "msg_no_pg",
      recipient: "recipient@uhlhosting.ch",
    },
  })

  assert.equal(event.status, "sent")
  assert.equal(event.message_id, "msg_no_pg")
})

test("listPostalWebhookEvents returns normalized rows with limit bounds", async () => {
  const calls: Array<{ sql: string; params?: unknown[] }> = []
  const pgConnection = {
    raw: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params })
      return {
        rows: [
          {
            id: "postal_webhook_1",
            event_type: "message.sent",
            status: "sent",
            message_id: "msg_1",
            recipient: "recipient@uhlhosting.ch",
            occurred_at: "2026-06-28T12:00:00.000Z",
            created_at: "2026-06-28T12:01:00.000Z",
            payload: {},
          },
        ],
      }
    },
  }

  const rows = await listPostalWebhookEvents(pgConnection, 500)

  assert.equal(calls.length, 1)
  assert.match(calls[0]!.sql, /SELECT id, event_type, status, message_id, recipient, occurred_at, created_at, payload/)
  assert.deepEqual(calls[0]!.params, [100])
  assert.equal(rows[0]?.id, "postal_webhook_1")
  assert.equal(rows[0]?.status, "sent")
})

test("listPostalWebhookEvents returns an empty list when the query fails", async () => {
  const pgConnection = {
    raw: async () => {
      throw new Error("database unavailable")
    },
  }

  const rows = await listPostalWebhookEvents(pgConnection, Number.NaN)

  assert.deepEqual(rows, [])
})

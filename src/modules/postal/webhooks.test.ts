import test from "node:test"
import assert from "node:assert/strict"
import {
  listPostalWebhookEvents,
  isPostalWebhookFromPlugin,
  isPostalSentWebhookFromPlugin,
  normalizePostalWebhookPayload,
  recordPostalWebhookEvent,
} from "./webhooks"

test("normalizePostalWebhookPayload maps Postal message delivery events", () => {
  const event = normalizePostalWebhookPayload({
    event_type: "MessageDelivered",
    status: "message_sent",
    message: {
      id: "msg_123",
      recipient: "customer@example.com",
      created_at: "2026-06-28T10:00:00Z",
    },
  })

  assert.equal(event.event_type, "MessageDelivered")
  assert.equal(event.status, "sent")
  assert.equal(event.message_id, "msg_123")
  assert.equal(event.recipient, "customer@example.com")
  assert.equal(event.occurred_at, "2026-06-28T10:00:00.000Z")
})

test("isPostalWebhookFromPlugin only accepts plugin-tagged messages", () => {
  assert.equal(
    isPostalWebhookFromPlugin({
      message: {
        tag: "uhlhosting.medusa-notification-postal:order-placed",
      },
    }),
    true
  )

  assert.equal(
    isPostalWebhookFromPlugin({
      message: {
        tag: "order-placed",
      },
    }),
    false
  )

  assert.equal(isPostalWebhookFromPlugin({ message: {} }), false)
})

test("isPostalSentWebhookFromPlugin only accepts plugin-tagged sent message webhooks", () => {
  assert.equal(
    isPostalSentWebhookFromPlugin({
      event_type: "MessageSent",
      status: "Sent",
      message: {
        tag: "uhlhosting.medusa-notification-postal:order-placed",
      },
    }),
    true
  )

  assert.equal(
    isPostalSentWebhookFromPlugin({
      event_type: "MessageBounced",
      status: "Bounced",
      message: {
        tag: "uhlhosting.medusa-notification-postal:order-placed",
      },
    }),
    false
  )

  assert.equal(
    isPostalSentWebhookFromPlugin({
      event_type: "MessageSent",
      status: "Sent",
      message: {
        tag: "external-app:order-placed",
      },
    }),
    false
  )
})

test("normalizePostalWebhookPayload falls back to nested message data", () => {
  const event = normalizePostalWebhookPayload({
    data: {
      message: {
        event: "MessageHeld",
        status: "held",
        id: "msg_held",
        to: "audit@example.com",
        occurred_at: "2026-06-28 11:30:00Z",
      },
    },
  })

  assert.equal(event.event_type, "message.held")
  assert.equal(event.status, "held")
  assert.equal(event.message_id, "msg_held")
  assert.equal(event.recipient, "audit@example.com")
  assert.equal(event.occurred_at, "2026-06-28T11:30:00.000Z")
})

test("normalizePostalWebhookPayload maps bounce and click style events", () => {
  const bounced = normalizePostalWebhookPayload({
    event: "MessageBounced",
    bounce: {
      message_id: "msg_bounced",
      recipient: "bounce@example.com",
      timestamp: "2026-06-28T12:15:00Z",
    },
  })

  const clicked = normalizePostalWebhookPayload({
    event_type: "MessageLinkClicked",
    url: "https://example.com",
    message: {
      id: "msg_clicked",
      to: "click@example.com",
      created_at: "2026-06-28T12:20:00Z",
    },
  })

  assert.equal(bounced.event_type, "message.bounced")
  assert.equal(bounced.status, "bounced")
  assert.equal(bounced.message_id, "msg_bounced")
  assert.equal(bounced.recipient, "bounce@example.com")
  assert.equal(bounced.occurred_at, "2026-06-28T12:15:00.000Z")

  assert.equal(clicked.event_type, "message.link_clicked")
  assert.equal(clicked.status, "clicked")
  assert.equal(clicked.message_id, "msg_clicked")
  assert.equal(clicked.recipient, "click@example.com")
})

test("normalizePostalWebhookPayload handles missing values safely", () => {
  const event = normalizePostalWebhookPayload({})

  assert.equal(event.event_type, "postal.webhook")
  assert.equal(event.status, "unknown")
  assert.equal(event.message_id, null)
  assert.equal(event.recipient, null)
  assert.equal(event.occurred_at, null)
})

test("normalizePostalWebhookPayload handles explicit loaded and dns error event labels", () => {
  const loaded = normalizePostalWebhookPayload({
    event_type: "Message Loaded",
    message: {
      id: "msg_loaded_explicit",
      recipient: "loaded@example.com",
    },
    occurred_at: "not-a-date",
  })

  const dnsError = normalizePostalWebhookPayload({
    status: "domain_dns_error",
    domain: "example.com",
    dns_checked_at: "2026-06-28T12:00:00Z",
  })

  assert.equal(loaded.event_type, "message.loaded")
  assert.equal(loaded.status, "loaded")
  assert.equal(loaded.occurred_at, null)
  assert.equal(dnsError.event_type, "domain.dns_error")
  assert.equal(dnsError.status, "dns_error")
})

test("normalizePostalWebhookPayload covers explicit event aliases", () => {
  const deliveryFailed = normalizePostalWebhookPayload({
    status: "message.delivery.failed",
    message: {
      id: "msg_delivery_failed",
    },
  })

  const clicked = normalizePostalWebhookPayload({
    event_type: "message.link.clicked",
    url: "https://example.com",
    original_message: {
      id: "msg_clicked_alias",
      recipient: "alias@example.com",
    },
  })

  const blank = normalizePostalWebhookPayload({
    event: "   ",
  })

  assert.equal(deliveryFailed.event_type, "message.delivery_failed")
  assert.equal(deliveryFailed.status, "failed")
  assert.equal(clicked.event_type, "message.link_clicked")
  assert.equal(clicked.status, "clicked")
  assert.equal(blank.event_type, "postal.webhook")
  assert.equal(blank.status, "unknown")
})

test("normalizePostalWebhookPayload preserves unknown explicit labels and other status aliases", () => {
  const delayed = normalizePostalWebhookPayload({
    status: "message.delayed",
    message: {
      id: "msg_delayed",
    },
  })

  const custom = normalizePostalWebhookPayload({
    event_type: "Custom Event",
    status: "sent",
    message: {
      id: "msg_custom",
    },
  })

  assert.equal(delayed.event_type, "message.delayed")
  assert.equal(delayed.status, "delayed")
  assert.equal(custom.event_type, "Custom Event")
  assert.equal(custom.status, "sent")
})

test("normalizePostalWebhookPayload covers delayed aliases and explicit status fallbacks", () => {
  const delayed = normalizePostalWebhookPayload({
    event_type: "MessageDelayed",
    message: {
      id: "msg_delayed_alias",
    },
  })

  const delayedExact = normalizePostalWebhookPayload({
    event_type: "message.delayed",
    message: {
      id: "msg_delayed_exact",
    },
  })

  assert.equal(delayed.event_type, "message.delayed")
  assert.equal(delayedExact.event_type, "message.delayed")
})

test("normalizePostalWebhookPayload covers remaining delivery failed and domain aliases", () => {
  const deliveryFailed = normalizePostalWebhookPayload({
    event_type: "MessageDeliveryFailed",
    message: {
      id: "msg_delivery_failed_alias",
    },
  })

  const deliveryFailedExact = normalizePostalWebhookPayload({
    event_type: "message.deliveryfailed",
    message: {
      id: "msg_delivery_failed_exact",
    },
  })

  const dnsError = normalizePostalWebhookPayload({
    domain: "example.com",
    spf_status: "fail",
  })

  assert.equal(deliveryFailed.event_type, "message.delivery_failed")
  assert.equal(deliveryFailedExact.event_type, "message.delivery_failed")
  assert.equal(dnsError.event_type, "domain.dns_error")
  assert.equal(dnsError.status, "unknown")
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
      recipient: "loaded@example.com",
      user_agent: "Mozilla",
      created_at: "2026-06-28T12:30:00Z",
    },
  })
  const dnsError = normalizePostalWebhookPayload({
    delivery_status: "domain_dns_error",
    domain: "example.com",
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

test("normalizePostalWebhookPayload covers status aliases without explicit events", () => {
  const clicked = normalizePostalWebhookPayload({
    status: "clicked",
    message: {
      id: "msg_clicked_status",
      to: "click-status@example.com",
    },
  })

  const loaded = normalizePostalWebhookPayload({
    status: "loaded",
    message: {
      id: "msg_loaded_status",
      recipient: "load-status@example.com",
    },
  })

  const dnsError = normalizePostalWebhookPayload({
    status: "dns_error",
    domain: "example.com",
  })

  const unknown = normalizePostalWebhookPayload({
    status: "mystery",
  })

  assert.equal(clicked.event_type, "message.link_clicked")
  assert.equal(clicked.status, "clicked")
  assert.equal(loaded.event_type, "message.loaded")
  assert.equal(loaded.status, "loaded")
  assert.equal(dnsError.event_type, "domain.dns_error")
  assert.equal(dnsError.status, "dns_error")
  assert.equal(unknown.event_type, "postal.webhook")
  assert.equal(unknown.status, "unknown")
})

test("normalizePostalWebhookPayload covers remaining status aliases without explicit events", () => {
  const sent = normalizePostalWebhookPayload({
    status: "sent",
    message: { id: "msg_sent_status" },
  })

  const delayed = normalizePostalWebhookPayload({
    status: "delayed",
    message: { id: "msg_delayed_status" },
  })

  const failed = normalizePostalWebhookPayload({
    status: "failed",
    message: { id: "msg_failed_status" },
  })

  const held = normalizePostalWebhookPayload({
    status: "held",
    message: { id: "msg_held_status" },
  })

  const bounced = normalizePostalWebhookPayload({
    status: "bounced",
    message: { id: "msg_bounced_status" },
  })

  assert.equal(sent.event_type, "message.sent")
  assert.equal(delayed.event_type, "message.delayed")
  assert.equal(failed.event_type, "message.delivery_failed")
  assert.equal(held.event_type, "message.held")
  assert.equal(bounced.event_type, "message.bounced")
})

test("normalizePostalWebhookPayload covers remaining explicit event aliases", () => {
  const bouncedExact = normalizePostalWebhookPayload({
    event_type: "message.bounced",
    message: {
      id: "msg_bounced_exact",
      recipient: "bounce-exact@example.com",
    },
  })

  const loadedExact = normalizePostalWebhookPayload({
    event_type: "message.loaded",
  })

  const clickedExact = normalizePostalWebhookPayload({
    event_type: "message.link.clicked",
    message: {
      id: "msg_clicked_exact",
      recipient: "clicked-exact@example.com",
    },
  })

  const loaded = normalizePostalWebhookPayload({
    event_type: "MessageLoaded",
    message: {
      id: "msg_loaded_alias",
      recipient: "loaded-alias@example.com",
      created_at: "2026-06-28T13:00:00Z",
    },
  })

  const dnsError = normalizePostalWebhookPayload({
    event_type: "DomainDnsError",
    domain: "example.com",
  })

  const held = normalizePostalWebhookPayload({
    event_type: "MessageHeld",
    message: {
      id: "msg_held_alias",
      recipient: "held-alias@example.com",
    },
  })

  assert.equal(bouncedExact.event_type, "message.bounced")
  assert.equal(bouncedExact.status, "bounced")
  assert.equal(loadedExact.event_type, "message.loaded")
  assert.equal(loadedExact.status, "loaded")
  assert.equal(clickedExact.event_type, "message.link_clicked")
  assert.equal(clickedExact.status, "clicked")
  assert.equal(loaded.event_type, "message.loaded")
  assert.equal(loaded.status, "loaded")
  assert.equal(loaded.recipient, "loaded-alias@example.com")
  assert.equal(dnsError.event_type, "domain.dns_error")
  assert.equal(dnsError.status, "unknown")
  assert.equal(held.event_type, "message.held")
  assert.equal(held.status, "held")
})

test("normalizePostalWebhookPayload infers status from nested bounce and click payloads", () => {
  const bounced = normalizePostalWebhookPayload({
    bounce: {
      message_id: "msg_nested_bounced",
      recipient: "bounce@example.com",
    },
  })

  const clicked = normalizePostalWebhookPayload({
    url: "https://example.com",
    original_message: {
      message_id: "msg_nested_clicked",
      recipient: "click@example.com",
    },
  })

  assert.equal(bounced.status, "bounced")
  assert.equal(bounced.event_type, "message.bounced")
  assert.equal(clicked.status, "clicked")
  assert.equal(clicked.event_type, "message.link_clicked")
})

test("normalizePostalWebhookPayload falls back to the generic webhook label for partial payloads", () => {
  const urlOnly = normalizePostalWebhookPayload({
    url: "https://example.com",
  })

  const loaded = normalizePostalWebhookPayload({
    ip_address: "203.0.113.10",
    user_agent: "Mozilla/5.0",
    message: {
      id: "msg_loaded_inferred",
      recipient: "loaded-inferred@example.com",
    },
  })

  assert.equal(urlOnly.event_type, "postal.webhook")
  assert.equal(urlOnly.status, "unknown")
  assert.equal(loaded.event_type, "message.loaded")
  assert.equal(loaded.status, "loaded")
})

type FakeWebhookServiceOpts = {
  seed?: Array<Record<string, unknown>>
  throwOnCreate?: boolean
  throwOnList?: boolean
}

const createFakeWebhookService = (opts: FakeWebhookServiceOpts = {}): any => {
  const rows: Array<Record<string, any>> = [...(opts.seed || [])]
  const created: Array<Record<string, unknown>> = []
  let lastListConfig: Record<string, unknown> | undefined
  return {
    rows,
    created,
    get lastListConfig() {
      return lastListConfig
    },
    listPostalWebhookEvents: async (
      filter: Record<string, any> = {},
      config: Record<string, unknown> = {}
    ) => {
      if (opts.throwOnList) throw new Error("database unavailable")
      lastListConfig = config
      let out = rows
      if (filter && filter.message_id) {
        out = out.filter(
          (r) =>
            r.message_id === filter.message_id &&
            (filter.event_type === undefined || r.event_type === filter.event_type)
        )
      }
      const take = config?.take as number | undefined
      return (typeof take === "number" ? out.slice(0, take) : out) as any
    },
    createPostalWebhookEvents: async (data: Record<string, unknown>) => {
      if (opts.throwOnCreate) throw new Error("database unavailable")
      created.push(data)
      rows.push(data)
      return data
    },
  }
}

test("recordPostalWebhookEvent persists a normalized event via the module service", async () => {
  const service = createFakeWebhookService()

  const event = await recordPostalWebhookEvent(service, {
    event: "message.sent",
    status: "sent",
    message: {
      id: "msg_recorded",
      recipient: "recipient@example.com",
      created_at: "2026-06-28T12:00:00Z",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  })

  assert.equal(service.created.length, 1)
  assert.equal(service.created[0]!.message_id, "msg_recorded")
  assert.equal(service.created[0]!.status, "sent")
  assert.notEqual(event, null)
  const recorded = event as NonNullable<typeof event>
  assert.equal(recorded.status, "sent")
  assert.equal(recorded.message_id, "msg_recorded")
  assert.equal(recorded.recipient, "recipient@example.com")
})

test("recordPostalWebhookEvent is idempotent for a replayed message + event type", async () => {
  const service = createFakeWebhookService({
    seed: [
      {
        id: "postal_webhook_existing",
        event_type: "message.sent",
        status: "sent",
        message_id: "msg_dup",
        recipient: "recipient@example.com",
      },
    ],
  })

  const event = await recordPostalWebhookEvent(service, {
    event: "message.sent",
    status: "sent",
    message: {
      id: "msg_dup",
      recipient: "recipient@example.com",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  })

  // No new row created; the existing record is returned.
  assert.equal(service.created.length, 0)
  assert.equal((event as NonNullable<typeof event>).id, "postal_webhook_existing")
})

test("recordPostalWebhookEvent ignores non-plugin messages", async () => {
  const service = createFakeWebhookService()

  const event = await recordPostalWebhookEvent(service, {
    event: "message.sent",
    status: "sent",
    message: {
      id: "msg_other",
      recipient: "recipient@example.com",
      tag: "external-app:order-placed",
    },
  })

  assert.equal(event, null)
  assert.equal(service.created.length, 0)
})

test("recordPostalWebhookEvent ignores plugin-tagged non-sent messages", async () => {
  const service = createFakeWebhookService()

  const event = await recordPostalWebhookEvent(service, {
    event: "message.bounced",
    status: "bounced",
    message: {
      id: "msg_bounced",
      recipient: "recipient@example.com",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  })

  assert.equal(event, null)
  assert.equal(service.created.length, 0)
})

test("recordPostalWebhookEvent returns event when the service is unavailable", async () => {
  const event = await recordPostalWebhookEvent(null, {
    message: {
      tag: "uhlhosting.medusa-notification-postal:postal-test",
      id: "msg_no_service",
      recipient: "recipient@example.com",
    },
    status: "sent",
  })

  assert.notEqual(event, null)
  const recorded = event as NonNullable<typeof event>
  assert.equal(recorded.status, "sent")
  assert.equal(recorded.message_id, "msg_no_service")
})

test("recordPostalWebhookEvent returns event when persistence fails", async () => {
  const service = createFakeWebhookService({ throwOnCreate: true })

  const event = await recordPostalWebhookEvent(service, {
    event_type: "MessageSent",
    status: "Sent",
    message: {
      message_id: "msg_failed_write",
      recipient: "recipient@example.com",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  })

  assert.notEqual(event, null)
  const recorded = event as NonNullable<typeof event>
  assert.equal(recorded.event_type, "message.sent")
  assert.equal(recorded.status, "sent")
  assert.equal(recorded.message_id, "msg_failed_write")
  assert.equal(recorded.recipient, "recipient@example.com")
})

test("listPostalWebhookEvents returns rows with clamped limit bounds", async () => {
  const service = createFakeWebhookService({
    seed: [
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
    ],
  })

  const rows = await listPostalWebhookEvents(service, 500)

  assert.equal(service.lastListConfig?.take, 100)
  assert.deepEqual(service.lastListConfig?.order, { created_at: "DESC" })
  assert.equal(rows[0]?.id, "postal_webhook_1")
  assert.equal(rows[0]?.status, "sent")
})

test("listPostalWebhookEvents returns an empty list when the query fails", async () => {
  const service = createFakeWebhookService({ throwOnList: true })

  const rows = await listPostalWebhookEvents(service, Number.NaN)

  assert.deepEqual(rows, [])
})

test("listPostalWebhookEvents returns an empty list when no service is available", async () => {
  const rows = await listPostalWebhookEvents(null, 25)

  assert.deepEqual(rows, [])
})

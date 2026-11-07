import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
import {
  listPostalWebhookEvents,
  isPostalWebhookFromPlugin,
  isPostalSentWebhookFromPlugin,
  normalizePostalWebhookPayload,
  readPostalWebhookDeliveryUuid,
  recordPostalWebhookEvent,
  recordPostalWebhookEventOutcome,
  unwrapPostalWebhookEnvelope,
  POSTAL_WEBHOOK_TAG_PREFIX,
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
  assert.equal(bounced.occurred_at, "2026-06-28T12:15:00.000Z")

  assert.equal(clicked.event_type, "message.link_clicked")
  assert.equal(clicked.status, "clicked")
  assert.equal(clicked.message_id, "msg_clicked")
})

test("normalizePostalWebhookPayload handles missing values safely", () => {
  const event = normalizePostalWebhookPayload({})

  assert.equal(event.event_type, "postal.webhook")
  assert.equal(event.status, "unknown")
  assert.equal(event.message_id, null)
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
      if (filter && filter.id) {
        out = out.filter((r) => r.id === filter.id)
      }
      const take = config?.take as number | undefined
      return (typeof take === "number" ? out.slice(0, take) : out) as any
    },
    createPostalWebhookEvents: async (data: Record<string, unknown>) => {
      if (opts.throwOnCreate) throw new Error("database unavailable")
      // Mirrors Medusa's dbErrorMapper: a primary-key violation surfaces as
      // a MedusaError with no pg code attached.
      if (rows.some((r) => r.id === data.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Postal webhook events with id: ${String(data.id)}, already exists.`
        )
      }
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
  assert.equal("recipient" in recorded, false)
  assert.deepEqual(service.created[0]!.payload, {})
})

test("recordPostalWebhookEvent records a bare event hash without a delivery uuid each time", async () => {
  const service = createFakeWebhookService()
  const bare = {
    event: "message.sent",
    status: "sent",
    message: {
      id: "msg_dup",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  }

  await recordPostalWebhookEvent(service, bare)
  await recordPostalWebhookEvent(service, bare)

  // Without Postal's envelope uuid there is no delivery identity to dedupe on.
  assert.equal(service.created.length, 2)
  assert.notEqual(service.created[0]!.id, service.created[1]!.id)
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

test("recordPostalWebhookEvent persists plugin-tagged non-sent messages", async () => {
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

  assert.notEqual(event, null)
  assert.equal(service.created.length, 1)
})

test("recordPostalWebhookEvent fails when persistence is unavailable", async () => {
  await assert.rejects(
    recordPostalWebhookEvent(null, {
      message: {
        tag: "uhlhosting.medusa-notification-postal:postal-test",
        id: "msg_no_service",
        recipient: "recipient@example.com",
      },
      status: "sent",
    }),
    /persistence is unavailable/
  )
})

test("recordPostalWebhookEvent ignores unrecognized lifecycle events", async () => {
  const service = createFakeWebhookService()
  const event = await recordPostalWebhookEvent(service, {
    event: "message.unrecognized",
    message: {
      id: "msg_unknown",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  })

  assert.equal(event, null)
  assert.equal(service.created.length, 0)
})

test("recordPostalWebhookEvent throws when persistence fails", async () => {
  const service = createFakeWebhookService({ throwOnCreate: true })

  await assert.rejects(
    recordPostalWebhookEvent(service, {
      event_type: "MessageSent",
      status: "Sent",
      message: {
        message_id: "msg_failed_write",
        recipient: "recipient@example.com",
        tag: "uhlhosting.medusa-notification-postal:postal-test",
      },
    }),
    /database unavailable/
  )
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

// Postal POSTs every webhook as { event, timestamp, payload, uuid }; the event's
// own fields live in the inner `payload`.
const postalEnvelope = (
  event: string,
  inner: Record<string, unknown>
): Record<string, unknown> => ({
  event,
  timestamp: 1782839999.5,
  payload: inner,
  uuid: "9d1f4c1e-0000-4000-8000-000000000001",
})

const taggedMessage = {
  id: 28638,
  token: "abc",
  direction: "outgoing",
  message_id: "20260630171223.124694.63496@example.com",
  to: "customer@example.com",
  from: "shop@example.com",
  subject: "Order confirmation",
  timestamp: 1782839544.28,
  spam_status: "NotSpam",
  tag: `${POSTAL_WEBHOOK_TAG_PREFIX}order-placed`,
}

test("unwrapPostalWebhookEnvelope exposes the inner fields and keeps the event name", () => {
  const unwrapped = unwrapPostalWebhookEnvelope(
    postalEnvelope("MessageSent", { message: taggedMessage, status: "Sent" })
  )

  assert.equal(unwrapped.event, "MessageSent")
  assert.equal(unwrapped.status, "Sent")
  assert.deepEqual(unwrapped.message, taggedMessage)
})

test("unwrapPostalWebhookEnvelope prefers the event's own timestamp over the delivery timestamp", () => {
  const withInner = unwrapPostalWebhookEnvelope(
    postalEnvelope("MessageSent", { status: "Sent", timestamp: 1000.5 })
  )
  const withoutInner = unwrapPostalWebhookEnvelope(
    postalEnvelope("MessageHeld", { status: "Held" })
  )

  assert.equal(withInner.timestamp, 1000.5)
  assert.equal(withoutInner.timestamp, 1782839999.5)
})

test("unwrapPostalWebhookEnvelope leaves bare payloads and non-envelopes unchanged", () => {
  const bare = { message: taggedMessage, status: "Sent" }
  const payloadKeyOnly = { payload: { message: taggedMessage }, status: "Sent" }
  const arrayPayload = { event: "MessageSent", payload: [1, 2] }

  assert.equal(unwrapPostalWebhookEnvelope(bare), bare)
  assert.equal(unwrapPostalWebhookEnvelope(payloadKeyOnly), payloadKeyOnly)
  assert.equal(unwrapPostalWebhookEnvelope(arrayPayload), arrayPayload)
})

test("a real Postal envelope is recognised as plugin mail only when its message is tagged", () => {
  const tagged = postalEnvelope("MessageSent", { message: taggedMessage, status: "Sent" })
  const untagged = postalEnvelope("MessageSent", {
    message: { ...taggedMessage, tag: "someone-elses-app" },
    status: "Sent",
  })

  assert.equal(isPostalWebhookFromPlugin(tagged), true)
  assert.equal(isPostalSentWebhookFromPlugin(tagged), true)
  assert.equal(isPostalWebhookFromPlugin(untagged), false)
})

test("normalizePostalWebhookPayload reads a real MessageSent envelope without retaining its body", () => {
  const body = postalEnvelope("MessageSent", {
    message: taggedMessage,
    status: "Sent",
    details: "accepted",
    timestamp: 1782839545.73,
  })

  const event = normalizePostalWebhookPayload(body)

  assert.equal(event.event_type, "message.sent")
  assert.equal(event.status, "sent")
  assert.equal(event.message_id, String(taggedMessage.id))
  assert.equal(event.occurred_at, new Date(1782839545.73 * 1000).toISOString())
  assert.equal("payload" in event, false)
})

test("normalizePostalWebhookPayload maps Postal's HardFail and SoftFail statuses", () => {
  const failed = normalizePostalWebhookPayload(
    postalEnvelope("MessageDeliveryFailed", {
      message: taggedMessage,
      status: "HardFail",
      details: "550 no such user",
    })
  )
  const delayed = normalizePostalWebhookPayload(
    postalEnvelope("MessageDelayed", {
      message: taggedMessage,
      status: "SoftFail",
      details: "mailbox busy",
    })
  )

  assert.equal(failed.event_type, "message.delivery_failed")
  assert.equal(failed.status, "failed")
  assert.equal(delayed.event_type, "message.delayed")
  assert.equal(delayed.status, "delayed")
})

test("recordPostalWebhookEvent persists a real envelope instead of ignoring it", async () => {
  const service = createFakeWebhookService()
  const body = postalEnvelope("MessageSent", {
    message: taggedMessage,
    status: "Sent",
    timestamp: 1782839545.73,
  })

  const event = await recordPostalWebhookEvent(service, body)

  assert.ok(event)
  assert.equal(service.created.length, 1)
  assert.equal(service.created[0].status, "sent")
  assert.equal(service.created[0].message_id, String(taggedMessage.id))
  assert.deepEqual(service.created[0].payload, {})
})

test("recordPostalWebhookEvent still ignores a real envelope for mail this plugin did not send", async () => {
  const service = createFakeWebhookService()

  const event = await recordPostalWebhookEvent(
    service,
    postalEnvelope("MessageSent", {
      message: { ...taggedMessage, tag: "someone-elses-app" },
      status: "Sent",
    })
  )

  assert.equal(event, null)
  assert.equal(service.created.length, 0)
})

test("normalizePostalWebhookPayload reads Postal's float epoch seconds and drops out-of-range values", () => {
  const seconds = normalizePostalWebhookPayload({
    event: "MessageSent",
    message: taggedMessage,
    status: "Sent",
    timestamp: 1782839545.73,
  })
  const milliseconds = normalizePostalWebhookPayload({
    event: "MessageSent",
    message: taggedMessage,
    status: "Sent",
    timestamp: 1782839545730,
  })

  assert.equal(seconds.occurred_at, "2026-06-30T17:12:25.730Z")
  assert.equal(milliseconds.occurred_at, null)
})

test("recordPostalWebhookEvent drops engagement callbacks when told to ignore them", async () => {
  const service = createFakeWebhookService()
  const tag = "uhlhosting.medusa-notification-postal:order-placed"

  for (const [event, status] of [
    ["message.link_clicked", "clicked"],
    ["MessageLoaded", "loaded"],
  ]) {
    const recorded = await recordPostalWebhookEvent(
      service,
      {
        event,
        status,
        message: { id: `msg_${status}`, recipient: "r@example.com", tag },
      },
      { ignoreEngagement: true }
    )
    assert.equal(recorded, null, status)
  }
  assert.equal(service.created.length, 0)

  // Delivery outcomes are still recorded with the option on.
  const bounced = await recordPostalWebhookEvent(
    service,
    {
      event: "message.bounced",
      status: "bounced",
      message: { id: "msg_bounce", recipient: "r@example.com", tag },
    },
    { ignoreEngagement: true }
  )
  assert.notEqual(bounced, null)
  assert.equal(service.created.length, 1)
})

test("recordPostalWebhookEvent keeps recording engagement callbacks by default", async () => {
  const service = createFakeWebhookService()

  const recorded = await recordPostalWebhookEvent(service, {
    event: "message.link_clicked",
    status: "clicked",
    message: {
      id: "msg_click",
      recipient: "r@example.com",
      tag: "uhlhosting.medusa-notification-postal:order-placed",
    },
  })

  assert.equal(recorded?.status, "clicked")
  assert.equal(service.created.length, 1)
})

const DELIVERY_UUID = "9d1f4c1e-0000-4000-8000-000000000001"

const envelopeWithUuid = (
  event: string,
  inner: Record<string, unknown>,
  uuid: string
) => ({ event, timestamp: 1782839999.5, payload: inner, uuid })

test("readPostalWebhookDeliveryUuid accepts only a UUID and lowercases it", () => {
  assert.equal(
    readPostalWebhookDeliveryUuid({ uuid: DELIVERY_UUID.toUpperCase() }),
    DELIVERY_UUID
  )
  assert.equal(readPostalWebhookDeliveryUuid({ uuid: "not-a-uuid" }), null)
  assert.equal(readPostalWebhookDeliveryUuid({ uuid: 42 }), null)
  assert.equal(readPostalWebhookDeliveryUuid({}), null)
})

test("normalizePostalWebhookPayload derives the row id from the delivery uuid", () => {
  const event = normalizePostalWebhookPayload(
    envelopeWithUuid("MessageSent", { message: taggedMessage, status: "Sent" }, DELIVERY_UUID)
  )

  assert.equal(event.id, `postal_webhook_${DELIVERY_UUID}`)
})

test("normalizePostalWebhookPayload correlates a bounce through original_message.id", () => {
  const event = normalizePostalWebhookPayload(
    envelopeWithUuid(
      "MessageBounced",
      {
        original_message: taggedMessage,
        bounce: { ...taggedMessage, id: 99001, message_id: "bounce@example.com" },
      },
      DELIVERY_UUID
    )
  )

  assert.equal(event.status, "bounced")
  assert.equal(event.message_id, String(taggedMessage.id))
})

test("recordPostalWebhookEventOutcome treats a Postal retry of one delivery as a replay", async () => {
  const service = createFakeWebhookService()
  const body = envelopeWithUuid(
    "MessageSent",
    { message: taggedMessage, status: "Sent" },
    DELIVERY_UUID
  )

  const first = await recordPostalWebhookEventOutcome(service, body)
  const retry = await recordPostalWebhookEventOutcome(service, body)

  assert.equal(first?.created, true)
  assert.equal(retry?.created, false)
  assert.equal(retry?.record.id, first?.record.id)
  assert.equal(service.created.length, 1)
})

test("recordPostalWebhookEventOutcome resolves a concurrent insert of the same delivery by re-reading the id", async () => {
  const service = createFakeWebhookService()
  const body = envelopeWithUuid(
    "MessageSent",
    { message: taggedMessage, status: "Sent" },
    DELIVERY_UUID
  )
  // The pre-insert lookup misses, then a concurrent request wins the insert.
  const listPostalWebhookEvents = service.listPostalWebhookEvents
  let lookups = 0
  service.listPostalWebhookEvents = async (...args: unknown[]) => {
    lookups += 1
    if (lookups === 1) {
      service.rows.push({ id: `postal_webhook_${DELIVERY_UUID}`, status: "sent" })
      return []
    }
    return listPostalWebhookEvents(...args)
  }

  const outcome = await recordPostalWebhookEventOutcome(service, body)

  assert.equal(outcome?.created, false)
  assert.equal(outcome?.record.id, `postal_webhook_${DELIVERY_UUID}`)
  assert.equal(service.created.length, 0)
})

test("recordPostalWebhookEventOutcome rethrows a database error that is not a replay", async () => {
  const service = createFakeWebhookService({ throwOnCreate: true })

  await assert.rejects(
    recordPostalWebhookEventOutcome(
      service,
      envelopeWithUuid("MessageSent", { message: taggedMessage, status: "Sent" }, DELIVERY_UUID)
    ),
    /database unavailable/
  )
})

test("recordPostalWebhookEventOutcome keeps repeated opens, clicks and delays of one message", async () => {
  for (const [event, inner] of [
    ["MessageLoaded", { message: taggedMessage, ip_address: "192.0.2.1" }],
    ["MessageLinkClicked", { message: taggedMessage, url: "https://example.com/" }],
    ["MessageDelayed", { message: taggedMessage, status: "SoftFail" }],
  ] as const) {
    const service = createFakeWebhookService()

    const first = await recordPostalWebhookEventOutcome(
      service,
      envelopeWithUuid(event, inner, "9d1f4c1e-0000-4000-8000-00000000000a")
    )
    const second = await recordPostalWebhookEventOutcome(
      service,
      envelopeWithUuid(event, inner, "9d1f4c1e-0000-4000-8000-00000000000b")
    )

    assert.equal(first?.created, true, event)
    assert.equal(second?.created, true, event)
    assert.equal(service.created.length, 2, event)
  }
})

test("recordPostalWebhookEventOutcome records to and bcc copies that share one RFC Message-ID", async () => {
  const service = createFakeWebhookService()

  await recordPostalWebhookEventOutcome(
    service,
    envelopeWithUuid(
      "MessageSent",
      { message: taggedMessage, status: "Sent" },
      "9d1f4c1e-0000-4000-8000-00000000000c"
    )
  )
  await recordPostalWebhookEventOutcome(
    service,
    envelopeWithUuid(
      "MessageSent",
      { message: { ...taggedMessage, id: 28639, to: "archive@example.com" }, status: "Sent" },
      "9d1f4c1e-0000-4000-8000-00000000000d"
    )
  )

  assert.deepEqual(
    service.created.map((row: Record<string, unknown>) => row.message_id),
    ["28638", "28639"]
  )
})

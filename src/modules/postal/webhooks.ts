import { randomUUID } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export type PostalWebhookStatus =
  | "sent"
  | "delayed"
  | "failed"
  | "held"
  | "bounced"
  | "clicked"
  | "loaded"
  | "dns_error"
  | "unknown"

export type PostalWebhookRecord = {
  id: string
  event_type: string
  status: PostalWebhookStatus
  message_id: string | null
  recipient: string | null
  occurred_at: string | null
  payload: Record<string, unknown>
  created_at?: string
}

export const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:"

const isPostgresUniqueViolation = (error: unknown): boolean => {
  const visited = new Set<unknown>()
  let current = error

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current)
    const record = current as Record<string, unknown>
    if (record.code === "23505") {
      return true
    }
    current = record.cause || record.driverException || record.parent
  }

  return false
}

// Minimal shape of the generated module service methods this file relies on.
export type PostalWebhookEventService = {
  listPostalWebhookEvents: (
    filter?: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<PostalWebhookRecord[]>
  createPostalWebhookEvents: (
    data: Record<string, unknown> | Record<string, unknown>[]
  ) => Promise<unknown>
}

const sanitizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = sanitizeString(value)
    if (normalized) {
      return normalized
    }
  }

  return ""
}

const pickNestedTag = (value: unknown) =>
  value && typeof value === "object"
    ? pickString((value as Record<string, unknown>).tag)
    : ""

// Postal POSTs every webhook as { event, timestamp, payload, uuid } and the
// event's own fields (message, status, ...) live in the inner `payload`. The
// tag check and the normalizer read those fields, so unwrap the envelope first.
// A body without that shape (a bare event hash) is returned unchanged.
export const unwrapPostalWebhookEnvelope = (
  body: Record<string, unknown>
): Record<string, unknown> => {
  const inner = body.payload
  if (
    typeof body.event === "string" &&
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner)
  ) {
    const fields = inner as Record<string, unknown>
    return {
      ...fields,
      event: body.event,
      timestamp: fields.timestamp ?? body.timestamp,
    }
  }

  return body
}

const extractPostalWebhookTag = (body: Record<string, unknown>) => {
  const payload = unwrapPostalWebhookEnvelope(body)

  return pickString(
    payload.tag,
    pickNestedTag(payload.message),
    pickNestedTag(payload.original_message),
    pickNestedTag(payload.data),
    pickNestedTag(
      (payload.data as Record<string, unknown> | undefined)?.message
    )
  )
}

export const isPostalWebhookFromPlugin = (payload: Record<string, unknown>) =>
  extractPostalWebhookTag(payload).startsWith(POSTAL_WEBHOOK_TAG_PREFIX)

export const isPostalSentWebhookFromPlugin = (payload: Record<string, unknown>) => {
  if (!isPostalWebhookFromPlugin(payload)) {
    return false
  }

  return normalizePostalWebhookPayload(payload).status === "sent"
}

const normalizeStatus = (value: string): PostalWebhookStatus => {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "")

  switch (normalized) {
    case "messagesent":
    case "message.sent":
    case "sent":
      return "sent"
    case "messagedelayed":
    case "message.delayed":
    case "delayed":
    case "softfail":
      return "delayed"
    case "messagedeliveryfailed":
    case "message.delivery.failed":
    case "message.deliveryfailed":
    case "deliveryfailed":
    case "failed":
    case "hardfail":
    case "error":
      return "failed"
    case "messageheld":
    case "message.held":
    case "held":
      return "held"
    case "messagebounced":
    case "message.bounced":
    case "bounced":
      return "bounced"
    case "messagelinkclicked":
    case "message.linkclicked":
    case "message.link.clicked":
    case "clicked":
      return "clicked"
    case "messageloaded":
    case "message.loaded":
    case "loaded":
      return "loaded"
    case "domaindnserror":
    case "domain.dns.error":
    case "domain.dns_error":
    case "domain_dnserror":
    case "dnserror":
      return "dns_error"
    default:
      return "unknown"
  }
}

const normalizeEventType = (value: string) => {
  const normalized = value.trim()
  const collapsed = normalized.toLowerCase().replace(/[\s_]+/g, ".")
  switch (collapsed.replace(/[^a-z.]/g, "")) {
    case "messagesent":
    case "message.sent":
      return "message.sent"
    case "messagedelayed":
    case "message.delayed":
      return "message.delayed"
    case "messagedeliveryfailed":
    case "message.delivery.failed":
    case "message.deliveryfailed":
      return "message.delivery_failed"
    case "messageheld":
    case "message.held":
      return "message.held"
    case "messagebounced":
    case "message.bounced":
      return "message.bounced"
    case "messagelinkclicked":
    case "message.link.clicked":
      return "message.link_clicked"
    case "messageloaded":
    case "message.loaded":
      return "message.loaded"
    case "domaindnserror":
    case "domain.dns.error":
    case "domain.dns_error":
    case "domain_dnserror":
      return "domain.dns_error"
    default:
      return normalized
  }
}

const inferEventTypeFromPayload = (
  payload: Record<string, unknown>,
  status: PostalWebhookStatus
) => {
  const explicitEvent = pickString(
    payload.event,
    payload.event_type,
    payload.type,
    payload.name
  )

  if (explicitEvent) {
    return normalizeEventType(explicitEvent)
  }

  if (status !== "unknown") {
    switch (status) {
      case "sent":
        return "message.sent"
      case "delayed":
        return "message.delayed"
      case "failed":
        return "message.delivery_failed"
      case "held":
        return "message.held"
      case "bounced":
        return "message.bounced"
      case "clicked":
        return "message.link_clicked"
      case "loaded":
        return "message.loaded"
      case "dns_error":
        return "domain.dns_error"
    }
  }

  if (payload.bounce || (payload.original_message && payload.bounce)) {
    return "message.bounced"
  }

  if (payload.url && (payload.message || payload.original_message)) {
    return "message.link_clicked"
  }

  if (
    (payload.ip_address || payload.user_agent) &&
    (payload.message || payload.original_message) &&
    !payload.url
  ) {
    return "message.loaded"
  }

  if (
    payload.domain ||
    payload.dns_checked_at ||
    payload.spf_status ||
    payload.dkim_status ||
    payload.mx_status ||
    payload.return_path_status
  ) {
    return "domain.dns_error"
  }

  return "postal.webhook"
}

// Postgres rejects years outside 1..9999, and toISOString prints anything
// beyond that as "+058465-..." (a millisecond epoch read as seconds, say).
const toIsoTimestamp = (date: Date) => {
  const year = date.getUTCFullYear()

  return Number.isNaN(date.getTime()) || year < 1 || year > 9999
    ? null
    : date.toISOString()
}

const normalizeOccurredAt = (value: unknown) => {
  // Postal sends timestamps as float seconds since the epoch.
  if (typeof value === "number") {
    return Number.isFinite(value) ? toIsoTimestamp(new Date(value * 1000)) : null
  }

  const normalized = sanitizeString(value)
  if (!normalized) {
    return null
  }

  return toIsoTimestamp(new Date(normalized))
}

export const normalizePostalWebhookPayload = (
  body: Record<string, unknown>
): PostalWebhookRecord => {
  const payload = unwrapPostalWebhookEnvelope(body)
  const originalMessage = (
    payload.original_message ||
    payload.message ||
    (payload.data as Record<string, unknown> | undefined)?.message ||
    payload.data ||
    {}
  ) as Record<string, unknown>
  const nestedMessage = (
    payload.bounce ||
    payload.message ||
    (payload.data as Record<string, unknown> | undefined)?.message ||
    payload.data ||
    {}
  ) as Record<string, unknown>
  const rawStatus = pickString(
    payload.status,
    payload.message_status,
    payload.delivery_status,
    originalMessage.status,
    nestedMessage.status
  )
  const eventType = inferEventTypeFromPayload(
    payload,
    normalizeStatus(rawStatus)
  )
  const status = normalizeStatus(rawStatus || eventType)
  const messageId = pickString(
    originalMessage.id,
    originalMessage.message_id,
    nestedMessage.id,
    nestedMessage.message_id,
    payload.message_id,
    payload.messageId,
    payload.id
  )
  const recipient = pickString(
    originalMessage.recipient,
    originalMessage.to,
    nestedMessage.recipient,
    nestedMessage.to,
    payload.recipient,
    payload.to,
    payload.email
  )
  const occurredAt = normalizeOccurredAt(
      payload.timestamp ||
      payload.occurred_at ||
      payload.occurredAt ||
      payload.created_at ||
      originalMessage.timestamp ||
      originalMessage.occurred_at ||
      originalMessage.created_at ||
      nestedMessage.timestamp ||
      nestedMessage.occurred_at ||
      nestedMessage.created_at
  )

  return {
    id: `postal_webhook_${randomUUID()}`,
    event_type: eventType,
    status,
    message_id: messageId || null,
    recipient: recipient || null,
    occurred_at: occurredAt,
    // Store the body exactly as Postal sent it, envelope included.
    payload: body,
  }
}

/**
 * Engagement callbacks: what a recipient did with a delivered message (opened
 * it, clicked a link), as opposed to whether it was delivered.
 */
export const POSTAL_ENGAGEMENT_STATUSES: ReadonlySet<PostalWebhookStatus> =
  new Set<PostalWebhookStatus>(["clicked", "loaded"])

export type RecordPostalWebhookEventOptions = {
  /**
   * Skip `MessageLinkClicked` and `MessageLoaded` callbacks: they are neither
   * stored nor emitted. Plugin option `ignore_engagement_webhooks`.
   */
  ignoreEngagement?: boolean
}

export const recordPostalWebhookEvent = async (
  service: PostalWebhookEventService | null | undefined,
  payload: Record<string, unknown>,
  options: RecordPostalWebhookEventOptions = {}
): Promise<PostalWebhookRecord | null> => {
  if (!isPostalWebhookFromPlugin(payload)) {
    return null
  }

  // Normalize once and gate on the result — `isPostalSentWebhookFromPlugin`
  // would repeat the full normalization pass on every inbound callback.
  const event = normalizePostalWebhookPayload(payload)

  if (event.status === "unknown") {
    return null
  }

  if (options.ignoreEngagement && POSTAL_ENGAGEMENT_STATUSES.has(event.status)) {
    return null
  }

  if (
    !service?.createPostalWebhookEvents ||
    !service.listPostalWebhookEvents
  ) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Postal webhook persistence is unavailable"
    )
  }

  try {
    await service.createPostalWebhookEvents({
      id: event.id,
      event_type: event.event_type,
      status: event.status,
      message_id: event.message_id,
      recipient: event.recipient,
      occurred_at: event.occurred_at,
      payload: event.payload,
    })
  } catch (error: unknown) {
    if (isPostgresUniqueViolation(error) && event.message_id) {
      const existing = await service.listPostalWebhookEvents(
        { message_id: event.message_id, event_type: event.event_type },
        { take: 1 }
      )
      if (existing?.length) {
        return existing[0]
      }
    }
    throw error
  }

  return event
}

export const listPostalWebhookEvents = async (
  service: PostalWebhookEventService | null | undefined,
  limit = 25
) => {
  if (!service?.listPostalWebhookEvents) {
    return []
  }

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25
  try {
    return await service.listPostalWebhookEvents(
      {},
      { take: safeLimit, order: { created_at: "DESC" } }
    )
  } catch {
    return []
  }
}

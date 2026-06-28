import { randomUUID } from "node:crypto"

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

const POSTAL_WEBHOOK_EVENTS_TABLE = "postal_webhook_events"

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
      return "delayed"
    case "messagedeliveryfailed":
    case "message.delivery.failed":
    case "message.deliveryfailed":
    case "deliveryfailed":
    case "failed":
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
    case "dnserror":
      return "dns_error"
    default:
      return "unknown"
  }
}

const normalizeEventType = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return "postal.webhook"
  }

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

const normalizeOccurredAt = (value: unknown) => {
  const normalized = sanitizeString(value)
  if (!normalized) {
    return null
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export const normalizePostalWebhookPayload = (
  payload: Record<string, unknown>
): PostalWebhookRecord => {
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
    payload,
  }
}

export const recordPostalWebhookEvent = async (
  pgConnection: any,
  payload: Record<string, unknown>
) => {
  const event = normalizePostalWebhookPayload(payload)

  if (!pgConnection || typeof pgConnection.raw !== "function") {
    return event
  }

  await pgConnection.raw(
    `INSERT INTO ${POSTAL_WEBHOOK_EVENTS_TABLE}
      (id, event_type, status, message_id, recipient, occurred_at, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, now())`,
    [
      event.id,
      event.event_type,
      event.status,
      event.message_id,
      event.recipient,
      event.occurred_at,
      JSON.stringify(event.payload),
    ]
  )

  return event
}

export const listPostalWebhookEvents = async (
  pgConnection: any,
  limit = 25
) => {
  if (!pgConnection || typeof pgConnection.raw !== "function") {
    return []
  }

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25
  try {
    const result = await pgConnection.raw(
      `SELECT id, event_type, status, message_id, recipient, occurred_at, created_at, payload
       FROM ${POSTAL_WEBHOOK_EVENTS_TABLE}
       ORDER BY created_at DESC
       LIMIT ?`,
      [safeLimit]
    )

    return (result.rows || []) as PostalWebhookRecord[]
  } catch {
    return []
  }
}

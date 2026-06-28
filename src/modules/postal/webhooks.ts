import { randomUUID } from "node:crypto"

export type PostalWebhookStatus =
  | "sent"
  | "delayed"
  | "failed"
  | "held"
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
    case "sent":
      return "sent"
    case "messagedelayed":
    case "delayed":
      return "delayed"
    case "messagedeliveryfailed":
    case "deliveryfailed":
    case "failed":
    case "error":
      return "failed"
    case "messageheld":
    case "held":
      return "held"
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
    default:
      return normalized
  }
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
  const message = (payload.message ||
    (payload.data as Record<string, unknown> | undefined)?.message ||
    payload.data ||
    {}) as Record<string, unknown>
  const eventType = normalizeEventType(
    pickString(
      payload.event,
      payload.event_type,
      payload.type,
      payload.name,
      message.event,
      message.event_type,
      message.type
    )
  )
  const rawStatus = pickString(
    payload.status,
    payload.message_status,
    payload.delivery_status,
    message.status
  )
  const status = normalizeStatus(rawStatus || eventType)
  const messageId = pickString(
    message.id,
    payload.message_id,
    payload.messageId,
    payload.id
  )
  const recipient = pickString(
    message.recipient,
    message.to,
    payload.recipient,
    payload.to,
    payload.email
  )
  const occurredAt = normalizeOccurredAt(
    payload.timestamp ||
      payload.occurred_at ||
      payload.occurredAt ||
      payload.created_at ||
      message.timestamp ||
      message.occurred_at ||
      message.created_at
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

export const ensurePostalWebhookEventsTable = async (pgConnection: any) => {
  if (!pgConnection) {
    return
  }

  await pgConnection.raw(`
    CREATE TABLE IF NOT EXISTS ${POSTAL_WEBHOOK_EVENTS_TABLE} (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL,
      message_id TEXT,
      recipient TEXT,
      occurred_at TIMESTAMPTZ,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

export const recordPostalWebhookEvent = async (
  pgConnection: any,
  payload: Record<string, unknown>
) => {
  await ensurePostalWebhookEventsTable(pgConnection)
  const event = normalizePostalWebhookPayload(payload)

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
  await ensurePostalWebhookEventsTable(pgConnection)

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25
  const result = await pgConnection.raw(
    `SELECT id, event_type, status, message_id, recipient, occurred_at, created_at, payload
     FROM ${POSTAL_WEBHOOK_EVENTS_TABLE}
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  )

  return (result.rows || []) as PostalWebhookRecord[]
}

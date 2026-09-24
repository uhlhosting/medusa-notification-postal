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

export const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:"

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

// Postal delivery uuids are 8-4-4-4-12 hex; anything else is not trusted as a
// row id and falls back to a random one (no dedupe for that delivery).
const POSTAL_DELIVERY_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PostalWebhookEnvelope = {
  inner: Record<string, unknown>
  event: string
  uuid: string | null
  timestamp: unknown
}

// Postal POSTs every webhook as `{ event, timestamp, payload, uuid }`, where
// `payload` is the event hash and `uuid` identifies the delivery (it stays the
// same across Postal's own retries). Bodies without that envelope are treated
// as a bare event hash, as before.
export const unwrapPostalWebhookEnvelope = (
  body: Record<string, unknown>
): PostalWebhookEnvelope => {
  const event = sanitizeString(body.event)
  if (!isRecord(body.payload) || !event) {
    return { inner: body, event: "", uuid: null, timestamp: undefined }
  }

  const uuid = sanitizeString(body.uuid)
  return {
    inner: body.payload,
    event,
    uuid: POSTAL_DELIVERY_UUID_PATTERN.test(uuid) ? uuid.toLowerCase() : null,
    timestamp: body.timestamp,
  }
}

// Postal message ids are integers; accept them as well as strings.
const pickId = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
    const normalized = sanitizeString(value)
    if (normalized) {
      return normalized
    }
  }

  return ""
}

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

const extractPostalWebhookTag = (payload: Record<string, unknown>) =>
  pickString(
    payload.tag,
    pickNestedTag(payload.message),
    pickNestedTag(payload.original_message),
    pickNestedTag(payload.data),
    pickNestedTag(
      (payload.data as Record<string, unknown> | undefined)?.message
    )
  )

export const isPostalWebhookFromPlugin = (payload: Record<string, unknown>) =>
  extractPostalWebhookTag(unwrapPostalWebhookEnvelope(payload).inner).startsWith(
    POSTAL_WEBHOOK_TAG_PREFIX
  )

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
    case "error":
    case "hardfail":
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
  status: PostalWebhookStatus,
  envelopeEvent = ""
) => {
  const explicitEvent = pickString(
    envelopeEvent,
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
  if (typeof value === "number") {
    // Postal timestamps are float epoch seconds.
    const parsed = new Date(value * 1000)
    return Number.isFinite(value) && !Number.isNaN(parsed.getTime())
      ? parsed.toISOString()
      : null
  }

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
  body: Record<string, unknown>
): PostalWebhookRecord => {
  const envelope = unwrapPostalWebhookEnvelope(body)
  const payload = envelope.inner
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
    normalizeStatus(rawStatus),
    envelope.event
  )
  const status = normalizeStatus(rawStatus || eventType)
  const messageId = pickId(
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
      envelope.timestamp ||
      originalMessage.timestamp ||
      originalMessage.occurred_at ||
      originalMessage.created_at ||
      nestedMessage.timestamp ||
      nestedMessage.occurred_at ||
      nestedMessage.created_at
  )

  return {
    // A delivery's uuid is stable across Postal's retries, so deriving the row
    // id from it lets the primary key reject replays.
    id: `postal_webhook_${envelope.uuid || randomUUID()}`,
    event_type: eventType,
    status,
    message_id: messageId || null,
    recipient: recipient || null,
    occurred_at: occurredAt,
    payload: body,
  }
}

export type PostalWebhookRecordOutcome = {
  record: PostalWebhookRecord
  // True only when this call inserted the row; replays and unpersisted events
  // are false, so callers emit `postal.<status>` at most once per delivery.
  created: boolean
}

const findPostalWebhookEvent = async (
  service: PostalWebhookEventService,
  id: string
) => (await service.listPostalWebhookEvents({ id }, { take: 1 }))?.[0]

export const recordPostalWebhookEventOutcome = async (
  service: PostalWebhookEventService | null | undefined,
  payload: Record<string, unknown>
): Promise<PostalWebhookRecordOutcome | null> => {
  if (!isPostalWebhookFromPlugin(payload)) {
    return null
  }

  const event = normalizePostalWebhookPayload(payload)

  if (!service?.createPostalWebhookEvents) {
    return { record: event, created: false }
  }

  const replayable = Boolean(unwrapPostalWebhookEnvelope(payload).uuid)
  if (replayable) {
    const existing = await findPostalWebhookEvent(service, event.id)
    if (existing) {
      return { record: existing, created: false }
    }
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
  } catch (error) {
    // A concurrent delivery of the same uuid can win the insert. Medusa maps
    // the unique violation to a MedusaError without the pg code, so re-read by
    // id instead of inspecting the error, and rethrow anything else.
    if (replayable) {
      const existing = await findPostalWebhookEvent(service, event.id)
      if (existing) {
        return { record: existing, created: false }
      }
    }
    throw error
  }

  return { record: event, created: true }
}

export const recordPostalWebhookEvent = async (
  service: PostalWebhookEventService | null | undefined,
  payload: Record<string, unknown>
): Promise<PostalWebhookRecord | null> =>
  (await recordPostalWebhookEventOutcome(service, payload))?.record ?? null

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

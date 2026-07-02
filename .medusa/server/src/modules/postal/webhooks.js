"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPostalWebhookEvents = exports.recordPostalWebhookEvent = exports.normalizePostalWebhookPayload = exports.isPostalSentWebhookFromPlugin = exports.isPostalWebhookFromPlugin = exports.POSTAL_WEBHOOK_TAG_PREFIX = void 0;
const node_crypto_1 = require("node:crypto");
const POSTAL_WEBHOOK_EVENTS_TABLE = "postal_webhook_events";
exports.POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:";
const sanitizeString = (value) => typeof value === "string" ? value.trim() : "";
const pickString = (...values) => {
    for (const value of values) {
        const normalized = sanitizeString(value);
        if (normalized) {
            return normalized;
        }
    }
    return "";
};
const pickNestedTag = (value) => value && typeof value === "object"
    ? pickString(value.tag)
    : "";
const extractPostalWebhookTag = (payload) => pickString(payload.tag, pickNestedTag(payload.message), pickNestedTag(payload.original_message), pickNestedTag(payload.data), pickNestedTag(payload.data?.message));
const isPostalWebhookFromPlugin = (payload) => extractPostalWebhookTag(payload).startsWith(exports.POSTAL_WEBHOOK_TAG_PREFIX);
exports.isPostalWebhookFromPlugin = isPostalWebhookFromPlugin;
const isPostalSentWebhookFromPlugin = (payload) => {
    if (!(0, exports.isPostalWebhookFromPlugin)(payload)) {
        return false;
    }
    return (0, exports.normalizePostalWebhookPayload)(payload).status === "sent";
};
exports.isPostalSentWebhookFromPlugin = isPostalSentWebhookFromPlugin;
const normalizeStatus = (value) => {
    const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
    switch (normalized) {
        case "messagesent":
        case "message.sent":
        case "sent":
            return "sent";
        case "messagedelayed":
        case "message.delayed":
        case "delayed":
            return "delayed";
        case "messagedeliveryfailed":
        case "message.delivery.failed":
        case "message.deliveryfailed":
        case "deliveryfailed":
        case "failed":
        case "error":
            return "failed";
        case "messageheld":
        case "message.held":
        case "held":
            return "held";
        case "messagebounced":
        case "message.bounced":
        case "bounced":
            return "bounced";
        case "messagelinkclicked":
        case "message.linkclicked":
        case "message.link.clicked":
        case "clicked":
            return "clicked";
        case "messageloaded":
        case "message.loaded":
        case "loaded":
            return "loaded";
        case "domaindnserror":
        case "domain.dns.error":
        case "domain.dns_error":
        case "domain_dnserror":
        case "dnserror":
            return "dns_error";
        default:
            return "unknown";
    }
};
const normalizeEventType = (value) => {
    const normalized = value.trim();
    const collapsed = normalized.toLowerCase().replace(/[\s_]+/g, ".");
    switch (collapsed.replace(/[^a-z.]/g, "")) {
        case "messagesent":
        case "message.sent":
            return "message.sent";
        case "messagedelayed":
        case "message.delayed":
            return "message.delayed";
        case "messagedeliveryfailed":
        case "message.delivery.failed":
        case "message.deliveryfailed":
            return "message.delivery_failed";
        case "messageheld":
        case "message.held":
            return "message.held";
        case "messagebounced":
        case "message.bounced":
            return "message.bounced";
        case "messagelinkclicked":
        case "message.link.clicked":
            return "message.link_clicked";
        case "messageloaded":
        case "message.loaded":
            return "message.loaded";
        case "domaindnserror":
        case "domain.dns.error":
        case "domain.dns_error":
        case "domain_dnserror":
            return "domain.dns_error";
        default:
            return normalized;
    }
};
const inferEventTypeFromPayload = (payload, status) => {
    const explicitEvent = pickString(payload.event, payload.event_type, payload.type, payload.name);
    if (explicitEvent) {
        return normalizeEventType(explicitEvent);
    }
    if (status !== "unknown") {
        switch (status) {
            case "sent":
                return "message.sent";
            case "delayed":
                return "message.delayed";
            case "failed":
                return "message.delivery_failed";
            case "held":
                return "message.held";
            case "bounced":
                return "message.bounced";
            case "clicked":
                return "message.link_clicked";
            case "loaded":
                return "message.loaded";
            case "dns_error":
                return "domain.dns_error";
        }
    }
    if (payload.bounce || (payload.original_message && payload.bounce)) {
        return "message.bounced";
    }
    if (payload.url && (payload.message || payload.original_message)) {
        return "message.link_clicked";
    }
    if ((payload.ip_address || payload.user_agent) &&
        (payload.message || payload.original_message) &&
        !payload.url) {
        return "message.loaded";
    }
    if (payload.domain ||
        payload.dns_checked_at ||
        payload.spf_status ||
        payload.dkim_status ||
        payload.mx_status ||
        payload.return_path_status) {
        return "domain.dns_error";
    }
    return "postal.webhook";
};
const normalizeOccurredAt = (value) => {
    const normalized = sanitizeString(value);
    if (!normalized) {
        return null;
    }
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
};
const normalizePostalWebhookPayload = (payload) => {
    const originalMessage = (payload.original_message ||
        payload.message ||
        payload.data?.message ||
        payload.data ||
        {});
    const nestedMessage = (payload.bounce ||
        payload.message ||
        payload.data?.message ||
        payload.data ||
        {});
    const rawStatus = pickString(payload.status, payload.message_status, payload.delivery_status, originalMessage.status, nestedMessage.status);
    const eventType = inferEventTypeFromPayload(payload, normalizeStatus(rawStatus));
    const status = normalizeStatus(rawStatus || eventType);
    const messageId = pickString(originalMessage.id, originalMessage.message_id, nestedMessage.id, nestedMessage.message_id, payload.message_id, payload.messageId, payload.id);
    const recipient = pickString(originalMessage.recipient, originalMessage.to, nestedMessage.recipient, nestedMessage.to, payload.recipient, payload.to, payload.email);
    const occurredAt = normalizeOccurredAt(payload.timestamp ||
        payload.occurred_at ||
        payload.occurredAt ||
        payload.created_at ||
        originalMessage.timestamp ||
        originalMessage.occurred_at ||
        originalMessage.created_at ||
        nestedMessage.timestamp ||
        nestedMessage.occurred_at ||
        nestedMessage.created_at);
    return {
        id: `postal_webhook_${(0, node_crypto_1.randomUUID)()}`,
        event_type: eventType,
        status,
        message_id: messageId || null,
        recipient: recipient || null,
        occurred_at: occurredAt,
        payload,
    };
};
exports.normalizePostalWebhookPayload = normalizePostalWebhookPayload;
const recordPostalWebhookEvent = async (pgConnection, payload) => {
    if (!(0, exports.isPostalSentWebhookFromPlugin)(payload)) {
        return null;
    }
    const event = (0, exports.normalizePostalWebhookPayload)(payload);
    if (!pgConnection || typeof pgConnection.raw !== "function") {
        return event;
    }
    try {
        await pgConnection.raw(`INSERT INTO ${POSTAL_WEBHOOK_EVENTS_TABLE}
        (id, event_type, status, message_id, recipient, occurred_at, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, now())`, [
            event.id,
            event.event_type,
            event.status,
            event.message_id,
            event.recipient,
            event.occurred_at,
            JSON.stringify(event.payload),
        ]);
    }
    catch {
        return event;
    }
    return event;
};
exports.recordPostalWebhookEvent = recordPostalWebhookEvent;
const listPostalWebhookEvents = async (pgConnection, limit = 25) => {
    if (!pgConnection || typeof pgConnection.raw !== "function") {
        return [];
    }
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25;
    try {
        const result = await pgConnection.raw(`SELECT id, event_type, status, message_id, recipient, occurred_at, created_at, payload
       FROM ${POSTAL_WEBHOOK_EVENTS_TABLE}
       ORDER BY created_at DESC
       LIMIT ?`, [safeLimit]);
        return (result.rows || []);
    }
    catch {
        return [];
    }
};
exports.listPostalWebhookEvents = listPostalWebhookEvents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvd2ViaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXdDO0FBd0J4QyxNQUFNLDJCQUEyQixHQUFHLHVCQUF1QixDQUFBO0FBQzlDLFFBQUEseUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFFakYsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUN4QyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBRS9DLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxNQUFpQixFQUFFLEVBQUU7SUFDMUMsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMzQixNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDeEMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLE9BQU8sVUFBVSxDQUFBO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxFQUFFLENBQUE7QUFDWCxDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFLENBQ3ZDLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO0lBQ2hDLENBQUMsQ0FBQyxVQUFVLENBQUUsS0FBaUMsQ0FBQyxHQUFHLENBQUM7SUFDcEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUVSLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxPQUFnQyxFQUFFLEVBQUUsQ0FDbkUsVUFBVSxDQUNSLE9BQU8sQ0FBQyxHQUFHLEVBQ1gsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFDOUIsYUFBYSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUN2QyxhQUFhLENBQUMsT0FBTyxD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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPostalWebhookEvents = exports.recordPostalWebhookEvent = exports.normalizePostalWebhookPayload = exports.isPostalSentWebhookFromPlugin = exports.isPostalWebhookFromPlugin = exports.POSTAL_WEBHOOK_TAG_PREFIX = void 0;
const node_crypto_1 = require("node:crypto");
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
const recordPostalWebhookEvent = async (service, payload) => {
    if (!(0, exports.isPostalSentWebhookFromPlugin)(payload)) {
        return null;
    }
    const event = (0, exports.normalizePostalWebhookPayload)(payload);
    if (!service?.createPostalWebhookEvents) {
        return event;
    }
    try {
        // Idempotency: a replayed callback for the same message + event type must
        // not create a duplicate row.
        if (event.message_id) {
            const existing = await service.listPostalWebhookEvents({ message_id: event.message_id, event_type: event.event_type }, { take: 1 });
            if (existing?.length) {
                return existing[0];
            }
        }
        await service.createPostalWebhookEvents({
            id: event.id,
            event_type: event.event_type,
            status: event.status,
            message_id: event.message_id,
            recipient: event.recipient,
            occurred_at: event.occurred_at,
            payload: event.payload,
        });
    }
    catch {
        return event;
    }
    return event;
};
exports.recordPostalWebhookEvent = recordPostalWebhookEvent;
const listPostalWebhookEvents = async (service, limit = 25) => {
    if (!service?.listPostalWebhookEvents) {
        return [];
    }
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25;
    try {
        return await service.listPostalWebhookEvents({}, { take: safeLimit, order: { created_at: "DESC" } });
    }
    catch {
        return [];
    }
};
exports.listPostalWebhookEvents = listPostalWebhookEvents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvd2ViaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXdDO0FBd0IzQixRQUFBLHlCQUF5QixHQUFHLHdDQUF3QyxDQUFBO0FBYWpGLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FDeEMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUUvQyxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsTUFBaUIsRUFBRSxFQUFFO0lBQzFDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDM0IsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3hDLElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixPQUFPLFVBQVUsQ0FBQTtRQUNuQixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sRUFBRSxDQUFBO0FBQ1gsQ0FBQyxDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUN2QyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtJQUNoQyxDQUFDLENBQUMsVUFBVSxDQUFFLEtBQWlDLENBQUMsR0FBRyxDQUFDO0lBQ3BELENBQUMsQ0FBQyxFQUFFLENBQUE7QUFFUixNQUFNLHVCQUF1QixHQUFHLENBQUMsT0FBZ0MsRUFBRSxFQUFFLENBQ25FLFVBQVUsQ0FDUixPQUFPLENBQUMsR0FBRyxFQUNYLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQzlCLGFBQWEsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDdkMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFDM0IsYUFBYSxDQUNWLE9BQU8s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
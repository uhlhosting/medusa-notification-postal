"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const webhooks_1 = require("./webhooks");
(0, node_test_1.default)("normalizePostalWebhookPayload maps Postal message delivery events", () => {
    const event = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageDelivered",
        status: "message_sent",
        message: {
            id: "msg_123",
            recipient: "customer@example.com",
            created_at: "2026-06-28T10:00:00Z",
        },
    });
    strict_1.default.equal(event.event_type, "MessageDelivered");
    strict_1.default.equal(event.status, "sent");
    strict_1.default.equal(event.message_id, "msg_123");
    strict_1.default.equal(event.recipient, "customer@example.com");
    strict_1.default.equal(event.occurred_at, "2026-06-28T10:00:00.000Z");
});
(0, node_test_1.default)("isPostalWebhookFromPlugin only accepts plugin-tagged messages", () => {
    strict_1.default.equal((0, webhooks_1.isPostalWebhookFromPlugin)({
        message: {
            tag: "uhlhosting.medusa-notification-postal:order-placed",
        },
    }), true);
    strict_1.default.equal((0, webhooks_1.isPostalWebhookFromPlugin)({
        message: {
            tag: "order-placed",
        },
    }), false);
    strict_1.default.equal((0, webhooks_1.isPostalWebhookFromPlugin)({ message: {} }), false);
});
(0, node_test_1.default)("isPostalSentWebhookFromPlugin only accepts plugin-tagged sent message webhooks", () => {
    strict_1.default.equal((0, webhooks_1.isPostalSentWebhookFromPlugin)({
        event_type: "MessageSent",
        status: "Sent",
        message: {
            tag: "uhlhosting.medusa-notification-postal:order-placed",
        },
    }), true);
    strict_1.default.equal((0, webhooks_1.isPostalSentWebhookFromPlugin)({
        event_type: "MessageBounced",
        status: "Bounced",
        message: {
            tag: "uhlhosting.medusa-notification-postal:order-placed",
        },
    }), false);
    strict_1.default.equal((0, webhooks_1.isPostalSentWebhookFromPlugin)({
        event_type: "MessageSent",
        status: "Sent",
        message: {
            tag: "external-app:order-placed",
        },
    }), false);
});
(0, node_test_1.default)("normalizePostalWebhookPayload falls back to nested message data", () => {
    const event = (0, webhooks_1.normalizePostalWebhookPayload)({
        data: {
            message: {
                event: "MessageHeld",
                status: "held",
                id: "msg_held",
                to: "audit@example.com",
                occurred_at: "2026-06-28 11:30:00Z",
            },
        },
    });
    strict_1.default.equal(event.event_type, "message.held");
    strict_1.default.equal(event.status, "held");
    strict_1.default.equal(event.message_id, "msg_held");
    strict_1.default.equal(event.recipient, "audit@example.com");
    strict_1.default.equal(event.occurred_at, "2026-06-28T11:30:00.000Z");
});
(0, node_test_1.default)("normalizePostalWebhookPayload maps bounce and click style events", () => {
    const bounced = (0, webhooks_1.normalizePostalWebhookPayload)({
        event: "MessageBounced",
        bounce: {
            message_id: "msg_bounced",
            recipient: "bounce@example.com",
            timestamp: "2026-06-28T12:15:00Z",
        },
    });
    const clicked = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageLinkClicked",
        url: "https://example.com",
        message: {
            id: "msg_clicked",
            to: "click@example.com",
            created_at: "2026-06-28T12:20:00Z",
        },
    });
    strict_1.default.equal(bounced.event_type, "message.bounced");
    strict_1.default.equal(bounced.status, "bounced");
    strict_1.default.equal(bounced.message_id, "msg_bounced");
    strict_1.default.equal(bounced.recipient, "bounce@example.com");
    strict_1.default.equal(bounced.occurred_at, "2026-06-28T12:15:00.000Z");
    strict_1.default.equal(clicked.event_type, "message.link_clicked");
    strict_1.default.equal(clicked.status, "clicked");
    strict_1.default.equal(clicked.message_id, "msg_clicked");
    strict_1.default.equal(clicked.recipient, "click@example.com");
});
(0, node_test_1.default)("normalizePostalWebhookPayload handles missing values safely", () => {
    const event = (0, webhooks_1.normalizePostalWebhookPayload)({});
    strict_1.default.equal(event.event_type, "postal.webhook");
    strict_1.default.equal(event.status, "unknown");
    strict_1.default.equal(event.message_id, null);
    strict_1.default.equal(event.recipient, null);
    strict_1.default.equal(event.occurred_at, null);
});
(0, node_test_1.default)("normalizePostalWebhookPayload handles explicit loaded and dns error event labels", () => {
    const loaded = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "Message Loaded",
        message: {
            id: "msg_loaded_explicit",
            recipient: "loaded@example.com",
        },
        occurred_at: "not-a-date",
    });
    const dnsError = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "domain_dns_error",
        domain: "example.com",
        dns_checked_at: "2026-06-28T12:00:00Z",
    });
    strict_1.default.equal(loaded.event_type, "message.loaded");
    strict_1.default.equal(loaded.status, "loaded");
    strict_1.default.equal(loaded.occurred_at, null);
    strict_1.default.equal(dnsError.event_type, "domain.dns_error");
    strict_1.default.equal(dnsError.status, "dns_error");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers explicit event aliases", () => {
    const deliveryFailed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "message.delivery.failed",
        message: {
            id: "msg_delivery_failed",
        },
    });
    const clicked = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.link.clicked",
        url: "https://example.com",
        original_message: {
            id: "msg_clicked_alias",
            recipient: "alias@example.com",
        },
    });
    const blank = (0, webhooks_1.normalizePostalWebhookPayload)({
        event: "   ",
    });
    strict_1.default.equal(deliveryFailed.event_type, "message.delivery_failed");
    strict_1.default.equal(deliveryFailed.status, "failed");
    strict_1.default.equal(clicked.event_type, "message.link_clicked");
    strict_1.default.equal(clicked.status, "clicked");
    strict_1.default.equal(blank.event_type, "postal.webhook");
    strict_1.default.equal(blank.status, "unknown");
});
(0, node_test_1.default)("normalizePostalWebhookPayload preserves unknown explicit labels and other status aliases", () => {
    const delayed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "message.delayed",
        message: {
            id: "msg_delayed",
        },
    });
    const custom = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "Custom Event",
        status: "sent",
        message: {
            id: "msg_custom",
        },
    });
    strict_1.default.equal(delayed.event_type, "message.delayed");
    strict_1.default.equal(delayed.status, "delayed");
    strict_1.default.equal(custom.event_type, "Custom Event");
    strict_1.default.equal(custom.status, "sent");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers delayed aliases and explicit status fallbacks", () => {
    const delayed = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageDelayed",
        message: {
            id: "msg_delayed_alias",
        },
    });
    const delayedExact = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.delayed",
        message: {
            id: "msg_delayed_exact",
        },
    });
    strict_1.default.equal(delayed.event_type, "message.delayed");
    strict_1.default.equal(delayedExact.event_type, "message.delayed");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers remaining delivery failed and domain aliases", () => {
    const deliveryFailed = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageDeliveryFailed",
        message: {
            id: "msg_delivery_failed_alias",
        },
    });
    const deliveryFailedExact = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.deliveryfailed",
        message: {
            id: "msg_delivery_failed_exact",
        },
    });
    const dnsError = (0, webhooks_1.normalizePostalWebhookPayload)({
        domain: "example.com",
        spf_status: "fail",
    });
    strict_1.default.equal(deliveryFailed.event_type, "message.delivery_failed");
    strict_1.default.equal(deliveryFailedExact.event_type, "message.delivery_failed");
    strict_1.default.equal(dnsError.event_type, "domain.dns_error");
    strict_1.default.equal(dnsError.status, "unknown");
});
(0, node_test_1.default)("normalizePostalWebhookPayload maps explicit delivery statuses", () => {
    const delayed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "message_delayed",
        message: { id: "msg_delayed" },
    });
    const failed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "error",
        message: { id: "msg_failed" },
    });
    const loaded = (0, webhooks_1.normalizePostalWebhookPayload)({
        message_status: "loaded",
        message: {
            id: "msg_loaded",
            recipient: "loaded@example.com",
            user_agent: "Mozilla",
            created_at: "2026-06-28T12:30:00Z",
        },
    });
    const dnsError = (0, webhooks_1.normalizePostalWebhookPayload)({
        delivery_status: "domain_dns_error",
        domain: "example.com",
    });
    strict_1.default.equal(delayed.status, "delayed");
    strict_1.default.equal(delayed.event_type, "message.delayed");
    strict_1.default.equal(failed.status, "failed");
    strict_1.default.equal(failed.event_type, "message.delivery_failed");
    strict_1.default.equal(loaded.status, "loaded");
    strict_1.default.equal(loaded.event_type, "message.loaded");
    strict_1.default.equal(dnsError.status, "dns_error");
    strict_1.default.equal(dnsError.event_type, "domain.dns_error");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers status aliases without explicit events", () => {
    const clicked = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "clicked",
        message: {
            id: "msg_clicked_status",
            to: "click-status@example.com",
        },
    });
    const loaded = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "loaded",
        message: {
            id: "msg_loaded_status",
            recipient: "load-status@example.com",
        },
    });
    const dnsError = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "dns_error",
        domain: "example.com",
    });
    const unknown = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "mystery",
    });
    strict_1.default.equal(clicked.event_type, "message.link_clicked");
    strict_1.default.equal(clicked.status, "clicked");
    strict_1.default.equal(loaded.event_type, "message.loaded");
    strict_1.default.equal(loaded.status, "loaded");
    strict_1.default.equal(dnsError.event_type, "domain.dns_error");
    strict_1.default.equal(dnsError.status, "dns_error");
    strict_1.default.equal(unknown.event_type, "postal.webhook");
    strict_1.default.equal(unknown.status, "unknown");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers remaining status aliases without explicit events", () => {
    const sent = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "sent",
        message: { id: "msg_sent_status" },
    });
    const delayed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "delayed",
        message: { id: "msg_delayed_status" },
    });
    const failed = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "failed",
        message: { id: "msg_failed_status" },
    });
    const held = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "held",
        message: { id: "msg_held_status" },
    });
    const bounced = (0, webhooks_1.normalizePostalWebhookPayload)({
        status: "bounced",
        message: { id: "msg_bounced_status" },
    });
    strict_1.default.equal(sent.event_type, "message.sent");
    strict_1.default.equal(delayed.event_type, "message.delayed");
    strict_1.default.equal(failed.event_type, "message.delivery_failed");
    strict_1.default.equal(held.event_type, "message.held");
    strict_1.default.equal(bounced.event_type, "message.bounced");
});
(0, node_test_1.default)("normalizePostalWebhookPayload covers remaining explicit event aliases", () => {
    const bouncedExact = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.bounced",
        message: {
            id: "msg_bounced_exact",
            recipient: "bounce-exact@example.com",
        },
    });
    const loadedExact = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.loaded",
    });
    const clickedExact = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "message.link.clicked",
        message: {
            id: "msg_clicked_exact",
            recipient: "clicked-exact@example.com",
        },
    });
    const loaded = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageLoaded",
        message: {
            id: "msg_loaded_alias",
            recipient: "loaded-alias@example.com",
            created_at: "2026-06-28T13:00:00Z",
        },
    });
    const dnsError = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "DomainDnsError",
        domain: "example.com",
    });
    const held = (0, webhooks_1.normalizePostalWebhookPayload)({
        event_type: "MessageHeld",
        message: {
            id: "msg_held_alias",
            recipient: "held-alias@example.com",
        },
    });
    strict_1.default.equal(bouncedExact.event_type, "message.bounced");
    strict_1.default.equal(bouncedExact.status, "bounced");
    strict_1.default.equal(loadedExact.event_type, "message.loaded");
    strict_1.default.equal(loadedExact.status, "loaded");
    strict_1.default.equal(clickedExact.event_type, "message.link_clicked");
    strict_1.default.equal(clickedExact.status, "clicked");
    strict_1.default.equal(loaded.event_type, "message.loaded");
    strict_1.default.equal(loaded.status, "loaded");
    strict_1.default.equal(loaded.recipient, "loaded-alias@example.com");
    strict_1.default.equal(dnsError.event_type, "domain.dns_error");
    strict_1.default.equal(dnsError.status, "unknown");
    strict_1.default.equal(held.event_type, "message.held");
    strict_1.default.equal(held.status, "held");
});
(0, node_test_1.default)("normalizePostalWebhookPayload infers status from nested bounce and click payloads", () => {
    const bounced = (0, webhooks_1.normalizePostalWebhookPayload)({
        bounce: {
            message_id: "msg_nested_bounced",
            recipient: "bounce@example.com",
        },
    });
    const clicked = (0, webhooks_1.normalizePostalWebhookPayload)({
        url: "https://example.com",
        original_message: {
            message_id: "msg_nested_clicked",
            recipient: "click@example.com",
        },
    });
    strict_1.default.equal(bounced.status, "bounced");
    strict_1.default.equal(bounced.event_type, "message.bounced");
    strict_1.default.equal(clicked.status, "clicked");
    strict_1.default.equal(clicked.event_type, "message.link_clicked");
});
(0, node_test_1.default)("normalizePostalWebhookPayload falls back to the generic webhook label for partial payloads", () => {
    const urlOnly = (0, webhooks_1.normalizePostalWebhookPayload)({
        url: "https://example.com",
    });
    const loaded = (0, webhooks_1.normalizePostalWebhookPayload)({
        ip_address: "203.0.113.10",
        user_agent: "Mozilla/5.0",
        message: {
            id: "msg_loaded_inferred",
            recipient: "loaded-inferred@example.com",
        },
    });
    strict_1.default.equal(urlOnly.event_type, "postal.webhook");
    strict_1.default.equal(urlOnly.status, "unknown");
    strict_1.default.equal(loaded.event_type, "message.loaded");
    strict_1.default.equal(loaded.status, "loaded");
});
const createFakeWebhookService = (opts = {}) => {
    const rows = [...(opts.seed || [])];
    const created = [];
    let lastListConfig;
    return {
        rows,
        created,
        get lastListConfig() {
            return lastListConfig;
        },
        listPostalWebhookEvents: async (filter = {}, config = {}) => {
            if (opts.throwOnList)
                throw new Error("database unavailable");
            lastListConfig = config;
            let out = rows;
            if (filter && filter.message_id) {
                out = out.filter((r) => r.message_id === filter.message_id &&
                    (filter.event_type === undefined || r.event_type === filter.event_type));
            }
            const take = config?.take;
            return (typeof take === "number" ? out.slice(0, take) : out);
        },
        createPostalWebhookEvents: async (data) => {
            if (opts.throwOnCreate)
                throw new Error("database unavailable");
            created.push(data);
            rows.push(data);
            return data;
        },
    };
};
(0, node_test_1.default)("recordPostalWebhookEvent persists a normalized event via the module service", async () => {
    const service = createFakeWebhookService();
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, {
        event: "message.sent",
        status: "sent",
        message: {
            id: "msg_recorded",
            recipient: "recipient@example.com",
            created_at: "2026-06-28T12:00:00Z",
            tag: "uhlhosting.medusa-notification-postal:postal-test",
        },
    });
    strict_1.default.equal(service.created.length, 1);
    strict_1.default.equal(service.created[0].message_id, "msg_recorded");
    strict_1.default.equal(service.created[0].status, "sent");
    strict_1.default.notEqual(event, null);
    const recorded = event;
    strict_1.default.equal(recorded.status, "sent");
    strict_1.default.equal(recorded.message_id, "msg_recorded");
    strict_1.default.equal(recorded.recipient, "recipient@example.com");
});
(0, node_test_1.default)("recordPostalWebhookEvent is idempotent for a replayed message + event type", async () => {
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
    });
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, {
        event: "message.sent",
        status: "sent",
        message: {
            id: "msg_dup",
            recipient: "recipient@example.com",
            tag: "uhlhosting.medusa-notification-postal:postal-test",
        },
    });
    // No new row created; the existing record is returned.
    strict_1.default.equal(service.created.length, 0);
    strict_1.default.equal(event.id, "postal_webhook_existing");
});
(0, node_test_1.default)("recordPostalWebhookEvent ignores non-plugin messages", async () => {
    const service = createFakeWebhookService();
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, {
        event: "message.sent",
        status: "sent",
        message: {
            id: "msg_other",
            recipient: "recipient@example.com",
            tag: "external-app:order-placed",
        },
    });
    strict_1.default.equal(event, null);
    strict_1.default.equal(service.created.length, 0);
});
(0, node_test_1.default)("recordPostalWebhookEvent ignores plugin-tagged non-sent messages", async () => {
    const service = createFakeWebhookService();
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, {
        event: "message.bounced",
        status: "bounced",
        message: {
            id: "msg_bounced",
            recipient: "recipient@example.com",
            tag: "uhlhosting.medusa-notification-postal:postal-test",
        },
    });
    strict_1.default.equal(event, null);
    strict_1.default.equal(service.created.length, 0);
});
(0, node_test_1.default)("recordPostalWebhookEvent returns event when the service is unavailable", async () => {
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(null, {
        message: {
            tag: "uhlhosting.medusa-notification-postal:postal-test",
            id: "msg_no_service",
            recipient: "recipient@example.com",
        },
        status: "sent",
    });
    strict_1.default.notEqual(event, null);
    const recorded = event;
    strict_1.default.equal(recorded.status, "sent");
    strict_1.default.equal(recorded.message_id, "msg_no_service");
});
(0, node_test_1.default)("recordPostalWebhookEvent returns event when persistence fails", async () => {
    const service = createFakeWebhookService({ throwOnCreate: true });
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, {
        event_type: "MessageSent",
        status: "Sent",
        message: {
            message_id: "msg_failed_write",
            recipient: "recipient@example.com",
            tag: "uhlhosting.medusa-notification-postal:postal-test",
        },
    });
    strict_1.default.notEqual(event, null);
    const recorded = event;
    strict_1.default.equal(recorded.event_type, "message.sent");
    strict_1.default.equal(recorded.status, "sent");
    strict_1.default.equal(recorded.message_id, "msg_failed_write");
    strict_1.default.equal(recorded.recipient, "recipient@example.com");
});
(0, node_test_1.default)("listPostalWebhookEvents returns rows with clamped limit bounds", async () => {
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
    });
    const rows = await (0, webhooks_1.listPostalWebhookEvents)(service, 500);
    strict_1.default.equal(service.lastListConfig?.take, 100);
    strict_1.default.deepEqual(service.lastListConfig?.order, { created_at: "DESC" });
    strict_1.default.equal(rows[0]?.id, "postal_webhook_1");
    strict_1.default.equal(rows[0]?.status, "sent");
});
(0, node_test_1.default)("listPostalWebhookEvents returns an empty list when the query fails", async () => {
    const service = createFakeWebhookService({ throwOnList: true });
    const rows = await (0, webhooks_1.listPostalWebhookEvents)(service, Number.NaN);
    strict_1.default.deepEqual(rows, []);
});
(0, node_test_1.default)("listPostalWebhookEvents returns an empty list when no service is available", async () => {
    const rows = await (0, webhooks_1.listPostalWebhookEvents)(null, 25);
    strict_1.default.deepEqual(rows, []);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViaG9va3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC93ZWJob29rcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyx5Q0FNbUI7QUFFbkIsSUFBQSxtQkFBSSxFQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtJQUM3RSxNQUFNLEtBQUssR0FBRyxJQUFBLHdDQUE2QixFQUFDO1FBQzFDLFVBQVUsRUFBRSxrQkFBa0I7UUFDOUIsTUFBTSxFQUFFLGNBQWM7UUFDdEIsT0FBTyxFQUFFO1lBQ1AsRUFBRSxFQUFFLFNBQVM7WUFDYixTQUFTLEVBQUUsc0JBQXNCO1lBQ2pDLFVBQVUsRUFBRSxzQkFBc0I7U0FDbkM7S0FDRixDQUFDLENBQUE7SUFFRixnQkFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDbEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUNsQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQ3pDLGdCQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTtJQUNyRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLDBCQUEwQixDQUFDLENBQUE7QUFDN0QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFBLG1CQUFJLEVBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO0lBQ3pFLGdCQUFNLENBQUMsS0FBSyxDQUNWLElBQUEsb0NBQXlCLEVBQUM7UUFDeEIsT0FBTyxFQUFFO1lBQ1AsR0FBRyxFQUFFLG9EQUFvRDtTQUMxRDtLQUNGLENBQUMsRUFDRixJQUFJ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
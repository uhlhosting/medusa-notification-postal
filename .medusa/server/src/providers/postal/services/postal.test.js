"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const utils_1 = require("@medusajs/framework/utils");
const postal_1 = require("./postal");
const originalFetch = globalThis.fetch;
const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:";
const logger = {
    info: () => undefined,
    error: () => undefined,
    warn: () => undefined,
    debug: () => undefined,
};
const createService = () => new postal_1.PostalNotificationService({ logger }, {
    from: "ops@example.com",
    base_url: "https://postal.example.com/",
    api_key: "secret",
    auth_type: "smtp-api",
});
node_test_1.default.beforeEach(() => {
    globalThis.fetch = undefined;
});
node_test_1.default.after(() => {
    globalThis.fetch = originalFetch;
});
(0, node_test_1.default)("constructor and option validation reject invalid configuration", () => {
    strict_1.default.throws(() => new postal_1.PostalNotificationService({ logger }, {
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: "secret",
        auth_type: "legacy",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => new postal_1.PostalNotificationService({ logger }, {
        from: "",
        base_url: "https://postal.example.com",
        api_key: "secret",
        auth_type: "smtp-api",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => new postal_1.PostalNotificationService({ logger }, {
        from: "ops@example.com",
        base_url: "",
        api_key: "secret",
        auth_type: "smtp-api",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => new postal_1.PostalNotificationService({ logger }, {
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: "",
        auth_type: "smtp-api",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => postal_1.PostalNotificationService.validateOptions({
        from: " ",
        base_url: "https://postal.example.com",
        api_key: "secret",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => postal_1.PostalNotificationService.validateOptions({
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: " ",
    }), utils_1.MedusaError);
    strict_1.default.throws(() => postal_1.PostalNotificationService.validateOptions({
        from: "ops@example.com",
        api_key: "secret",
    }), utils_1.MedusaError);
});
(0, node_test_1.default)("validates options and builds a send payload", async () => {
    strict_1.default.doesNotThrow(() => postal_1.PostalNotificationService.validateOptions({
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: "secret",
    }));
    const service = createService();
    const fetchMock = (async () => ({
        ok: true,
        json: async () => ({
            status: "ok",
            data: {
                message_id: "msg_1",
                messages: {},
            },
        }),
    }));
    globalThis.fetch = fetchMock;
    const result = await service.send({
        to: [{ email: " user1@example.com " }, "user2@example.com"],
        from: "orders@example.com",
        provider_data: {
            from_name: "Orders Team",
            reply_to: "reply@example.com",
            subject: "Order confirmation",
            html: "<p>Hello <strong>there</strong></p>",
            headers: {
                "X-Trace-Id": " trace-1 ",
                Subject: "drop-me",
                "X-Bad": "line1\nline2",
            },
            custom_args: {
                order_id: "ord_1",
                nested: { ignored: true },
            },
            cc: ["cc@example.com", " "],
            bcc: "bcc@example.com",
            workflow_event: "order.placed",
            workflow_run_id: "wf_123",
        },
        content: {
            subject: "Order confirmation",
            html: "<p>Hello <strong>there</strong></p>",
        },
        template: "order-placed",
        attachments: [
            {
                filename: "invoice.pdf",
                content: "aGVsbG8=",
                content_type: "application/pdf",
            },
            {
                filename: "",
                content: "ignored",
            },
        ],
    });
    strict_1.default.deepEqual(result, { id: "msg_1" });
});
(0, node_test_1.default)("wraps Postal API failures as Medusa errors", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: false,
        status: 500,
        json: async () => ({
            status: "error",
            data: { message: "boom" },
        }),
    }));
    await strict_1.default.rejects(() => service.getMessageDetails("123"), utils_1.MedusaError);
});
(0, node_test_1.default)("wraps Postal API failures that only expose an error field", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: false,
        status: 422,
        json: async () => ({
            status: "error",
            data: { error: "bad payload" },
        }),
    }));
    await strict_1.default.rejects(() => service.getMessageDeliveries("123"), /Postal API request failed: 422 - bad payload/);
});
(0, node_test_1.default)("wraps Postal API failures that only expose a status string", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: false,
        status: 503,
        json: async () => ({
            status: "error",
            data: {},
        }),
    }));
    await strict_1.default.rejects(() => service.getMessageDetails("123"), /Postal API request failed: 503 - error/);
});
(0, node_test_1.default)("wraps Postal API responses that do not parse cleanly", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: true,
        json: async () => {
            throw new Error("invalid json");
        },
    }));
    await strict_1.default.rejects(() => service.getMessageDetails("123"), /Postal API request failed: undefined - unknown error/);
});
(0, node_test_1.default)("send validates notification shape and wraps unexpected fetch errors", async () => {
    const service = createService();
    await strict_1.default.rejects(() => service.send(undefined), /No notification information provided/);
    await strict_1.default.rejects(() => service.send({
        to: [],
        provider_data: {},
        template: "default",
    }), /Postal notification requires at least one recipient/);
    globalThis.fetch = (async () => {
        throw new Error("socket closed");
    });
    await strict_1.default.rejects(() => service.send({
        to: ["user@example.com"],
        provider_data: {
            subject: "Order confirmation",
        },
        template: "order-placed",
    }), (error) => error instanceof utils_1.MedusaError &&
        /Failed to send email with Postal API: socket closed/.test(error.message));
});
(0, node_test_1.default)("send rejects when the sender from address is missing", async () => {
    const service = createService();
    service.config_.from = "";
    await strict_1.default.rejects(() => service.send({
        to: ["user@example.com"],
        content: {
            subject: "Order confirmation",
        },
        template: "order-placed",
    }), /Postal notification requires a from address/);
});
(0, node_test_1.default)("send rethrows Postal API Medusa errors and supports empty provider data", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: false,
        status: 400,
        json: async () => ({
            status: "error",
            data: { message: "bad request" },
        }),
    }));
    await strict_1.default.rejects(() => service.send({
        to: ["user@example.com"],
        content: {
            subject: "Order confirmation",
            html: "<p>Thanks</p>",
        },
        template: "order-placed",
    }), (error) => error instanceof utils_1.MedusaError &&
        /Postal API request failed: 400 - bad request/.test(error.message));
});
(0, node_test_1.default)("lookup helpers normalize ids and fetch the expected endpoints", async () => {
    const service = createService();
    const calls = [];
    globalThis.fetch = (async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        return {
            ok: true,
            json: async () => ({
                status: "ok",
                data: {
                    message_id: "msg_42",
                },
            }),
        };
    });
    await strict_1.default.rejects(() => service.getMessageDetails("12x"), utils_1.MedusaError);
    const details = await service.getMessageDetails("42");
    const deliveries = await service.getMessageDeliveries(99);
    strict_1.default.deepEqual(details, { message_id: "msg_42" });
    strict_1.default.deepEqual(deliveries, { message_id: "msg_42" });
    strict_1.default.equal(calls[0]?.url, "https://postal.example.com/api/v1/messages/message");
    strict_1.default.deepEqual(calls[0]?.body, { id: 42, _expansions: true });
    strict_1.default.equal(calls[1]?.url, "https://postal.example.com/api/v1/messages/deliveries");
    strict_1.default.deepEqual(calls[1]?.body, { id: 99 });
});
(0, node_test_1.default)("send falls back to notification.data and recipient message ids", async () => {
    const service = createService();
    const calls = [];
    globalThis.fetch = (async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        return {
            ok: true,
            json: async () => ({
                status: "ok",
                data: {
                    message_id: "",
                    messages: {
                        "user@example.com": {
                            id: 321,
                        },
                    },
                },
            }),
        };
    });
    const result = await service.send({
        to: ["user@example.com"],
        data: {
            from: "orders@example.com",
            from_name: "Orders",
            reply_to: "reply@example.com",
            subject: "Order confirmation",
            text: "Thanks for your order",
            headers: {
                "Reply-To": "reply@example.com",
                "List-Unsubscribe": "<mailto:unsubscribe@example.com>",
                "X-Trace-Id": "trace-2",
            },
            custom_args: {
                order_id: "ord_2",
            },
            workflow_event: "order.placed",
            workflow_run_id: "wf_456",
        },
        template: "order-placed",
    });
    strict_1.default.deepEqual(result, { id: "321" });
    strict_1.default.equal(calls[0]?.url, "https://postal.example.com/api/v1/send/message");
    strict_1.default.equal(calls[0]?.body.to[0], "user@example.com");
    strict_1.default.equal(calls[0]?.body.cc?.[0], undefined);
    strict_1.default.equal(calls[0]?.body.bcc?.[0], undefined);
    strict_1.default.equal(calls[0]?.body.from, "Orders <orders@example.com>");
    strict_1.default.equal(calls[0]?.body.reply_to, "reply@example.com");
    strict_1.default.equal(calls[0]?.body.subject, "Order confirmation");
    strict_1.default.match(calls[0]?.body.html_body, /<title>Order confirmation<\/title>/);
    strict_1.default.match(calls[0]?.body.plain_body, /Thanks for your order/);
    strict_1.default.equal(calls[0]?.body.tag, `${POSTAL_WEBHOOK_TAG_PREFIX}order-placed`);
    strict_1.default.equal(calls[0]?.body.headers["Reply-To"], "reply@example.com");
    strict_1.default.equal(calls[0]?.body.headers["List-Unsubscribe"], "<mailto:unsubscribe@example.com>");
    strict_1.default.equal(calls[0]?.body.headers["X-Postal-Custom-Arg-order-id"], "ord_2");
});
(0, node_test_1.default)("send omits Reply-To when the sender reply_to is invalid", async () => {
    const service = createService();
    globalThis.fetch = (async () => ({
        ok: true,
        json: async () => ({
            status: "ok",
            data: {
                message_id: "msg_2",
                messages: {},
            },
        }),
    }));
    const result = await service.send({
        to: ["user@example.com"],
        provider_data: {
            from: "orders@example.com",
            reply_to: "bad\r\nreply@example.com",
            subject: "Order confirmation",
        },
        template: "order-placed",
    });
    strict_1.default.deepEqual(result, { id: "msg_2" });
});
(0, node_test_1.default)("send builds a payload from provider_data headers without attachments", async () => {
    const service = createService();
    const calls = [];
    globalThis.fetch = (async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        return {
            ok: true,
            json: async () => ({
                status: "ok",
                data: {
                    message_id: "msg_3",
                    messages: {},
                },
            }),
        };
    });
    const result = await service.send({
        to: ["user@example.com"],
        provider_data: {
            from: "orders@example.com",
            reply_to: "reply@example.com",
            subject: "Order confirmation",
            headers: {
                "X-Trace-Id": "trace-3",
            },
            custom_args: {
                order_id: "ord_3",
            },
        },
        template: "order-placed",
    });
    strict_1.default.deepEqual(result, { id: "msg_3" });
    strict_1.default.equal(calls[0]?.body.headers["X-Trace-Id"], "trace-3");
    strict_1.default.equal(calls[0]?.body.attachments, undefined);
});
(0, node_test_1.default)("helper methods normalize addresses, attachments, and health snapshots", () => {
    const service = createService();
    const normalizeEmails = service.normalizeEmails.bind(service);
    const normalizeAttachments = service.normalizeAttachments.bind(service);
    const stripHtml = service.stripHtml.bind(service);
    const getFirstRecipientMessage = service.getFirstRecipientMessage.bind(service);
    const normalizePostalLookupId = service.normalizePostalLookupId.bind(service);
    strict_1.default.deepEqual(normalizeEmails([" user@example.com ", { email: "ops@example.com" }, "", null]), [
        "user@example.com",
        "ops@example.com",
    ]);
    strict_1.default.deepEqual(normalizeEmails(undefined), []);
    strict_1.default.deepEqual(normalizeAttachments(null), undefined);
    strict_1.default.deepEqual(normalizeAttachments([
        { filename: "invoice.pdf", content: "abc", content_type: "application/pdf" },
        { filename: "skip.pdf" },
    ]), [
        {
            name: "invoice.pdf",
            content_type: "application/pdf",
            data: "abc",
        },
    ]);
    strict_1.default.equal(stripHtml("<p>Hello <strong>world</strong></p>"), "Hello world");
    strict_1.default.equal(getFirstRecipientMessage(null), null);
    strict_1.default.deepEqual(getFirstRecipientMessage({
        "recipient@example.com": { id: "" },
        "ops@example.com": { id: 123, token: "tok_123" },
    }), {
        recipient: "ops@example.com",
        id: "123",
        token: "tok_123",
    });
    strict_1.default.equal(normalizePostalLookupId("42"), 42);
    strict_1.default.throws(() => normalizePostalLookupId(" 42x "), utils_1.MedusaError);
    strict_1.default.deepEqual(service.getHealthSnapshot(), {
        auth_type: "api",
        mode: "api",
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3Bvc3RhbC9zZXJ2aWNlcy9wb3N0YWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMscURBQXVEO0FBQ3ZELHFDQUFvRDtBQUVwRCxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFBO0FBQ3RDLE1BQU0seUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFDMUUsTUFBTSxNQUFNLEdBQUc7SUFDYixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUNyQixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUN0QixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUNyQixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztDQUN2QixDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQUcsR0FBRyxFQUFFLENBQ3pCLElBQUksa0NBQXlCLENBQzNCLEVBQUUsTUFBTSxFQUFFLEVBQ1Y7SUFDRSxJQUFJLEVBQUUsaUJBQWlCO0lBQ3ZCLFFBQVEsRUFBRSw2QkFBNkI7SUFDdkMsT0FBTyxFQUFFLFFBQVE7SUFDakIsU0FBUyxFQUFFLFVBQVU7Q0FDdEIsQ0FDRixDQUFBO0FBRUgsbUJBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLFVBQVUsQ0FBQyxLQUFLLEdBQUcsU0FBa0IsQ0FBQTtBQUN2QyxDQUFDLENBQUMsQ0FBQTtBQUVGLG1CQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNkLFVBQVUsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFBO0FBQ2xDLENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBQSxtQkFBSSxFQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtJQUMxRSxnQkFBTSxDQUFDLE1BQU0sQ0FDWCxHQUFHLEVB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
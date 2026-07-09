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
(0, node_test_1.default)("send rejects CR/LF header injection in subject and recipients", async () => {
    const service = createService();
    const fetchMock = (async () => ({
        ok: true,
        json: async () => ({ status: "ok", data: { message_id: "msg_x", messages: {} } }),
    }));
    globalThis.fetch = fetchMock;
    await strict_1.default.rejects(() => service.send({
        to: ["user@example.com"],
        from: "orders@example.com",
        provider_data: { subject: "Hello\r\nBcc: victim@example.com" },
        content: { subject: "Hello\r\nBcc: victim@example.com", html: "<p>x</p>" },
        template: "order-placed",
    }), utils_1.MedusaError);
    await strict_1.default.rejects(() => service.send({
        to: ["user@example.com\r\nBcc: victim@example.com"],
        from: "orders@example.com",
        provider_data: { subject: "Hello" },
        content: { subject: "Hello", html: "<p>x</p>" },
        template: "order-placed",
    }), utils_1.MedusaError);
});
(0, node_test_1.default)("constructor rejects a non-http(s) base_url", () => {
    strict_1.default.throws(() => new postal_1.PostalNotificationService({ logger }, {
        from: "ops@example.com",
        base_url: "ftp://postal.example.com",
        api_key: "secret",
        auth_type: "smtp-api",
    }), utils_1.MedusaError);
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
        auth_type: "smtp-api",
        mode: "api",
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3Bvc3RhbC9zZXJ2aWNlcy9wb3N0YWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMscURBQXVEO0FBQ3ZELHFDQUFvRDtBQUVwRCxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFBO0FBQ3RDLE1BQU0seUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFDMUUsTUFBTSxNQUFNLEdBQUc7SUFDYixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUNyQixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUN0QixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztJQUNyQixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztDQUN2QixDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQUcsR0FBRyxFQUFFLENBQ3pCLElBQUksa0NBQXlCLENBQzNCLEVBQUUsTUFBTSxFQUFFLEVBQ1Y7SUFDRSxJQUFJLEVBQUUsaUJBQWlCO0lBQ3ZCLFFBQVEsRUFBRSw2QkFBNkI7SUFDdkMsT0FBTyxFQUFFLFFBQVE7SUFDakIsU0FBUyxFQUFFLFVBQVU7Q0FDdEIsQ0FDRixDQUFBO0FBRUgsbUJBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLFVBQVUsQ0FBQyxLQUFLLEdBQUcsU0FBa0IsQ0FBQTtBQUN2QyxDQUFDLENBQUMsQ0FBQTtBQUVGLG1CQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNkLFVBQVUsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFBO0FBQ2xDLENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBQSxtQkFBSSxFQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtJQUMxRSxnQkFBTSxDQUFDLE1BQU0sQ0FDWCxHQUFHLEVB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
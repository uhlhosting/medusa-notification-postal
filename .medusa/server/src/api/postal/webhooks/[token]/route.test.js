"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const route_1 = require("./route");
const WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:";
(0, node_test_1.default)("postal webhook route accepts a MessageSent payload and returns 202", async () => {
    const previousToken = process.env.POSTAL_WEBHOOK_TOKEN;
    process.env.POSTAL_WEBHOOK_TOKEN = "postal-webhook-token-test";
    try {
        const payload = {
            message: {
                id: 28638,
                token: "message-token-test",
                direction: "outgoing",
                message_id: "20260630171223.124694.63496@uhlhosting.ch",
                to: "cosmin@uhlhost.net",
                from: "sentry@uhlhosting.ch",
                subject: "[Sentry] PHP-CP-ALL-34 - ErrorException: Warning: Constant SAVEQUERIES already defined",
                timestamp: 1782839544.2800682,
                spam_status: "NotSpam",
                tag: `${WEBHOOK_TAG_PREFIX}order-placed`,
            },
            status: "Sent",
            details: "Message for cosmin@uhlhost.net accepted by 91.98.211.155:25 (mail.uhlhost.net)",
            output: "250 2.0.0 Ok: queued as AEE3E12055E",
            sent_with_ssl: true,
            timestamp: 1782839545.7319343,
            time: 0.11,
            event_type: "MessageSent",
        };
        const req = {
            params: {
                token: "postal-webhook-token-test",
            },
            body: payload,
            scope: {},
        };
        const responseBody = {};
        const res = {
            status(code) {
                responseBody.status = code;
                return {
                    json(payload) {
                        responseBody.payload = payload;
                        return payload;
                    },
                };
            },
        };
        await (0, route_1.POST)(req, res);
        strict_1.default.equal(responseBody.status, 202);
        strict_1.default.equal(responseBody.payload.ok, true);
        strict_1.default.equal(responseBody.payload.status, "sent");
        strict_1.default.equal(responseBody.payload.event_type, "message.sent");
    }
    finally {
        if (previousToken === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previousToken;
        }
    }
});
(0, node_test_1.default)("postal webhook route acknowledges the webhook when persistence fails", async () => {
    const previousToken = process.env.POSTAL_WEBHOOK_TOKEN;
    process.env.POSTAL_WEBHOOK_TOKEN = "token_abc";
    try {
        const req = {
            params: { token: "token_abc" },
            body: {
                event_type: "MessageSent",
                status: "Sent",
                message: {
                    message_id: "msg_123",
                    to: "customer@uhlhost.net",
                    tag: `${WEBHOOK_TAG_PREFIX}order-placed`,
                },
            },
            scope: {
                resolve: () => ({
                    raw: async () => {
                        throw new Error("database unavailable");
                    },
                }),
            },
        };
        const responseBody = {};
        const res = {
            status(code) {
                responseBody.status = code;
                return {
                    json(payload) {
                        responseBody.payload = payload;
                        return payload;
                    },
                };
            },
        };
        await (0, route_1.POST)(req, res);
        strict_1.default.equal(responseBody.status, 202);
        strict_1.default.equal(responseBody.payload.ok, true);
        strict_1.default.equal(responseBody.payload.status, "sent");
        strict_1.default.equal(responseBody.payload.event_type, "message.sent");
    }
    finally {
        if (previousToken === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previousToken;
        }
    }
});
(0, node_test_1.default)("postal webhook route ignores non-plugin webhook payloads", async () => {
    const previousToken = process.env.POSTAL_WEBHOOK_TOKEN;
    process.env.POSTAL_WEBHOOK_TOKEN = "token_abc";
    try {
        const req = {
            params: { token: "token_abc" },
            body: {
                event_type: "MessageSent",
                status: "Sent",
                message: {
                    message_id: "msg_external",
                    to: "customer@uhlhost.net",
                    tag: "external-app:order-placed",
                },
            },
            scope: {
                resolve: () => ({
                    raw: async () => {
                        throw new Error("should not be called");
                    },
                }),
            },
        };
        const responseBody = {};
        const res = {
            status(code) {
                responseBody.status = code;
                return {
                    json(payload) {
                        responseBody.payload = payload;
                        return payload;
                    },
                };
            },
        };
        await (0, route_1.POST)(req, res);
        strict_1.default.equal(responseBody.status, 202);
        strict_1.default.equal(responseBody.payload.ok, true);
        strict_1.default.equal(responseBody.payload.ignored, true);
        strict_1.default.equal(responseBody.payload.id, undefined);
    }
    finally {
        if (previousToken === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previousToken;
        }
    }
});
(0, node_test_1.default)("postal webhook route ignores untagged sent messages", async () => {
    const previousToken = process.env.POSTAL_WEBHOOK_TOKEN;
    process.env.POSTAL_WEBHOOK_TOKEN = "token_abc";
    try {
        const req = {
            params: { token: "token_abc" },
            body: {
                event_type: "MessageSent",
                status: "Sent",
                message: {
                    message_id: "msg_untagged",
                    to: "customer@uhlhost.net",
                },
            },
            scope: {
                resolve: () => ({
                    raw: async () => {
                        throw new Error("should not be called");
                    },
                }),
            },
        };
        const responseBody = {};
        const res = {
            status(code) {
                responseBody.status = code;
                return {
                    json(payload) {
                        responseBody.payload = payload;
                        return payload;
                    },
                };
            },
        };
        await (0, route_1.POST)(req, res);
        strict_1.default.equal(responseBody.status, 202);
        strict_1.default.equal(responseBody.payload.ok, true);
        strict_1.default.equal(responseBody.payload.ignored, true);
    }
    finally {
        if (previousToken === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previousToken;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvcG9zdGFsL3dlYmhvb2tzL1t0b2tlbl0vcm91dGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMsbUNBQThCO0FBRTlCLE1BQU0sa0JBQWtCLEdBQUcsd0NBQXdDLENBQUE7QUFFbkUsSUFBQSxtQkFBSSxFQUFDLG9FQUFvRSxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ3BGLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUE7SUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsR0FBRywyQkFBMkIsQ0FBQTtJQUU5RCxJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRztZQUNkLE9BQU8sRUFBRTtnQkFDUCxFQUFFLEVBQUUsS0FBSztnQkFDVCxLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixTQUFTLEVBQUUsVUFBVTtnQkFDckIsVUFBVSxFQUFFLDJDQUEyQztnQkFDdkQsRUFBRSxFQUFFLG9CQUFvQjtnQkFDeEIsSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsT0FBTyxFQUNMLHdGQUF3RjtnQkFDMUYsU0FBUyxFQUFFLGtCQUFrQjtnQkFDN0IsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLEdBQUcsRUFBRSxHQUFHLGtCQUFrQixjQUFjO2FBQ3pDO1lBQ0QsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQ0wsZ0ZBQWdGO1lBQ2xGLE1BQU0sRUFBRSxxQ0FBcUM7WUFDN0MsYUFBYSxFQUFFLElBQUk7WUFDbkIsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixJQUFJLEVBQUUsSUFBSTtZQUNWLFVBQVUsRUFBRSxhQUFhO1NBQzFCLENBQUE7UUFFRCxNQUFNLEdBQUcsR0FBRztZQUNWLE1BQU0sRUFBRTtnQkFDTixLQUFLLEVBQUUsMkJB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
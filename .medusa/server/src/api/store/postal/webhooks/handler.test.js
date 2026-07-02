"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const handler_1 = require("./handler");
(0, node_test_1.default)("handlePostalWebhookPost uses validated body and returns workflow result", async () => {
    const calls = [];
    const scope = {
        resolve: (name) => {
            strict_1.default.equal(name, "pgConnection");
            return {};
        },
    };
    const response = await (0, handler_1.handlePostalWebhookPost)({
        scope,
        body: {
            event: "ignored",
        },
        validatedBody: {
            event_type: "message.sent",
            status: "sent",
        },
        runWebhookWorkflow: async (payload) => {
            calls.push({ input: payload });
            return {
                result: {
                    id: "postal_webhook_123",
                    event_type: "message.sent",
                    status: "sent",
                },
            };
        },
    });
    strict_1.default.equal(calls.length, 1);
    strict_1.default.deepEqual(calls[0]?.input, {
        event_type: "message.sent",
        status: "sent",
    });
    strict_1.default.equal(response.status, 202);
    strict_1.default.equal(response.body.id, "postal_webhook_123");
    strict_1.default.equal(response.body.status, "sent");
});
(0, node_test_1.default)("handlePostalWebhookPost falls back to the workflow path when no helper is injected", async () => {
    const scope = {
        resolve: () => null,
    };
    const response = await (0, handler_1.handlePostalWebhookPost)({
        scope,
        body: {
            event_type: "message.sent",
            status: "sent",
            message: {
                tag: "uhlhosting.medusa-notification-postal:postal-test",
            },
        },
    });
    strict_1.default.equal(response.status, 202);
    strict_1.default.equal(response.body.ok, true);
    strict_1.default.equal(response.body.event_type, "message.sent");
    strict_1.default.equal(response.body.status, "sent");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FwaS9zdG9yZS9wb3N0YWwvd2ViaG9va3MvaGFuZGxlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyx1Q0FBbUQ7QUFFbkQsSUFBQSxtQkFBSSxFQUFDLHlFQUF5RSxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ3pGLE1BQU0sS0FBSyxHQUE4QyxFQUFFLENBQUE7SUFDM0QsTUFBTSxLQUFLLEdBQUc7UUFDWixPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUN4QixnQkFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUE7WUFDbEMsT0FBTyxFQUFFLENBQUE7UUFDWCxDQUFDO0tBQ0YsQ0FBQTtJQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSxpQ0FBdUIsRUFBQztRQUM3QyxLQUFLO1FBQ0wsSUFBSSxFQUFFO1lBQ0osS0FBSyxFQUFFLFNBQVM7U0FDakI7UUFDRCxhQUFhLEVBQUU7WUFDYixVQUFVLEVBQUUsY0FBYztZQUMxQixNQUFNLEVBQUUsTUFBTTtTQUNmO1FBQ0Qsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUM5QixPQUFPO2dCQUNMLE1BQU0sRUFBRTtvQkFDTixFQUFFLEVBQUUsb0JBQW9CO29CQUN4QixVQUFVLEVBQUUsY0FBYztvQkFDMUIsTUFBTSxFQUFFLE1BQU07aUJBQ2Y7YUFDRixDQUFBO1FBQ0gsQ0FBQztLQUNGLENBQUMsQ0FBQTtJQUVGLGdCQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDN0IsZ0JBQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRTtRQUNoQyxVQUFVLEVBQUUsY0FBYztRQUMxQixNQUFNLEVBQUUsTUFBTTtLQUNmLENBQUMsQ0FBQTtJQUNGLGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDbEMsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtJQUNwRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM1QyxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUEsbUJBQUksRUFBQyxvRkFBb0YsRUFBRSxLQUFLLElBQUksRUFBRTtJQUNwRyxNQUFNLEtBQUssR0FBRztRQUNaLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJO0tBQ3BCLENBQUE7SUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsaUNBQXVCLEVBQUM7UUFDN0MsS0FBSztRQUNMLElBQUksRUFBRTtZQUNKLFVBQVUsRUFBRSxjQUFjO1lBQzFCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLEdBQUcsRUFBRSxtREFBbUQ7YUFDekQ7U0FDRjtLQUNGLENBQUMsQ0FBQTtJQUVGLGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDbEMsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDcEMsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDdEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDNUMsQ0FBQyxDQUFDLENBQUEifQ==
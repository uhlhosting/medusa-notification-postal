"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const route_1 = require("./route");
(0, node_test_1.default)("admin webhook route returns webhook events from the module service", async () => {
    let lastConfig;
    const service = {
        listPostalWebhookEvents: async (_filter, config) => {
            lastConfig = config;
            return [
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
            ];
        },
    };
    const req = {
        scope: { resolve: () => service },
        query: { limit: "500" },
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
    await (0, route_1.GET)(req, res);
    strict_1.default.equal(responseBody.status, 200);
    // Limit is clamped to 100.
    strict_1.default.equal(lastConfig?.take, 100);
    strict_1.default.equal(responseBody.payload.events[0].id, "postal_webhook_1");
    strict_1.default.equal(responseBody.payload.events[0].status, "sent");
});
(0, node_test_1.default)("admin webhook route returns an empty list when the module is unavailable", async () => {
    const req = {
        scope: {
            resolve: () => {
                throw new Error("module not registered");
            },
        },
        query: {},
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
    await (0, route_1.GET)(req, res);
    strict_1.default.equal(responseBody.status, 200);
    strict_1.default.deepEqual(responseBody.payload.events, []);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vcG9zdGFsL3dlYmhvb2tzL3JvdXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLG1DQUE2QjtBQUU3QixJQUFBLG1CQUFJLEVBQUMsb0VBQW9FLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDcEYsSUFBSSxVQUFlLENBQUE7SUFDbkIsTUFBTSxPQUFPLEdBQUc7UUFDZCx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLE1BQVcsRUFBRSxFQUFFO1lBQzNELFVBQVUsR0FBRyxNQUFNLENBQUE7WUFDbkIsT0FBTztnQkFDTDtvQkFDRSxFQUFFLEVBQUUsa0JBQWtCO29CQUN0QixVQUFVLEVBQUUsY0FBYztvQkFDMUIsTUFBTSxFQUFFLE1BQU07b0JBQ2QsVUFBVSxFQUFFLE9BQU87b0JBQ25CLFNBQVMsRUFBRSx1QkFBdUI7b0JBQ2xDLFdBQVcsRUFBRSwwQkFBMEI7b0JBQ3ZDLFVBQVUsRUFBRSwwQkFBMEI7b0JBQ3RDLE9BQU8sRUFBRSxFQUFFO2lCQUNaO2FBQ0YsQ0FBQTtRQUNILENBQUM7S0FDRixDQUFBO0lBRUQsTUFBTSxHQUFHLEdBQUc7UUFDVixLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFO1FBQ2pDLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7S0FDakIsQ0FBQTtJQUVSLE1BQU0sWUFBWSxHQUFRLEVBQUUsQ0FBQTtJQUM1QixNQUFNLEdBQUcsR0FBRztRQUNWLE1BQU0sQ0FBQyxJQUFZO1lBQ2pCLFlBQVksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO1lBQzFCLE9BQU87Z0JBQ0wsSUFBSSxDQUFDLE9BQVk7b0JBQ2YsWUFBWSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7b0JBQzlCLE9BQU8sT0FBTyxDQUFBO2dCQUNoQixDQUFDO2FBQ0YsQ0FBQTtRQUNILENBQUM7S0FDSyxDQUFBO0lBRVIsTUFBTSxJQUFBLFdBQUcsRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFbkIsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUN0QywyQkFBMkI7SUFDM0IsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNuQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtJQUNuRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDN0QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFBLG1CQUFJLEVBQUMsMEVBQTBFLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDMUYsTUFBTSxHQUFHLEdBQUc7UUFDVixLQUFLLEVBQUU7WUFDTCxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtZQUMxQyxDQUFDO1NBQ0Y7UUFDRCxLQUFLLEVBQUUsRUFBRTtLQUNILENBQUE7SUFFUixNQUFNLFlBQVksR0FBUSxFQUFFLENBQUE7SUFDNUIsTUFBTSxHQUFHLEdBQUc7UUFDVixNQUFNLENBQUMsSUFBWTtZQUNqQixZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtZQUMxQixPQUFPO2dCQUNMLElBQUksQ0FBQyxPQUFZO29CQUNmLFlBQVksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO29CQUM5QixPQUFPLE9BQU8sQ0FBQTtnQkFDaEIsQ0FBQzthQUNGLENBQUE7UUFDSCxDQUFDO0tBQ0ssQ0FBQTtJQUVSLE1BQU0sSUFBQSxXQUFHLEVBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBRW5CLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDdEMsZ0JBQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDbkQsQ0FBQyxDQUFDLENBQUEifQ==
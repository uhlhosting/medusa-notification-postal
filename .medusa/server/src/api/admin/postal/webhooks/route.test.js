"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const route_1 = require("./route");
(0, node_test_1.default)("admin webhook route returns webhook events from pgConnection", async () => {
    const calls = [];
    const pgConnection = {
        raw: async (sql, params) => {
            calls.push({ sql, params });
            return {
                rows: [
                    {
                        id: "postal_webhook_1",
                        event_type: "message.sent",
                        status: "sent",
                        message_id: "msg_1",
                        recipient: "recipient@uhlhosting.ch",
                        occurred_at: "2026-06-28T12:00:00.000Z",
                        created_at: "2026-06-28T12:01:00.000Z",
                        payload: {},
                    },
                ],
            };
        },
    };
    const req = {
        scope: {
            resolve: (name) => {
                strict_1.default.equal(name, "pgConnection");
                return pgConnection;
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
    strict_1.default.equal(calls.length, 1);
    strict_1.default.equal(responseBody.status, 200);
    strict_1.default.equal(responseBody.payload.events[0].id, "postal_webhook_1");
    strict_1.default.equal(responseBody.payload.events[0].status, "sent");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vcG9zdGFsL3dlYmhvb2tzL3JvdXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLG1DQUE2QjtBQUU3QixJQUFBLG1CQUFJLEVBQUMsOERBQThELEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDOUUsTUFBTSxLQUFLLEdBQStDLEVBQUUsQ0FBQTtJQUM1RCxNQUFNLFlBQVksR0FBRztRQUNuQixHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQVcsRUFBRSxNQUFrQixFQUFFLEVBQUU7WUFDN0MsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1lBQzNCLE9BQU87Z0JBQ0wsSUFBSSxFQUFFO29CQUNKO3dCQUNFLEVBQUUsRUFBRSxrQkFBa0I7d0JBQ3RCLFVBQVUsRUFBRSxjQUFjO3dCQUMxQixNQUFNLEVBQUUsTUFBTTt3QkFDZCxVQUFVLEVBQUUsT0FBTzt3QkFDbkIsU0FBUyxFQUFFLHlCQUF5Qjt3QkFDcEMsV0FBVyxFQUFFLDBCQUEwQjt3QkFDdkMsVUFBVSxFQUFFLDBCQUEwQjt3QkFDdEMsT0FBTyxFQUFFLEVBQUU7cUJBQ1o7aUJBQ0Y7YUFDRixDQUFBO1FBQ0gsQ0FBQztLQUNGLENBQUE7SUFFRCxNQUFNLEdBQUcsR0FBRztRQUNWLEtBQUssRUFBRTtZQUNMLE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUN4QixnQkFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUE7Z0JBQ2xDLE9BQU8sWUFBWSxDQUFBO1lBQ3JCLENBQUM7U0FDRjtRQUNELEtBQUssRUFBRSxFQUFFO0tBQ0gsQ0FBQTtJQUVSLE1BQU0sWUFBWSxHQUFRLEVBQUUsQ0FBQTtJQUM1QixNQUFNLEdBQUcsR0FBRztRQUNWLE1BQU0sQ0FBQyxJQUFZO1lBQ2pCLFlBQVksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO1lBQzFCLE9BQU87Z0JBQ0wsSUFBSSxDQUFDLE9BQVk7b0JBQ2YsWUFBWSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7b0JBQzlCLE9BQU8sT0FBTyxDQUFBO2dCQUNoQixDQUFDO2FBQ0YsQ0FBQTtRQUNILENBQUM7S0FDSyxDQUFBO0lBRVIsTUFBTSxJQUFBLFdBQUcsRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFbkIsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM3QixnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3RDLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0lBQ25FLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM3RCxDQUFDLENBQUMsQ0FBQSJ9
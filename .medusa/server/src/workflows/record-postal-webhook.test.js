"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const record_postal_webhook_1 = require("./record-postal-webhook");
(0, node_test_1.default)("recordPostalWebhookWorkflow returns the recorded webhook event", async () => {
    const workflow = (0, record_postal_webhook_1.recordPostalWebhookWorkflow)({
        resolve: () => ({ raw: undefined }),
    });
    const result = await workflow.run({
        input: {
            event_type: "message.sent",
            status: "sent",
            message: {
                tag: "uhlhosting.medusa-notification-postal:postal-test",
            },
        },
    });
    const recorded = result.result;
    strict_1.default.notEqual(recorded, null);
    strict_1.default.equal(recorded.event_type, "message.sent");
    strict_1.default.equal(recorded.status, "sent");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLXBvc3RhbC13ZWJob29rLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3JlY29yZC1wb3N0YWwtd2ViaG9vay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2QyxtRUFBcUU7QUFFckUsSUFBQSxtQkFBSSxFQUFDLGdFQUFnRSxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ2hGLE1BQU0sUUFBUSxHQUFHLElBQUEsbURBQTJCLEVBQUM7UUFDM0MsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDM0IsQ0FBQyxDQUFBO0lBRVgsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDO1FBQ2hDLEtBQUssRUFBRTtZQUNMLFVBQVUsRUFBRSxjQUFjO1lBQzFCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLEdBQUcsRUFBRSxtREFBbUQ7YUFDekQ7U0FDRjtLQUNGLENBQUMsQ0FBQTtJQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUEyQyxDQUFBO0lBQ25FLGdCQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMvQixnQkFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQ2pELGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDdkMsQ0FBQyxDQUFDLENBQUEifQ==
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const send_postal_email_1 = require("./steps/send-postal-email");
(0, node_test_1.default)("buildPostalNotificationInput creates a typed email notification", () => {
    const providerData = {
        from: "no-reply@example.com",
        from_name: undefined,
        reply_to: undefined,
        subject: "Postal test",
        text: "Postal test body",
        html: "<p>Postal test body</p>",
        cc: undefined,
        bcc: undefined,
        headers: undefined,
        custom_args: undefined,
        metadata: undefined,
        workflow_event: "postal.admin.test",
        workflow_run_id: "admin_test_1",
    };
    const notification = (0, send_postal_email_1.buildPostalNotificationInput)({
        to: "recipient@example.com",
        from: "no-reply@example.com",
        template: "postal-test",
        provider_data: {
            subject: providerData.subject,
            text: providerData.text,
            html: providerData.html,
            workflow_event: providerData.workflow_event,
            workflow_run_id: providerData.workflow_run_id,
        },
    }, "recipient@example.com", "postal-test", providerData);
    strict_1.default.equal(notification.channel, "email");
    strict_1.default.equal(notification.template, "postal-test");
    strict_1.default.equal(notification.provider_data.workflow_event, "postal.admin.test");
    strict_1.default.equal(notification.provider_data.workflow_run_id, "admin_test_1");
    strict_1.default.deepEqual(notification.data, notification.provider_data);
    // Idempotency key derived from run id + template + recipient dedupes retries.
    strict_1.default.equal(notification.idempotency_key, "postal:admin_test_1:postal-test:recipient@example.com");
});
(0, node_test_1.default)("buildPostalNotificationInput omits idempotency_key without a workflow run id", () => {
    const notification = (0, send_postal_email_1.buildPostalNotificationInput)({
        to: "recipient@example.com",
        provider_data: { subject: "Hi" },
    }, "recipient@example.com", "postal-test", { subject: "Hi" });
    strict_1.default.equal(notification.idempotency_key, undefined);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc2VuZC1wb3N0YWwtZW1haWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMsaUVBQXdFO0FBRXhFLElBQUEsbUJBQUksRUFBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7SUFDM0UsTUFBTSxZQUFZLEdBQUc7UUFDbkIsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixTQUFTLEVBQUUsU0FBUztRQUNwQixRQUFRLEVBQUUsU0FBUztRQUNuQixPQUFPLEVBQUUsYUFBYTtRQUN0QixJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsRUFBRSxFQUFFLFNBQVM7UUFDYixHQUFHLEVBQUUsU0FBUztRQUNkLE9BQU8sRUFBRSxTQUFTO1FBQ2xCLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLFFBQVEsRUFBRSxTQUFTO1FBQ25CLGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMsZUFBZSxFQUFFLGNBQWM7S0FDaEMsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsZ0RBQTRCLEVBQy9DO1FBQ0UsRUFBRSxFQUFFLHVCQUF1QjtRQUMzQixJQUFJLEVBQUUsc0JBQXNCO1FBQzVCLFFBQVEsRUFBRSxhQUFhO1FBQ3ZCLGFBQWEsRUFBRTtZQUNiLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTztZQUM3QixJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUk7WUFDdkIsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJO1lBQ3ZCLGNBQWMsRUFBRSxZQUFZLENBQUMsY0FBYztZQUMzQyxlQUFlLEVBQUUsWUFBWSxDQUFDLGVBQWU7U0FDOUM7S0FDRixFQUNELHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsWUFBWSxDQUNiLENBQUE7SUFFRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzNDLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDbEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtJQUM1RSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUN4RSxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUMvRCw4RUFBOEU7SUFDOUUsZ0JBQU0sQ0FBQyxLQUFLLENBQ1YsWUFBWSxDQUFDLGVBQWUsRUFDNUIsdURBQXVELENBQ3hELENBQUE7QUFDSCxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUEsbUJBQUksRUFBQyw4RUFBOEUsRUFBRSxHQUFHLEVBQUU7SUFDeEYsTUFBTSxZQUFZLEdBQUcsSUFBQSxnREFBNEIsRUFDL0M7UUFDRSxFQUFFLEVBQUUsdUJBQXVCO1FBQzNCLGFBQWEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7S0FDakMsRUFDRCx1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBVyxDQUMzQixDQUFBO0lBRUQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUN2RCxDQUFDLENBQUMsQ0FBQSJ9
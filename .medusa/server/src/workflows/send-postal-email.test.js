"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const send_postal_email_1 = require("./steps/send-postal-email");
(0, node_test_1.default)("buildPostalNotificationInput routes admin test sends through the postal provider", () => {
    const providerData = {
        from: "no-reply@uhl.site",
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
        to: "kosmos@highacid.com",
        from: "no-reply@uhl.site",
        template: "postal-test",
        provider_data: {
            subject: providerData.subject,
            text: providerData.text,
            html: providerData.html,
            workflow_event: providerData.workflow_event,
            workflow_run_id: providerData.workflow_run_id,
        },
    }, "kosmos@highacid.com", "postal-test", providerData);
    strict_1.default.equal(notification.provider_id, "postal");
    strict_1.default.equal(notification.channel, "email");
    strict_1.default.equal(notification.template, "postal-test");
    strict_1.default.equal(notification.provider_data.workflow_event, "postal.admin.test");
    strict_1.default.equal(notification.provider_data.workflow_run_id, "admin_test_1");
    strict_1.default.deepEqual(notification.data, notification.provider_data);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc2VuZC1wb3N0YWwtZW1haWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMsaUVBQXdFO0FBRXhFLElBQUEsbUJBQUksRUFBQyxrRkFBa0YsRUFBRSxHQUFHLEVBQUU7SUFDNUYsTUFBTSxZQUFZLEdBQUc7UUFDbkIsSUFBSSxFQUFFLG1CQUFtQjtRQUN6QixTQUFTLEVBQUUsU0FBUztRQUNwQixRQUFRLEVBQUUsU0FBUztRQUNuQixPQUFPLEVBQUUsYUFBYTtRQUN0QixJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsRUFBRSxFQUFFLFNBQVM7UUFDYixHQUFHLEVBQUUsU0FBUztRQUNkLE9BQU8sRUFBRSxTQUFTO1FBQ2xCLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLFFBQVEsRUFBRSxTQUFTO1FBQ25CLGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMsZUFBZSxFQUFFLGNBQWM7S0FDaEMsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsZ0RBQTRCLEVBQy9DO1FBQ0UsRUFBRSxFQUFFLHFCQUFxQjtRQUN6QixJQUFJLEVBQUUsbUJBQW1CO1FBQ3pCLFFBQVEsRUFBRSxhQUFhO1FBQ3ZCLGFBQWEsRUFBRTtZQUNiLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTztZQUM3QixJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUk7WUFDdkIsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJO1lBQ3ZCLGNBQWMsRUFBRSxZQUFZLENBQUMsY0FBYztZQUMzQyxlQUFlLEVBQUUsWUFBWSxDQUFDLGVBQWU7U0FDOUM7S0FDRixFQUNELHFCQUFxQixFQUNyQixhQUFhLEVBQ2IsWUFBWSxDQUNiLENBQUE7SUFFRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ2hELGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDM0MsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQTtJQUNsRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO0lBQzVFLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQ3hFLGdCQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ2pFLENBQUMsQ0FBQyxDQUFBIn0=
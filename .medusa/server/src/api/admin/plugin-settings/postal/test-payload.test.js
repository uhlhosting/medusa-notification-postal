"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const test_payload_1 = require("./test-payload");
(0, node_test_1.default)("buildPostalAdminTestProviderData uses template defaults when fields are empty", () => {
    const providerData = (0, test_payload_1.buildPostalAdminTestProviderData)({
        from: "no-reply@example.com",
        test_to: "admin@example.com",
        auth_type: "smtp-api",
    }, {
        template: "order-placed",
        subject: "",
        html: "",
        text: "",
    }, "admin_123");
    strict_1.default.equal(providerData.template, "order-placed");
    strict_1.default.equal(providerData.subject, "Order confirmation");
    strict_1.default.match(providerData.html || "", /Thanks for your order/);
    strict_1.default.match(providerData.text || "", /We have received your order/);
    strict_1.default.equal(providerData.from, "no-reply@example.com");
    strict_1.default.equal(providerData.reply_to, undefined);
    strict_1.default.equal(providerData.workflow_run_id, "admin_123");
    strict_1.default.deepEqual(providerData.cc, undefined);
    strict_1.default.deepEqual(providerData.headers, {});
    strict_1.default.deepEqual(providerData.custom_args, {});
    strict_1.default.deepEqual(providerData.metadata, {});
});
(0, node_test_1.default)("buildPostalAdminTestProviderData preserves explicit overrides", () => {
    const providerData = (0, test_payload_1.buildPostalAdminTestProviderData)({
        from: "no-reply@example.com",
        test_to: "admin@example.com",
        auth_type: "smtp-api",
    }, {
        template: "postal-admin-test",
        from_name: "Ops Admin",
        reply_to: "reply@example.com",
        subject: "Custom subject",
        html: "<p>Custom</p>",
        text: "Custom text",
        cc: ["copy@example.com"],
        bcc: "audit@example.com",
        headers: {
            "X-Trace-Id": "trace_123",
        },
        custom_args: {
            custom: "value",
        },
        metadata: {
            scope: "unit-test",
        },
    }, "admin_456");
    strict_1.default.equal(providerData.from_name, "Ops Admin");
    strict_1.default.equal(providerData.reply_to, "reply@example.com");
    strict_1.default.equal(providerData.subject, "Custom subject");
    strict_1.default.equal(providerData.html, "<p>Custom</p>");
    strict_1.default.equal(providerData.text, "Custom text");
    strict_1.default.deepEqual(providerData.cc, ["copy@example.com"]);
    strict_1.default.equal(providerData.bcc, "audit@example.com");
    strict_1.default.equal(providerData.headers["X-Trace-Id"], "trace_123");
    strict_1.default.equal(providerData.custom_args?.custom, "value");
    strict_1.default.equal(providerData.metadata?.scope, "unit-test");
});
(0, node_test_1.default)("buildPostalAdminTestProviderData trims list inputs and falls back to template defaults", () => {
    const providerData = (0, test_payload_1.buildPostalAdminTestProviderData)({
        from: "no-reply@example.com",
        test_to: "admin@example.com",
        auth_type: "smtp-api",
    }, {
        template: "   ",
        cc: " copy@example.com ",
        bcc: [" audit@example.com ", ""],
    }, "admin_789");
    strict_1.default.equal(providerData.template, "postal-admin-test");
    strict_1.default.equal(providerData.subject, "Postal test from Medusa Admin");
    strict_1.default.deepEqual(providerData.cc, "copy@example.com");
    strict_1.default.deepEqual(providerData.bcc, ["audit@example.com"]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1wYXlsb2FkLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3BsdWdpbi1zZXR0aW5ncy9wb3N0YWwvdGVzdC1wYXlsb2FkLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLGlEQUFpRTtBQUVqRSxJQUFBLG1CQUFJLEVBQUMsK0VBQStFLEVBQUUsR0FBRyxFQUFFO0lBQ3pGLE1BQU0sWUFBWSxHQUFHLElBQUEsK0NBQWdDLEVBQ25EO1FBQ0UsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixPQUFPLEVBQUUsbUJBQW1CO1FBQzVCLFNBQVMsRUFBRSxVQUFVO0tBQ3RCLEVBQ0Q7UUFDRSxRQUFRLEVBQUUsY0FBYztRQUN4QixPQUFPLEVBQUUsRUFBRTtRQUNYLElBQUksRUFBRSxFQUFFO1FBQ1IsSUFBSSxFQUFFLEVBQUU7S0FDVCxFQUNELFdBQVcsQ0FDWixDQUFBO0lBRUQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUNuRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUE7SUFDeEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtJQUM5RCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSw2QkFBNkIsQ0FBQyxDQUFBO0lBQ3BFLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTtJQUN2RCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQzlDLGdCQUFNLENBQUMs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
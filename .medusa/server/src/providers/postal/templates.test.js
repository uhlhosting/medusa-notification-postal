"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const templates_1 = require("./templates");
(0, node_test_1.default)("resolvePostalTemplate applies registry defaults", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("postal-admin-test");
    strict_1.default.equal(resolved.template_name, "postal-admin-test");
    strict_1.default.equal(resolved.subject, "Postal test from Medusa Admin");
    strict_1.default.match(resolved.html, /Medusa Admin settings/);
    strict_1.default.equal(resolved.text, "Postal provider test message from Medusa Admin settings.");
});
(0, node_test_1.default)("resolvePostalTemplate provides rich html for built-in text templates", () => {
    const defaultTemplate = (0, templates_1.resolvePostalTemplate)("default");
    const postalTestTemplate = (0, templates_1.resolvePostalTemplate)("postal-test");
    strict_1.default.match(defaultTemplate.html, /Postal Notification/);
    strict_1.default.match(defaultTemplate.html, /generic Postal notification preview/);
    strict_1.default.match(postalTestTemplate.html, /Postal test send/);
    strict_1.default.match(postalTestTemplate.html, /Postal test message from Medusa/);
});
(0, node_test_1.default)("resolvePostalTemplate preserves custom template names", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("custom-template", {
        subject: "Custom subject",
    });
    strict_1.default.equal(resolved.template_name, "custom-template");
    strict_1.default.equal(resolved.subject, "Custom subject");
    strict_1.default.match(resolved.html, /Notification/);
    strict_1.default.match(resolved.text, /generic Postal notification preview/);
});
(0, node_test_1.default)("resolvePostalTemplate falls back to default subject and rich html", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("  ");
    strict_1.default.equal(resolved.template_name, "default");
    strict_1.default.equal(resolved.subject, "Notification");
    strict_1.default.match(resolved.html, /Postal Notification/);
    strict_1.default.match(resolved.text, /generic Postal notification preview/);
});
(0, node_test_1.default)("resolvePostalTemplate handles an undefined template name", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)(undefined, {
        text: "Direct plain body",
    });
    strict_1.default.equal(resolved.template_name, "default");
    strict_1.default.equal(resolved.subject, "Notification");
    strict_1.default.equal(resolved.text, "Direct plain body");
    strict_1.default.match(resolved.html, /Direct plain body/);
});
(0, node_test_1.default)("resolvePostalTemplate strips html and rehydrates missing body text", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("custom-template", {
        subject: "Custom subject",
        html: "<p>Hello <strong>world</strong> &amp; team</p>",
    });
    strict_1.default.equal(resolved.text, "Hello world & team");
    strict_1.default.equal(resolved.subject, "Custom subject");
});
(0, node_test_1.default)("resolvePostalTemplate derives text from html when text is missing", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("custom-template", {
        subject: "Custom subject",
        html: "<p>Hello <strong>world</strong></p>",
    });
    strict_1.default.equal(resolved.subject, "Custom subject");
    strict_1.default.equal(resolved.html, "<p>Hello <strong>world</strong></p>");
    strict_1.default.equal(resolved.text, "Hello world");
});
(0, node_test_1.default)("resolvePostalTemplate derives html from text when html is missing", () => {
    const resolved = (0, templates_1.resolvePostalTemplate)("custom-template", {
        subject: "Custom subject",
        text: "Plain text body",
    });
    strict_1.default.equal(resolved.subject, "Custom subject");
    strict_1.default.equal(resolved.text, "Plain text body");
    strict_1.default.match(resolved.html, /Custom subject/);
    strict_1.default.match(resolved.html, /Plain text body/);
});
(0, node_test_1.default)("normalizePostalCustomArgs converts safe keys to headers", () => {
    const headers = (0, templates_1.normalizePostalCustomArgs)({
        "order id": 123,
        customer_group: "vip",
        ignored: null,
        "": "skip-me",
        nested: { nope: true },
    });
    strict_1.default.equal(headers["X-Postal-Custom-Arg-order-id"], "123");
    strict_1.default.equal(headers["X-Postal-Custom-Arg-customer-group"], "vip");
    strict_1.default.equal(Object.keys(headers).length, 2);
});
(0, node_test_1.default)("resolvePostalSender formats sender identity", () => {
    const resolved = (0, templates_1.resolvePostalSender)({
        from_name: "Postal Admin",
        reply_to: "reply@example.com",
    }, "no-reply@example.com");
    strict_1.default.equal(resolved.from, "Postal Admin <no-reply@example.com>");
    strict_1.default.equal(resolved.reply_to, "reply@example.com");
});
(0, node_test_1.default)("resolvePostalSender uses fallback from and omits empty reply-to", () => {
    const resolved = (0, templates_1.resolvePostalSender)({}, "fallback@example.com");
    strict_1.default.equal(resolved.from, "fallback@example.com");
    strict_1.default.equal(resolved.reply_to, undefined);
});
(0, node_test_1.default)("getPostalTemplateOptions returns the built-in examples in order", () => {
    const options = (0, templates_1.getPostalTemplateOptions)();
    strict_1.default.equal(options[0]?.value, "postal-admin-test");
    strict_1.default.equal(options[0]?.description, "Postal test from Medusa Admin");
    strict_1.default.equal(options.some((option) => option.value === "password-reset"), true);
    strict_1.default.equal(options.some((option) => option.value === "admin-invite"), true);
    strict_1.default.equal(options.some((option) => option.value === "email-verification"), true);
    strict_1.default.equal(options.some((option) => option.value === "abandoned-cart"), true);
    strict_1.default.equal(options.some((option) => option.value === "restock-available"), true);
});
(0, node_test_1.default)("getPostalTemplatePreview returns the template content", () => {
    const preview = (0, templates_1.getPostalTemplatePreview)("order-placed");
    strict_1.default.equal(preview.value, "order-placed");
    strict_1.default.equal(preview.subject, "Order confirmation");
    strict_1.default.match(preview.html, /Thanks for your order/);
    strict_1.default.match(preview.text, /We have received your order/);
});
(0, node_test_1.default)("getPostalTemplateExample returns example payload data", () => {
    const example = (0, templates_1.getPostalTemplateExample)("order-placed");
    strict_1.default.equal(example.to, "recipient@example.com");
    strict_1.default.equal(example.from, "orders@example.com");
    strict_1.default.deepEqual(example.cc, []);
    strict_1.default.deepEqual(example.bcc, []);
    strict_1.default.equal(example.headers["X-Order-Id"], "ord_123");
    strict_1.default.equal(example.workflow_event, "order.placed");
    strict_1.default.equal(example.custom_args.order_id, "ord_123");
    strict_1.default.equal(example.metadata.store, "main");
});
(0, node_test_1.default)("getPostalTemplatePreview returns the template content for new templates", () => {
    const cartPreview = (0, templates_1.getPostalTemplatePreview)("abandoned-cart");
    strict_1.default.equal(cartPreview.value, "abandoned-cart");
    strict_1.default.equal(cartPreview.subject, "You left items in your cart");
    strict_1.default.match(cartPreview.html, /We saved the items you added to your cart/);
    const restockPreview = (0, templates_1.getPostalTemplatePreview)("restock-available");
    strict_1.default.equal(restockPreview.value, "restock-available");
    strict_1.default.equal(restockPreview.subject, "Product is back in stock");
    strict_1.default.match(restockPreview.html, /available again/);
});
(0, node_test_1.default)("getPostalTemplatePreview returns the password reset content", () => {
    const preview = (0, templates_1.getPostalTemplatePreview)("password-reset");
    strict_1.default.equal(preview.value, "password-reset");
    strict_1.default.equal(preview.subject, "Reset your password");
    strict_1.default.match(preview.html, /We received a request to reset the password/);
    strict_1.default.match(preview.text, /We received a request to reset the password/);
});
(0, node_test_1.default)("getPostalTemplatePreview returns the Admin invitation content", () => {
    const preview = (0, templates_1.getPostalTemplatePreview)("admin-invite");
    strict_1.default.equal(preview.value, "admin-invite");
    strict_1.default.equal(preview.subject, "You have been invited to Medusa Admin");
    strict_1.default.match(preview.html, /Accept your Admin invitation/);
    strict_1.default.match(preview.text, /invited to administer this Medusa environment/);
});
(0, node_test_1.default)("getPostalTemplateExample returns a redaction-safe Admin invitation example", () => {
    const example = (0, templates_1.getPostalTemplateExample)("admin-invite");
    strict_1.default.equal(example.workflow_event, "invite.created");
    strict_1.default.equal(example.custom_args.invite_id, "invite_123");
    strict_1.default.equal(example.metadata.audience, "admin");
    strict_1.default.equal("invite_token" in example.custom_args, false);
});
(0, node_test_1.default)("getPostalTemplatePreview returns the email verification content", () => {
    const preview = (0, templates_1.getPostalTemplatePreview)("email-verification");
    strict_1.default.equal(preview.value, "email-verification");
    strict_1.default.equal(preview.subject, "Verify your email address");
    strict_1.default.match(preview.html, /Verify your email address/);
    strict_1.default.match(preview.text, /verify your email address/);
});
(0, node_test_1.default)("getPostalTemplateExample returns the email verification example payload", () => {
    const example = (0, templates_1.getPostalTemplateExample)("email-verification");
    strict_1.default.equal(example.to, "recipient@example.com");
    strict_1.default.equal(example.from, "security@example.com");
    strict_1.default.equal(example.reply_to, "support@example.com");
    strict_1.default.equal(example.headers["X-Verification-Flow"], "email-verification");
    strict_1.default.equal(example.custom_args.verification_token, "token_456");
    strict_1.default.equal(example.metadata.store, "main");
});
(0, node_test_1.default)("getPostalTemplatePreview keeps registry metadata for recovery templates", () => {
    const preview = (0, templates_1.getPostalTemplatePreview)("abandoned-cart");
    strict_1.default.equal(preview.label, "Abandoned Cart");
    strict_1.default.equal(preview.description, "You left items in your cart");
    strict_1.default.match(preview.html, /Cart Recovery/);
});
(0, node_test_1.default)("getPostalTemplateExample carries workflow metadata and headers", () => {
    const example = (0, templates_1.getPostalTemplateExample)("restock-available");
    strict_1.default.equal(example.workflow_event, "restock.available");
    strict_1.default.equal(example.workflow_run_id, "wf_example_restock_available");
    strict_1.default.equal(example.headers["X-Trace-Id"], undefined);
    strict_1.default.deepEqual(example.cc, []);
    strict_1.default.deepEqual(example.bcc, []);
    strict_1.default.equal(example.metadata.store, "main");
});
(0, node_test_1.default)("getPostalTemplateExample covers all built-in templates", () => {
    const templateNames = [
        "default",
        "postal-test",
        "postal-admin-test",
        "order-placed",
        "admin-invite",
        "password-reset",
        "email-verification",
        "welcome",
        "abandoned-cart",
        "restock-available",
    ];
    for (const template of templateNames) {
        const example = (0, templates_1.getPostalTemplateExample)(template);
        strict_1.default.equal(example.value, template);
        strict_1.default.equal(typeof example.workflow_event, "string");
        strict_1.default.equal(typeof example.workflow_run_id, "string");
        strict_1.default.equal(typeof example.to, "string");
        strict_1.default.equal(typeof example.from, "string");
        strict_1.default.equal(typeof example.from_name, "string");
        strict_1.default.equal(typeof example.reply_to, "string");
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3Bvc3RhbC90ZW1wbGF0ZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBEQUE0QjtBQUM1QixnRUFBdUM7QUFDdkMsMkNBT29CO0FBRXBCLElBQUEsbUJBQUksRUFBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7SUFDM0QsTUFBTSxRQUFRLEdBQUcsSUFBQSxpQ0FBcUIsRUFBQyxtQkFBbUIsQ0FBQyxDQUFBO0lBRTNELGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtJQUN6RCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLCtCQUErQixDQUFDLENBQUE7SUFDL0QsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO0lBQ3BELGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsMERBQTBELENBQUMsQ0FBQTtBQUN6RixDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUEsbUJBQUksRUFBQyxzRUFBc0UsRUFBRSxHQUFHLEVBQUU7SUFDaEYsTUFBTSxlQUFlLEdBQUcsSUFBQSxpQ0FBcUIsRUFBQyxTQUFTLENBQUMsQ0FBQTtJQUN4RCxNQUFNLGtCQUFrQixHQUFHLElBQUEsaUNBQXFCLEVBQUMsYUFBYSxDQUFDLENBQUE7SUFFL0QsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO0lBQ3pELGdCQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUscUNBQXFDLENBQUMsQ0FBQTtJQUN6RSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsa0JBQWtC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Q0FBd0IsRUFBQyxRQUFRLENBQUMsQ0FBQTtRQUNsRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3JDLGdCQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sT0FBTyxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNyRCxnQkFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLE9BQU8sQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDdEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxPQUFPLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3pDLGdCQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUMzQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDaEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ2pELENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQSJ9
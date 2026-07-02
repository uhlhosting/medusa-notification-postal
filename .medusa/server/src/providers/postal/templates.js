"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePostalSender = exports.normalizePostalCustomArgs = exports.getPostalTemplateExample = exports.getPostalTemplatePreview = exports.getPostalTemplateOptions = exports.resolvePostalTemplate = exports.POSTAL_TEMPLATE_REGISTRY = void 0;
const TEST_TO = "recipient@example.com";
const normalizeWhitespace = (value) => value.trim().replace(/\s+/g, " ");
const stripHtmlTags = (value) => normalizeWhitespace(value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\""));
const buildRichHtmlTemplate = (eyebrow, title, body, footer, preview) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="background-color:#f5f1ea;margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,'Noto Sans','Liberation Sans',sans-serif;color:#171717">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent">
      ${preview || title}
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="margin:0;padding:0;background-color:#f5f1ea;font-family:'Helvetica Neue',Helvetica,Arial,'Noto Sans','Liberation Sans',sans-serif;color:#171717">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;padding:24px 12px 36px">
              <tbody>
                <tr>
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;border-radius:28px;overflow:hidden;background-color:#ffffff;border:1px solid #e7dfd3;box-shadow:0 12px 32px rgba(17, 17, 17, 0.08)">
                      <tbody>
                        <tr style="width:100%">
                          <td>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="height:6px;background-color:#171717">
                              <tbody>
                                <tr>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 32px 22px;background-color:#fffdf8;border-bottom:1px solid #f0e9df">
                              <tbody>
                                <tr>
                                  <td>
                                    <p style="font-size:12px;line-height:18px;margin:0 0 12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7b6b52">
                                      ${eyebrow}
                                    </p>
                                    <h1 style="margin:0;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.02em;color:#111111">
                                      ${title}
                                    </h1>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 32px 16px;background-color:#ffffff">
                              <tbody>
                                <tr>
                                  <td>
                                    <div style="font-size:16px;line-height:28px;color:#222222">
                                      ${body}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:0 32px 32px;background-color:#ffffff">
                              <tbody>
                                <tr>
                                  <td>
                                    <div style="margin-top:12px;padding:18px 20px;background-color:#fff8ef;border:1px solid #f1e1cf;border-radius:20px;color:#6b5b45;font-size:14px;line-height:22px">
                                      ${footer}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const buildModernFallbackHtml = (subject, text) => {
    const cleanSubject = subject.trim() || "Notification";
    const cleanText = text.trim() || "This is a transactional email.";
    const safeSubject = escapeHtml(cleanSubject);
    const safeText = escapeHtml(cleanText).replace(/\n/g, "<br>");
    return buildRichHtmlTemplate("Postal Notification", safeSubject, `<p style="margin:0">${safeText}</p>`, "This is an automatically generated HTML fallback so the message still renders well in clients that prefer rich formatting.", safeSubject);
};
const normalizeTemplateText = (value, fallback = "") => {
    const normalized = value.trim();
    return normalized || fallback;
};
const normalizeTemplateHtml = (value, fallback, subject) => {
    const normalized = value.trim();
    return normalized || buildModernFallbackHtml(subject, fallback);
};
exports.POSTAL_TEMPLATE_REGISTRY = {
    default: {
        subject: "Notification",
        html: buildRichHtmlTemplate("Postal Notification", "Notification", `
        <p style="margin:0 0 14px">
          This is a generic Postal notification preview used for template validation.
        </p>
        <div style="margin:22px 0 8px;padding:18px 20px;border:1px solid #efe3d4;border-radius:20px;background:#fffaf2">
          <p style="margin:0;font-weight:700;color:#111111">Fallback preview</p>
          <p style="margin:8px 0 0;color:#4b453e">
            Use this template when a workflow does not provide a more specific subject or body.
          </p>
        </div>
      `, "Use this template as a fallback when a workflow does not provide a more specific subject or body.", "Postal notification preview"),
        text: "This is a generic Postal notification preview used for template validation.",
    },
    "postal-test": {
        subject: "Postal test send",
        html: buildRichHtmlTemplate("Postal Transport Check", "Postal Test Send", `
        <p style="margin:0 0 16px">
          This is a Postal test message from Medusa.
        </p>
        <div style="margin:22px 0 8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
          <div style="padding:16px 18px;border:1px solid #efe3d4;border-radius:18px;background:#fffaf2">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7b6b52;font-weight:700">Transport</p>
            <p style="margin:0;font-size:16px;line-height:24px;font-weight:700;color:#111111">Postal API and workflow delivery</p>
          </div>
          <div style="padding:16px 18px;border:1px solid #efe3d4;border-radius:18px;background:#fffaf2">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7b6b52;font-weight:700">Result</p>
            <p style="margin:0;font-size:16px;line-height:24px;font-weight:700;color:#111111">Rich HTML preview renders correctly</p>
          </div>
        </div>
      `, "If you received this message, the Postal transport and workflow path are both working.", "Postal transport and workflow path are working."),
        text: "Postal test message from Medusa.",
    },
    "postal-admin-test": {
        subject: "Postal test from Medusa Admin",
        html: buildRichHtmlTemplate("Medusa Admin Settings", "Postal Test From Admin", `
        <p style="margin:0 0 16px">
          Postal provider test message from Medusa Admin settings.
        </p>
        <div style="margin:22px 0 8px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Admin check</p>
          <p style="margin:0;font-size:16px;line-height:24px;color:#111111">
            This message confirms the saved Postal configuration can send through the live provider.
          </p>
        </div>
      `, "This message confirms the saved Postal configuration can send through the live provider.", "Postal admin configuration test."),
        text: "Postal provider test message from Medusa Admin settings.",
    },
    "order-placed": {
        subject: "Order confirmation",
        html: buildRichHtmlTemplate("Order Receipt", "Thanks for your order", `
        <p style="margin:0 0 18px">
          We have received your order and are preparing it for fulfillment.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#fffaf2;border:1px solid #efe3d4">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding:0 0 12px;color:#7b6b52;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Order summary</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#111111">Order received</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;line-height:24px;color:#4b453e">We will email you again once your items move into fulfillment.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin:0">
          <a href="https://example.com/account/orders" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">View order details</a>
        </p>
      `, "This is a sample customer-facing transactional message.", "Your order has been received and is being prepared."),
        text: "We have received your order and are preparing it for fulfillment.",
    },
    "password-reset": {
        subject: "Reset your password",
        html: buildRichHtmlTemplate("Account Security", "Reset your password", `
        <p style="margin:0 0 14px">
          We received a request to reset the password for your account.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#fff7f8;border:1px solid #f3d7dd">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8e4b5a;font-weight:700">Security notice</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#4b453e">This link can only be used once and will expire for security reasons.</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#4b453e">If you did not request this, you can ignore this email and your password will remain unchanged.</p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/reset-password" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Reset password</a>
        </p>
      `, "If you did not request this reset, you can safely ignore this message.", "We received a request to reset the password for your account."),
        text: "We received a request to reset the password for your account.",
    },
    "email-verification": {
        subject: "Verify your email address",
        html: buildRichHtmlTemplate("Account Security", "Verify your email address", `
        <p style="margin:0 0 14px">
          Use the verification link in this email to confirm your email address and finish setting up your account.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Verification notice</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#2b3d57">This link is for account activation and should only be used by the intended recipient.</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#2b3d57">If you did not request this message, you can safely ignore it.</p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/verify-email" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Verify email</a>
        </p>
      `, "If you did not request this message, you can safely ignore it.", "Verify your email address"),
        text: "Use the link in this email to verify your email address.",
    },
    welcome: {
        subject: "Welcome",
        html: buildRichHtmlTemplate("Customer Welcome", "Welcome aboard", `
        <p style="margin:0 0 18px">
          We are glad to have you with us.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#f6fbf5;border:1px solid #dcebd8">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#57705b;font-weight:700">Next steps</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#334033">
            <li style="margin:0 0 8px">Explore the storefront</li>
            <li style="margin:0 0 8px">Review your account details</li>
            <li style="margin:0">Reach out if you need help</li>
          </ul>
        </div>
        <p style="margin:0">
          <a href="https://example.com" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Explore storefront</a>
        </p>
      `, "Use this template for onboarding and first-contact customer messaging.", "We are glad to have you with us."),
        text: "We are glad to have you with us.",
    },
    "abandoned-cart": {
        subject: "You left items in your cart",
        html: buildRichHtmlTemplate("Cart Recovery", "You left items in your cart", `
        <p style="margin:0 0 14px">
          We saved the items you added to your cart. You can return any time and finish checkout in a couple of clicks.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#fffaf2;border:1px solid #efe3d4">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding:0 0 12px;color:#7b6b52;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Items waiting for you</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#111111">Cart summary</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;line-height:24px;color:#4b453e">Keep the recovery message focused on the products, the total, and a single clear return path.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin:0">
          <a href="https://example.com/cart" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Return to cart</a>
        </p>
      `, "If you already completed your order, you can ignore this message.", "We saved the items you added to your cart."),
        text: "We saved the items you added to your cart.",
    },
    "restock-available": {
        subject: "Product is back in stock",
        html: buildRichHtmlTemplate("Back In Stock", "Product is back in stock", `
        <p style="margin:0 0 14px">
          The item you asked us to watch is available again. If you still want it, you can go straight to the product page and place your order.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Product</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#2b3d57">
            Use this message when inventory changes should trigger a customer notification.
          </p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/products/example-product" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">View product</a>
        </p>
      `, "If you no longer need this item, you can ignore this email.", "The item you asked us to watch is available again."),
        text: "The item you asked us to watch is available again.",
    },
};
const POSTAL_TEMPLATE_ORDER = [
    "postal-admin-test",
    "postal-test",
    "order-placed",
    "password-reset",
    "email-verification",
    "welcome",
    "abandoned-cart",
    "restock-available",
];
const normalizeTemplateName = (template) => {
    if (!template) {
        return null;
    }
    const normalized = template.trim().toLowerCase();
    if (normalized in exports.POSTAL_TEMPLATE_REGISTRY) {
        return normalized;
    }
    return null;
};
const resolvePostalTemplate = (template, content = {}) => {
    const templateName = normalizeTemplateName(template);
    const templateLabel = template?.trim() || templateName || "default";
    const defaults = templateName
        ? exports.POSTAL_TEMPLATE_REGISTRY[templateName]
        : exports.POSTAL_TEMPLATE_REGISTRY.default;
    const subject = content.subject?.trim() || defaults.subject;
    const contentHtml = content.html?.trim() || "";
    const contentText = content.text?.trim() || "";
    const text = normalizeTemplateText(contentText, contentHtml
        ? stripHtmlTags(contentHtml)
        : defaults.text || stripHtmlTags(defaults.html || ""));
    const html = normalizeTemplateHtml(contentHtml, text || defaults.text || "", subject);
    return {
        template_name: templateLabel,
        subject,
        html,
        text,
    };
};
exports.resolvePostalTemplate = resolvePostalTemplate;
const getPostalTemplateOptions = () => POSTAL_TEMPLATE_ORDER.map((value) => {
    const definition = exports.POSTAL_TEMPLATE_REGISTRY[value];
    const label = value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    return {
        value,
        label,
        description: definition.subject,
    };
});
exports.getPostalTemplateOptions = getPostalTemplateOptions;
const getPostalTemplatePreview = (template) => {
    const definition = exports.POSTAL_TEMPLATE_REGISTRY[template];
    const option = (0, exports.getPostalTemplateOptions)().find((candidate) => candidate.value === template);
    return {
        value: template,
        label: option?.label || template,
        description: option?.description || definition.subject,
        subject: definition.subject,
        html: definition.html || "",
        text: definition.text || "",
    };
};
exports.getPostalTemplatePreview = getPostalTemplatePreview;
const getPostalTemplateExample = (template) => {
    const preview = (0, exports.getPostalTemplatePreview)(template);
    const examples = {
        default: {
            to: TEST_TO,
            from: "no-reply@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Trace-Id": "trace_default",
            },
            workflow_event: "postal.example.default",
            workflow_run_id: "wf_example_default",
            custom_args: {
                example: "default",
            },
            metadata: {
                audience: "customer",
            },
        },
        "postal-test": {
            to: TEST_TO,
            from: "no-reply@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Trace-Id": "trace_postal_test",
            },
            workflow_event: "postal.example.test",
            workflow_run_id: "wf_example_postal_test",
            custom_args: {
                example: "postal-test",
            },
            metadata: {
                audience: "operator",
            },
        },
        "postal-admin-test": {
            to: TEST_TO,
            from: "no-reply@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Trace-Id": "trace_admin_test",
            },
            workflow_event: "postal.example.admin_test",
            workflow_run_id: "wf_example_admin_test",
            custom_args: {
                example: "postal-admin-test",
            },
            metadata: {
                audience: "operator",
            },
        },
        "order-placed": {
            to: TEST_TO,
            from: "orders@example.com",
            from_name: "Example Store",
            reply_to: "orders@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Order-Id": "ord_123",
            },
            workflow_event: "order.placed",
            workflow_run_id: "wf_example_order_placed",
            custom_args: {
                order_id: "ord_123",
            },
            metadata: {
                store: "main",
            },
        },
        "password-reset": {
            to: TEST_TO,
            from: "security@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Reset-Flow": "password-reset",
            },
            workflow_event: "customer.password_reset",
            workflow_run_id: "wf_example_password_reset",
            custom_args: {
                reset_token: "token_123",
            },
            metadata: {
                store: "main",
            },
        },
        "email-verification": {
            to: TEST_TO,
            from: "security@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Verification-Flow": "email-verification",
            },
            workflow_event: "customer.email_verification",
            workflow_run_id: "wf_example_email_verification",
            custom_args: {
                verification_token: "token_456",
            },
            metadata: {
                store: "main",
            },
        },
        welcome: {
            to: TEST_TO,
            from: "hello@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Welcome-Campaign": "default",
            },
            workflow_event: "customer.welcome",
            workflow_run_id: "wf_example_welcome",
            custom_args: {
                segment: "new-customer",
            },
            metadata: {
                store: "main",
            },
        },
        "abandoned-cart": {
            to: TEST_TO,
            from: "orders@example.com",
            from_name: "Example Store",
            reply_to: "orders@example.com",
            cc: [],
            bcc: [],
            headers: {},
            workflow_event: "cart.abandoned",
            workflow_run_id: "wf_example_abandoned_cart",
            custom_args: {
                cart_id: "cart_123",
            },
            metadata: {
                store: "main",
            },
        },
        "restock-available": {
            to: TEST_TO,
            from: "hello@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {},
            workflow_event: "restock.available",
            workflow_run_id: "wf_example_restock_available",
            custom_args: {
                product_id: "prod_123",
            },
            metadata: {
                store: "main",
            },
        },
    };
    return {
        ...preview,
        ...examples[template],
    };
};
exports.getPostalTemplateExample = getPostalTemplateExample;
const normalizePostalCustomArgs = (customArgs) => {
    if (!customArgs || typeof customArgs !== "object") {
        return {};
    }
    return Object.entries(customArgs).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) {
            return acc;
        }
        if (typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean") {
            return acc;
        }
        const normalizedKey = String(key)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (!normalizedKey) {
            return acc;
        }
        acc[`X-Postal-Custom-Arg-${normalizedKey}`] = String(value);
        return acc;
    }, {});
};
exports.normalizePostalCustomArgs = normalizePostalCustomArgs;
const resolvePostalSender = (identity = {}, fallbackFrom = "") => {
    const from = String(identity.from || fallbackFrom || "").trim();
    const fromName = String(identity.from_name || "").trim();
    const replyTo = String(identity.reply_to || "").trim();
    const formattedFrom = fromName ? `${fromName} <${from}>` : from;
    return {
        from: formattedFrom,
        reply_to: replyTo || undefined,
    };
};
exports.resolvePostalSender = resolvePostalSender;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9wb3N0YWwvdGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQXVEQSxNQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQTtBQUV2QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUVoRixNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQ3RDLG1CQUFtQixDQUNqQixLQUFLO0tBQ0YsT0FBTyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQztLQUN6QyxPQUFPLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDO0tBQzNDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDO0tBQ3hCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDO0tBQ3hCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO0tBQ3ZCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0tBQ3RCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0tBQ3RCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO0tBQ3ZCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQzdCLENBQUE7QUFFSCxNQUFNLHFCQUFxQixHQUFHLENBQzVCLE9BQWUsRUFDZixLQUFhLEVBQ2IsSUFBWSxFQUNaLE1BQWMsRUFDZCxPQUFnQixFQUNoQixFQUFFLENBQUM7Ozs7O2FBS1EsS0FBSzs7OztRQUlWLE9BQU8sSUFBSSxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0EwQmdCLE9BQU87Ozt3Q0FHUCxLQUFLOzs7Ozs7Ozs7Ozt3Q0FXTCxJQUFJOzs7Ozs7Ozs7Ozt3Q0FXSixN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
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
    "admin-invite": {
        subject: "You have been invited to Medusa Admin",
        html: buildRichHtmlTemplate("Medusa Admin", "Accept your Admin invitation", `
        <p style="margin:0 0 14px">
          You have been invited to administer this Medusa environment.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Secure access</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#2b3d57">
            The invitation link can only be used once and expires automatically.
          </p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/app/invite?token=example" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Accept invitation</a>
        </p>
      `, "If you were not expecting this invitation, you can safely ignore this message.", "You have been invited to Medusa Admin."),
        text: "You have been invited to administer this Medusa environment.",
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
    "admin-invite",
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
        "admin-invite": {
            to: TEST_TO,
            from: "security@example.com",
            from_name: "Example Store",
            reply_to: "support@example.com",
            cc: [],
            bcc: [],
            headers: {
                "X-Invite-Flow": "admin-invite",
            },
            workflow_event: "invite.created",
            workflow_run_id: "wf_example_admin_invite",
            custom_args: {
                invite_id: "invite_123",
            },
            metadata: {
                audience: "admin",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9wb3N0YWwvdGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQXdEQSxNQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQTtBQUV2QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUVoRixNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQ3RDLG1CQUFtQixDQUNqQixLQUFLO0tBQ0YsT0FBTyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQztLQUN6QyxPQUFPLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDO0tBQzNDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDO0tBQ3hCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDO0tBQ3hCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO0tBQ3ZCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0tBQ3RCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0tBQ3RCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO0tBQ3ZCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQzdCLENBQUE7QUFFSCxNQUFNLHFCQUFxQixHQUFHLENBQzVCLE9BQWUsRUFDZixLQUFhLEVBQ2IsSUFBWSxFQUNaLE1BQWMsRUFDZCxPQUFnQixFQUNoQixFQUFFLENBQUM7Ozs7O2FBS1EsS0FBSzs7OztRQUlWLE9BQU8sSUFBSSxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0EwQmdCLE9BQU87Ozt3Q0FHUCxLQUFLOzs7Ozs7Ozs7Ozt3Q0FXTCxJQUFJOzs7Ozs7Ozs7Ozt3Q0FXSixN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
export type PostalTemplateName =
  | "default"
  | "postal-test"
  | "postal-admin-test"
  | "order-placed"
  | "password-reset"
  | "welcome"
  | "abandoned-cart"
  | "restock-available"

export type PostalTemplateContent = {
  subject?: string
  html?: string
  text?: string
}

export type PostalSenderIdentity = {
  from?: string
  from_name?: string
  reply_to?: string
}

export type PostalTemplateDefinition = {
  subject: string
  html?: string
  text?: string
}

export type PostalTemplateOption = {
  value: PostalTemplateName
  label: string
  description: string
}

export type PostalTemplatePreview = PostalTemplateOption & {
  subject: string
  html: string
  text: string
}

export type PostalTemplateExample = PostalTemplatePreview & {
  to: string
  from: string
  from_name: string
  reply_to: string
  cc: string[]
  bcc: string[]
  headers: Record<string, string>
  workflow_event: string
  workflow_run_id: string
  custom_args: Record<string, string>
  metadata: Record<string, string>
}

const buildRichHtmlTemplate = (
  eyebrow: string,
  title: string,
  body: string,
  footer: string
) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:28px 32px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.8;">${eyebrow}</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${title}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${body}</p>
          <div style="margin-top:24px;padding:16px 18px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:12px;color:#475569;font-size:14px;line-height:1.6;">
            ${footer}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`

export const POSTAL_TEMPLATE_REGISTRY: Record<
  PostalTemplateName,
  PostalTemplateDefinition
> = {
  default: {
    subject: "Notification",
    html: buildRichHtmlTemplate(
      "Postal Notification",
      "Notification",
      "This is a generic Postal notification preview used for template validation.",
      "Use this template as a fallback when a workflow does not provide a more specific subject or body."
    ),
    text: "This is a generic Postal notification preview used for template validation.",
  },
  "postal-test": {
    subject: "Postal test send",
    html: buildRichHtmlTemplate(
      "Postal Transport Check",
      "Postal Test Send",
      "This is a Postal test message from Medusa.",
      "If you received this message, the Postal transport and workflow path are both working."
    ),
    text: "Postal test message from Medusa.",
  },
  "postal-admin-test": {
    subject: "Postal test from Medusa Admin",
    html: buildRichHtmlTemplate(
      "Medusa Admin Settings",
      "Postal Test From Admin",
      "Postal provider test message from Medusa Admin settings.",
      "This message confirms the saved Postal configuration can send through the live provider."
    ),
    text: "Postal provider test message from Medusa Admin settings.",
  },
  "order-placed": {
    subject: "Order confirmation",
    html: buildRichHtmlTemplate(
      "Order Receipt",
      "Thanks for your order",
      "We have received your order and are preparing it for fulfillment.",
      "This is a sample customer-facing transactional message."
    ),
    text: "Thanks for your order.",
  },
  "password-reset": {
    subject: "Reset your password",
    html: buildRichHtmlTemplate(
      "Account Security",
      "Reset your password",
      "Use the link in this email to reset your password.",
      "If you did not request this reset, you can safely ignore this message."
    ),
    text: "Use the link in this email to reset your password.",
  },
  welcome: {
    subject: "Welcome",
    html: buildRichHtmlTemplate(
      "Customer Welcome",
      "Welcome aboard",
      "We are glad to have you with us.",
      "Use this template for onboarding and first-contact customer messaging."
    ),
    text: "Welcome aboard.",
  },
  "abandoned-cart": {
    subject: "You left items in your cart",
    html: buildRichHtmlTemplate(
      "Cart Recovery",
      "You left items in your cart",
      "You left some items in your cart. Come back to finish your order.",
      "This message can be used for recovery campaigns and triggered reminders."
    ),
    text: "You left some items in your cart. Come back to finish your order.",
  },
  "restock-available": {
    subject: "Product is back in stock",
    html: buildRichHtmlTemplate(
      "Back In Stock",
      "Product is back in stock",
      "An item you were watching is back in stock.",
      "Use this message when inventory changes should trigger a customer notification."
    ),
    text: "An item you were watching is back in stock.",
  },
}

const POSTAL_TEMPLATE_ORDER: PostalTemplateName[] = [
  "postal-admin-test",
  "postal-test",
  "order-placed",
  "password-reset",
  "welcome",
  "abandoned-cart",
  "restock-available",
]

const normalizeTemplateName = (template?: string): PostalTemplateName | null => {
  if (!template) {
    return null
  }

  const normalized = template.trim().toLowerCase()
  if (normalized in POSTAL_TEMPLATE_REGISTRY) {
    return normalized as PostalTemplateName
  }

  return null
}

export const resolvePostalTemplate = (
  template?: string,
  content: PostalTemplateContent = {}
) => {
  const templateName = normalizeTemplateName(template)
  const templateLabel = template?.trim() || templateName || "default"
  const defaults = templateName
    ? POSTAL_TEMPLATE_REGISTRY[templateName]
    : POSTAL_TEMPLATE_REGISTRY.default

  return {
    template_name: templateLabel,
    subject:
      content.subject?.trim() ||
      (templateName ? defaults.subject : templateLabel),
    html: content.html ?? defaults.html ?? "",
    text: content.text ?? defaults.text ?? "",
  }
}

export const getPostalTemplateOptions = (): PostalTemplateOption[] =>
  POSTAL_TEMPLATE_ORDER.map((value) => {
    const definition = POSTAL_TEMPLATE_REGISTRY[value]
    const label = value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")

    return {
      value,
      label,
      description: definition.subject,
    }
  })

export const getPostalTemplatePreview = (
  template: PostalTemplateName
): PostalTemplatePreview => {
  const definition = POSTAL_TEMPLATE_REGISTRY[template]
  const option = getPostalTemplateOptions().find(
    (candidate) => candidate.value === template
  )

  return {
    value: template,
    label: option?.label || template,
    description: option?.description || definition.subject,
    subject: definition.subject,
    html: definition.html || "",
    text: definition.text || "",
  }
}

export const getPostalTemplateExample = (
  template: PostalTemplateName
): PostalTemplateExample => {
  const preview = getPostalTemplatePreview(template)

  const examples: Record<PostalTemplateName, Omit<
    PostalTemplateExample,
    keyof PostalTemplatePreview
  >> = {
    default: {
      to: "customer@uhlhosting.ch",
      from: "no-reply@uhlhosting.ch",
      from_name: "Postal Admin",
      reply_to: "support@uhlhosting.ch",
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
      to: "admin@uhlhosting.ch",
      from: "no-reply@uhlhosting.ch",
      from_name: "Postal Admin",
      reply_to: "support@uhlhosting.ch",
      cc: ["copy@uhlhosting.ch"],
      bcc: ["audit@uhlhosting.ch"],
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
      to: "admin@uhlhosting.ch",
      from: "no-reply@uhlhosting.ch",
      from_name: "Postal Admin",
      reply_to: "support@uhlhosting.ch",
      cc: ["copy@uhlhosting.ch"],
      bcc: ["audit@uhlhosting.ch"],
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
      to: "customer@uhlhosting.ch",
      from: "orders@uhlhosting.ch",
      from_name: "Example Store",
      reply_to: "orders@uhlhosting.ch",
      cc: ["ops@uhlhosting.ch"],
      bcc: ["audit@uhlhosting.ch"],
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
      to: "customer@uhlhosting.ch",
      from: "security@uhlhosting.ch",
      from_name: "Example Store",
      reply_to: "support@uhlhosting.ch",
      cc: [],
      bcc: ["security-audit@uhlhosting.ch"],
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
    welcome: {
      to: "customer@uhlhosting.ch",
      from: "hello@uhlhosting.ch",
      from_name: "Example Store",
      reply_to: "support@uhlhosting.ch",
      cc: ["growth@uhlhosting.ch"],
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
      to: "customer@uhlhosting.ch",
      from: "orders@uhlhosting.ch",
      from_name: "Tabaklädeli",
      reply_to: "orders@uhlhosting.ch",
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
      to: "customer@uhlhosting.ch",
      from: "hello@uhlhosting.ch",
      from_name: "Tabaklädeli",
      reply_to: "support@uhlhosting.ch",
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
  }

  return {
    ...preview,
    ...examples[template],
  }
}

export const normalizePostalCustomArgs = (
  customArgs?: Record<string, unknown>
) => {
  if (!customArgs || typeof customArgs !== "object") {
    return {}
  }

  return Object.entries(customArgs).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc
      }

      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        return acc
      }

      const normalizedKey = String(key)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")

      if (!normalizedKey) {
        return acc
      }

      acc[`X-Postal-Custom-Arg-${normalizedKey}`] = String(value)
      return acc
    },
    {}
  )
}

export const resolvePostalSender = (
  identity: PostalSenderIdentity = {},
  fallbackFrom = ""
) => {
  const from = String(identity.from || fallbackFrom || "").trim()
  const fromName = String(identity.from_name || "").trim()
  const replyTo = String(identity.reply_to || "").trim()

  const formattedFrom = fromName ? `${fromName} <${from}>` : from

  return {
    from: formattedFrom,
    reply_to: replyTo || undefined,
  }
}

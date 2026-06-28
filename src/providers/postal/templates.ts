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

export const POSTAL_TEMPLATE_REGISTRY: Record<
  PostalTemplateName,
  PostalTemplateDefinition
> = {
  default: {
    subject: "Notification",
  },
  "postal-test": {
    subject: "Postal test send",
    text: "Postal test message from Medusa.",
  },
  "postal-admin-test": {
    subject: "Postal test from Medusa Admin",
    html: "<p>Postal provider test message from <strong>Medusa Admin settings</strong>.</p>",
    text: "Postal provider test message from Medusa Admin settings.",
  },
  "order-placed": {
    subject: "Order confirmation",
    html: "<p>Thanks for your order.</p>",
    text: "Thanks for your order.",
  },
  "password-reset": {
    subject: "Reset your password",
    html: "<p>Use the link in this email to reset your password.</p>",
    text: "Use the link in this email to reset your password.",
  },
  welcome: {
    subject: "Welcome",
    html: "<p>Welcome aboard.</p>",
    text: "Welcome aboard.",
  },
  "abandoned-cart": {
    subject: "You left items in your cart",
    html: "<p>You left some items in your cart. Come back to finish your order.</p>",
    text: "You left some items in your cart. Come back to finish your order.",
  },
  "restock-available": {
    subject: "Product is back in stock",
    html: "<p>An item you were watching is back in stock.</p>",
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

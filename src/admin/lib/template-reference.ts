import {
  getPostalTemplateOptions,
  type PostalTemplateName,
} from "../../providers/postal/templates";

export type PostalTemplateAudience = "auth" | "commerce" | "ops" | "shared";
export type PostalTemplateSource = "medusa" | "plugin" | "project";

export type PostalTemplateReference = {
  purpose: string;
  audience: PostalTemplateAudience;
  source: PostalTemplateSource;
  required: string;
  optional: string;
  event: string;
  notes: string;
};

export type PostalTemplateReferenceRow = PostalTemplateReference & {
  template: PostalTemplateName;
};

// Keyed by the template registry's own name type, so adding a template to the
// registry without documenting its payload contract here fails the typecheck
// instead of silently dropping out of the admin reference table.
export const POSTAL_TEMPLATE_REFERENCE: Record<
  PostalTemplateName,
  PostalTemplateReference
> = {
  default: {
    purpose: "Generic fallback preview",
    audience: "shared",
    source: "plugin",
    required: "subject, html or text",
    optional: "template-specific content",
    event: "Any custom template",
    notes:
      "Used when a workflow provides custom content but no known template key.",
  },
  "postal-test": {
    purpose: "Provider transport validation",
    audience: "ops",
    source: "plugin",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "postal.example.test",
    notes: "Use for live transport checks and operator testing.",
  },
  "postal-admin-test": {
    purpose: "Admin settings validation",
    audience: "ops",
    source: "plugin",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "admin.postal.test",
    notes: "Used by the admin test-send panel.",
  },
  "order-placed": {
    purpose: "Order confirmation",
    audience: "commerce",
    source: "medusa",
    required: "order id, customer, items, currency, storefront URL",
    optional: "billing/shipping address, support URL, metadata, custom_args",
    event: "order.placed",
    notes: "Shared customer order notification.",
  },
  "admin-invite": {
    purpose: "Admin invitation",
    audience: "auth",
    source: "medusa",
    required: "invite URL, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "invite.created, invite.resent",
    notes:
      "Render the content in the application so the environment-specific invite URL is delivered without logging the token.",
  },
  "password-reset": {
    purpose: "Password reset",
    audience: "auth",
    source: "medusa",
    required: "reset token or reset link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.password_reset",
    notes: "Shared auth flow email.",
  },
  "email-verification": {
    purpose: "Email verification",
    audience: "auth",
    source: "medusa",
    required: "verification token or verification link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.email_verification",
    notes: "Shared auth flow email.",
  },
  welcome: {
    purpose: "Customer onboarding",
    audience: "commerce",
    source: "medusa",
    required: "customer name or customer context, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.welcome",
    notes: "Shared first-contact and onboarding mail.",
  },
  "abandoned-cart": {
    purpose: "Cart recovery",
    audience: "commerce",
    source: "project",
    required: "cart id, cart items, recovery link, subject, html/text",
    optional:
      "locale, customer name, total, currency, support URL, metadata, custom_args",
    event: "cart.abandoned",
    notes: "Shared recovery reminder.",
  },
  "restock-available": {
    purpose: "Back-in-stock alert",
    audience: "commerce",
    source: "project",
    required: "product title, product link, subject, html/text",
    optional:
      "customer name, product handle, locale, metadata, custom_args",
    event: "restock.available",
    notes: "Shared inventory notification.",
  },
};

// Rows follow the registry's own option list (and so its configured order);
// the contract text above is only ever looked up by registry name. The
// selectable options leave out the `default` fallback, but its contract is
// still worth documenting, so it closes the list.
export const getPostalTemplateReferenceRows =
  (): PostalTemplateReferenceRow[] => {
    const names = getPostalTemplateOptions().map((option) => option.value);

    if (!names.includes("default")) {
      names.push("default");
    }

    return names.map((template) => ({
      template,
      ...POSTAL_TEMPLATE_REFERENCE[template],
    }));
  };

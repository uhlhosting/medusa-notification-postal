# @uhlhosting/medusa-notification-postal

A production-ready Postal notification provider for Medusa. Designed for reliable transactional email delivery, strong configuration validation, template-based workflows, and seamless integration with Medusa’s notification system.

## Release

- Current package version: [![npm version](https://img.shields.io/npm/v/@uhlhosting/medusa-notification-postal.svg)](https://www.npmjs.com/package/@uhlhosting/medusa-notification-postal)
- License: `BSD-2-Clause-Patent`
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## Options

- `auth_type` - one of `smtp-api`, `smtp-ip`, `smtp` (default `smtp-api`)
- `from` - default sender e-mail address

### `smtp-api` options

- `base_url` - Postal base URL, for example `https://post.uhlhosting.ch`
- `api_key` - Postal server API key used in `X-Server-API-Key`

### `smtp-ip` options

- `smtp_host` - Postal SMTP host
- `smtp_port` - SMTP port, default `25`
- `smtp_secure` - `true` for implicit TLS, default `false` (STARTTLS is required when false)
- `smtp_timeout` - connection timeout in ms, default `10000`

### `smtp` options

- `smtp_host` - Postal SMTP host
- `smtp_port` - SMTP port, default `25`
- `smtp_secure` - `true` for implicit TLS, default `false` (STARTTLS is required when false)
- `smtp_user` - SMTP username
- `smtp_pass` - SMTP password
- `smtp_timeout` - connection timeout in ms, default `10000`

## Usage

Add to `apps/backend/medusa-config.ts` under the notification module providers.

```ts
{
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      {
        resolve: "@uhlhosting/medusa-notification-postal",
        id: "postal",
        options: {
          channels: ["email"],
          auth_type: process.env.POSTAL_AUTH_TYPE || "smtp-api",
          from: process.env.POSTAL_FROM,

          // smtp-api
          base_url: process.env.POSTAL_BASE_URL,
          api_key: process.env.POSTAL_API_KEY,

          // smtp and smtp-ip
          smtp_host: process.env.POSTAL_SMTP_HOST,
          smtp_port: Number(process.env.POSTAL_SMTP_PORT || 25),
          smtp_secure: process.env.POSTAL_SMTP_SECURE === "true",
          smtp_user: process.env.POSTAL_SMTP_USER,
          smtp_pass: process.env.POSTAL_SMTP_PASS,
        },
      },
    ],
  },
}
```

## Workflow tracking

Use Medusa notification workflows and pass workflow metadata in `provider_data`:

```ts
await notificationModuleService.createNotifications({
  channel: "email",
  to: "customer@uhlhost.net",
  template: "order-placed",
  provider_id: "postal",
  content: {
    subject: "Order confirmation",
    html: "<p>Thanks for your order</p>",
    text: "Thanks for your order",
  },
  provider_data: {
    workflow_event: "order.placed",
    workflow_run_id: "wf_run_123",
  },
})
```

The provider logs `workflow_event` and `workflow_run_id` for traceability in Medusa runtime logs.

## Postal Webhooks

The plugin now exposes a public ingestion endpoint for Postal delivery lifecycle webhooks:

```text
POST /store/postal/webhooks/<postal-webhook-token>
```

The exact tokenized URL is shown in the Postal admin activity page after you save settings. The settings screen intentionally only shows the callback path so the secret stays out of the configuration surface.

It accepts the Postal message status events documented by Postal:

- `MessageSent`
- `MessageDelayed`
- `MessageDeliveryFailed`
- `MessageHeld`
- `MessageBounced`
- `MessageLinkClicked`
- `MessageLoaded`
- `DomainDNSError`

Incoming webhook payloads are stored as raw JSON with normalized status metadata, so you can inspect delivery state changes in the admin Postal page after Postal calls back into Medusa.

The admin page also shows a webhook event log and the endpoint to configure inside Postal.

Postal's HTTP payload docs are separate from webhook delivery callbacks and are mainly useful if you are also handling inbound mail by HTTP. Postal's auto-responder, bounce, wildcard, and address-tag docs are relevant when you want to route inbound mail or reason about delivery replies, but they do not change the webhook callback contract itself.

### Template registry and metadata passthrough

The plugin includes a built-in template registry for common notification flows:

| Template | Purpose | Typical Medusa event | Notes |
| --- | --- | --- | --- |
| `default` | Generic fallback preview | Any custom template name | Used when no registry match exists and content is incomplete. |
| `postal-test` | Provider transport validation | `postal.example.test` | Used for operator sends and transport checks. |
| `postal-admin-test` | Admin settings validation | `admin.postal.test` | Used by the admin test-send form. |
| `order-placed` | Customer order confirmation | `order.placed` | Shared transactional order mail. |
| `password-reset` | Account password reset | `customer.password_reset` | Shared auth email template. |
| `email-verification` | Account email verification | `customer.email_verification` | Shared auth email template. |
| `welcome` | Customer onboarding | `customer.welcome` | Shared onboarding and first-contact template. |
| `abandoned-cart` | Cart recovery | `cart.abandoned` | Shared recovery reminder template. |
| `restock-available` | Back-in-stock alert | `restock.available` | Shared inventory alert template. |

If a template key is not in the registry, Postal still uses the provided template string and falls back to the passed content. You can also pass extra tracing data through `provider_data.metadata` and `provider_data.custom_args`:

```ts
provider_data: {
  subject: "Order confirmation",
  html: "<p>Thanks for your order</p>",
  text: "Thanks for your order",
  workflow_event: "order.placed",
  workflow_run_id: "wf_run_123",
  metadata: {
    store: "main",
    environment: "production",
  },
  custom_args: {
    order_id: "ord_123",
    customer_group: "vip",
  },
}
```

`custom_args` are normalized into safe email headers for transport-level traceability. `metadata` stays available in Medusa-side notification data and logs.

The admin Postal settings page uses the same registry for test-send template selection, so the built-in examples stay aligned across the backend and admin UI.
The selected template also shows a preview of its subject, text, and HTML in the admin test-send panel.
That panel also includes a full example payload with recipient, sender identity, workflow metadata, and sample custom args for the selected template.
The same panel now lets you load the example values into the test form with one click, edit the message subject/text/HTML/custom args/metadata, or copy the example JSON directly.
It also exposes `cc`, `bcc`, and custom `headers` so test sends match the provider contract more closely.

You can also set sender identity fields when you need branded mail or a separate reply path:

```ts
provider_data: {
  from: "no-reply@uhlhosting.ch",
  from_name: "Postal Admin",
  reply_to: "support@uhlhosting.ch",
  cc: "copy@uhlhost.net",
  bcc: ["audit@highacid.com"],
  headers: {
    "X-Trace-Id": "trace_123",
  },
}
```

`from_name` formats the SMTP sender as `Name <email>`. `reply_to` is forwarded to the transport and preserved in provider data.

### Programmatic Workflows

You can trigger a direct email notification through the Postal provider programmatically using the `sendPostalEmailWorkflow`. This ensures the mail goes through the provider's standard channel and logs full delivery metadata.

```typescript
import { sendPostalEmailWorkflow } from "@uhlhosting/medusa-notification-postal"

const { result } = await sendPostalEmailWorkflow(req.scope).run({
  input: {
    to: "customer@uhlhost.net",
    from: "custom-sender@uhlhosting.ch", // Optional, defaults to POSTAL_FROM
    template: "custom-template-id",    // Optional
    provider_data: {
      subject: "Test Programmatic Email",
      html: "<p>Hello, this is a test email sent programmatically.</p>",
      text: "Hello, this is a test email sent programmatically.",
      cc: "copy@uhlhost.net",
      workflow_event: "admin.test_send",
      workflow_run_id: "wf_run_manual_123"
    }
  }
})

// Result returns the delivery info:
// { success: true, delivery: { message_id: "123", ... } }
```

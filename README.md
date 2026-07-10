# @uhlhosting/medusa-notification-postal

[![coverage](https://gitlab.uhlhost.net/uhlhosting/medusa-notification-postal/badges/main/coverage.svg?job=test)](https://gitlab.uhlhost.net/uhlhosting/medusa-notification-postal/-/jobs?scope=all&ref_type=branches&ref=main)

A production-ready Postal notification provider for Medusa. Designed for reliable transactional email delivery through Postal's HTTP API, strong configuration validation, template-based workflows, and seamless integration with Medusa’s notification system.

## Release

- Current package version: [![npm version](https://img.shields.io/npm/v/@uhlhosting/medusa-notification-postal.svg)](https://www.npmjs.com/package/@uhlhosting/medusa-notification-postal)
- License: `MIT`
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## Options

- `auth_type` - Postal API mode
- `from` - default sender e-mail address

### Postal API settings

- `base_url` - Postal base URL, for example `https://postal.example.com`
- `api_key` - Postal server API key used in `X-Server-API-Key`

`auth_type` only accepts `smtp-api` (the Postal HTTP API); any other value is rejected at startup.

### Environment variables

The provider options above are typically wired from environment variables. The plugin also reads the following at runtime:

| Variable | Secret | Purpose |
| --- | --- | --- |
| `POSTAL_AUTH_TYPE` | no | Auth mode; only `smtp-api` is supported (default `smtp-api`). |
| `POSTAL_FROM` | no | Default sender address (`from` option). |
| `POSTAL_BASE_URL` | no | Postal base URL (`base_url` option). Must be `http`/`https`. |
| `POSTAL_API_KEY` | **yes** | Postal server API key (`api_key` option). |
| `POSTAL_WEBHOOK_TOKEN` | **yes** | Shared secret in the tokenized webhook path; generated if unset. |
| `POSTAL_REQUEST_TIMEOUT_MS` | no | Outbound Postal HTTP timeout in ms (default `10000`). |
| `POSTAL_TEST_TO` | no | Default recipient for admin test sends. |
| `POSTAL_TEMPLATE_REGISTRY` | no | JSON overriding the built-in template registry. |
| `POSTAL_TEMPLATE_ORDER` | no | Comma-separated template display order. |
| `POSTAL_WEBHOOK_TAG_PREFIX` | no | Overrides the tag prefix used to correlate webhook callbacks. |
| `POSTAL_WEBHOOK_EVENTS_TABLE` | no | Overrides the webhook events table name. |
| `POSTAL_PROVIDER_ID` | no | Overrides the notification provider id. |
| `POSTAL_PLUGIN_MODULE` | no | Overrides the plugin module registration name. |

Keep the secret variables out of logs and client-visible surfaces; the admin settings endpoint never returns them.

### Settings persistence

Non-secret settings edited in the admin (`from`, `base_url`, `test_to`) persist in the `postal_setting` table via the plugin module — run `medusa db:migrate` after installing. Secrets (`POSTAL_API_KEY`, `POSTAL_WEBHOOK_TOKEN`) are sourced from the environment/provider options only, are read-only in the admin UI, and are never written to disk. Changes that affect the constructed provider take effect after a backend restart.

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
          auth_type: "smtp-api",
          from: process.env.POSTAL_FROM,
          base_url: process.env.POSTAL_BASE_URL,
          api_key: process.env.POSTAL_API_KEY,
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
  to: "cosmin@example.com",
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
POST /postal/webhooks/<postal-webhook-token>
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
  from: "no-reply@example.com",
  from_name: "Postal Admin",
  reply_to: "support@example.com",
  cc: "cosmin@uhl-services.ch",
  bcc: ["siravecavec@gmail.com"],
  headers: {
    "X-Trace-Id": "trace_123",
  },
}
```

`from_name` formats the sender as `Name <email>`. `reply_to` is forwarded to Postal and preserved in provider data.

### Programmatic Workflows

You can trigger a direct email notification through the Postal provider programmatically using the `sendPostalEmailWorkflow`. This ensures the mail goes through the provider's standard channel and logs full delivery metadata.

```typescript
import { sendPostalEmailWorkflow } from "@uhlhosting/medusa-notification-postal"

const { result } = await sendPostalEmailWorkflow(req.scope).run({
  input: {
    to: "cosmin@example.com",
    from: "custom-sender@example.com", // Optional, defaults to POSTAL_FROM
    template: "custom-template-id",    // Optional
    provider_data: {
      subject: "Test Programmatic Email",
      html: "<p>Hello, this is a test email sent programmatically.</p>",
      text: "Hello, this is a test email sent programmatically.",
      cc: "cosmin@uhl-services.ch",
      workflow_event: "admin.test_send",
      workflow_run_id: "wf_run_manual_123"
    }
  }
})

// Result returns the delivery info:
// { success: true, delivery: { message_id: "123", ... } }
```

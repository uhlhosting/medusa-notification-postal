# @uhlhosting/medusa-notification-postal

[![coverage](https://gitlab.uhlhost.net/uhlhosting/medusa-notification-postal/badges/main/coverage.svg?job=test)](https://gitlab.uhlhost.net/uhlhosting/medusa-notification-postal/-/jobs?scope=all&ref_type=branches&ref=main)

A production-ready Postal notification provider for Medusa. Designed for reliable transactional email delivery through Postal's HTTP API, strong configuration validation, template-based workflows, and seamless integration with Medusa’s notification system.

## Release

- Current package version: [![npm version](https://img.shields.io/npm/v/@uhlhosting/medusa-notification-postal.svg)](https://www.npmjs.com/package/@uhlhosting/medusa-notification-postal)
- License: `MIT`
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## Options

The package has two sets of options: the **provider** options, under the Notification Module, and the **plugin** options, on the `plugins` entry. See [Usage](#usage) for where each goes.

### Provider options

- `auth_type` - Postal API mode
- `from` - default sender e-mail address
- `base_url` - Postal base URL, for example `https://postal.example.com`
- `api_key` - Postal server API key used in `X-Server-API-Key`
- `request_timeout_ms` - outbound Postal HTTP timeout in ms. Optional. It takes precedence over `POSTAL_REQUEST_TIMEOUT_MS`, falls back to that variable and then to `10000`, and is clamped to 1000-60000.

`auth_type` only accepts `smtp-api` (the Postal HTTP API); any other value is rejected at startup.

### Plugin options

Every plugin option is off unless you set it, so upgrading changes nothing for a store that does not configure them.

| Option | Default | Effect |
| --- | --- | --- |
| `notification_retention_days` | unset (off) | A daily job (`postal-purge-expired-notifications`, 03:30) hard-deletes **every** row in Medusa's core `notification` table created more than this many days ago, whatever its provider, channel, template, resource or status. |
| `webhook_event_retention_days` | unset (off) | A daily job (`postal-purge-webhook-events`, 03:40) hard-deletes `postal_webhook_events` rows (recipient address and raw Postal payload) created more than this many days ago. |
| `ignore_engagement_webhooks` | `false` | `MessageLinkClicked` and `MessageLoaded` callbacks are acknowledged but neither stored nor emitted as `postal.clicked` / `postal.loaded`. Delivery outcomes (sent, delayed, failed, held, bounced, DNS errors) are still recorded. |

The retention options take a whole number of days from 1 to 7300, as a number or a numeric string. Any other value leaves that purge off, and the job logs a warning that names the option but not the value. Job schedules are fixed in the job files; the periods are read from the plugin module at run time. The jobs log counts and cutoffs only, never recipients or content.

`notification_retention_days` is deliberately provider-neutral. The `notification` table is shared by every notification provider in the store, and each row is delivery metadata (recipient, template, provider message id, sometimes a Reply-To address) with no retention of its own. Before you set it, check that nothing in your store relies on old rows: a notification `idempotency_key` only deduplicates while its row exists.

### Environment variables

The provider options above are typically wired from environment variables. The plugin also reads the following at runtime:

| Variable | Secret | Purpose |
| --- | --- | --- |
| `POSTAL_AUTH_TYPE` | no | Auth mode; only `smtp-api` is supported (default `smtp-api`). |
| `POSTAL_FROM` | no | Default sender address (`from` option). |
| `POSTAL_BASE_URL` | no | Postal base URL (`base_url` option). Must be `http`/`https`. |
| `POSTAL_API_KEY` | **yes** | Postal server API key (`api_key` option). |
| `POSTAL_WEBHOOK_TOKEN` | **yes** | Shared secret in the tokenized webhook path; generated if unset. |
| `POSTAL_REQUEST_TIMEOUT_MS` | no | Outbound Postal HTTP timeout in ms (default `10000`, clamped to 1000-60000). The `request_timeout_ms` provider option wins when set. |
| `POSTAL_TEST_TO` | no | Recipient for admin test sends, and the address sandbox mode redirects to. |
| `POSTAL_SANDBOX` | no | `true` redirects every recipient to `POSTAL_TEST_TO` (see [Sandbox mode](#sandbox-mode)). Off unless set. |
| `MEDUSA_BACKEND_URL` | no | Fallback origin for the absolute webhook callback URL shown in the admin, when the request's host cannot be used. `VITE_BACKEND_URL` is the second fallback and also the admin extension's backend URL. |

No other variables are read. The template registry, the webhook tag prefix (`uhlhosting.medusa-notification-postal:`), the webhook events table (`postal_webhook_events`), the provider identifier (`notification-postal`) and the module name (`postalPlugin`) are fixed in code and cannot be overridden from the environment.

Keep the secret variables out of logs and client-visible surfaces; the admin settings endpoint never returns them.

### Sandbox mode

A staging or preview deployment sends the same mail a production one does — order confirmations, quotes, contact enquiries — to the same real customers. Set `POSTAL_SANDBOX=true` there and every recipient is replaced by `POSTAL_TEST_TO` instead:

- `to`, `cc` and `bcc` all collapse to the single sandbox address, so nobody else is written to.
- The original addresses are preserved in `X-Postal-Sandbox-To`, `-Cc` and `-Bcc`, alongside `X-Postal-Sandbox: true`. These are applied after the caller's own headers, so a notification cannot forge or overwrite them.
- The subject is prefixed with the address it was meant for — `[sandbox: customer@example.com +3] Ihre Bestellung` — because one inbox now receives mail addressed to many different people, and the subject is the only part of that a mailbox list shows.

The switch is explicit and off by default, for two reasons:

- **`NODE_ENV` cannot stand in for it.** A typical Medusa container image sets `NODE_ENV=production` in its runtime stage, so staging, preview and production are all "production" to the running process and the value carries no signal.
- **Neither can the presence of `POSTAL_TEST_TO`.** Production sets that too — it is the recipient of the admin's *send test email* button — so defaulting to on would turn one forgotten variable in production into every customer's order confirmation landing in an internal test inbox. Silently swallowing real mail is a worse failure than the one sandbox mode prevents, so it fails closed.

If sandbox mode is on but `POSTAL_TEST_TO` is empty, the provider logs the misconfiguration once and sends as addressed; refusing would leave the environment unable to send anything at all.

### Settings persistence

Non-secret settings edited in the admin (`from`, `base_url`, `test_to`) persist in the `postal_setting` table via the plugin module — run `medusa db:migrate` after installing. Secrets (`POSTAL_API_KEY`, `POSTAL_WEBHOOK_TOKEN`) are sourced from the environment/provider options only, are read-only in the admin UI, and are never written to disk. Changes that affect the constructed provider take effect after a backend restart.

## Usage

Register the plugin package so its module, migrations, routes, and Admin
extension are loaded. Then register the explicit Postal provider subpath under
the Notification Module:

```ts
module.exports = defineConfig({
  plugins: [
    {
      resolve: "@uhlhosting/medusa-notification-postal",
      // Plugin options; all optional and off by default.
      options: {
        notification_retention_days: 90,
        webhook_event_retention_days: 90,
        ignore_engagement_webhooks: true,
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve:
              "@uhlhosting/medusa-notification-postal/providers/postal",
            id: "postal",
            options: {
              channels: ["email"],
              auth_type: "smtp-api",
              from: process.env.POSTAL_FROM,
              base_url: process.env.POSTAL_BASE_URL,
              api_key: process.env.POSTAL_API_KEY,
              request_timeout_ms: 10000,
            },
          },
        ],
      },
    },
  ],
})
```

## Workflow tracking

Use Medusa notification workflows and pass workflow metadata in `provider_data`:

```ts
await notificationModuleService.createNotifications({
  channel: "email",
  to: "cosmin@example.com",
  template: "order-placed",
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
| `admin-invite` | Native Medusa Admin invitation | `invite.created`, `invite.resent` | Use application-rendered content so the environment-specific invite URL is delivered without logging the token. |
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
  cc: "billing@example.com",
  bcc: ["archive@example.com"],
  headers: {
    "X-Trace-Id": "trace_123",
  },
}
```

`from_name` formats the sender as `Name <email>`. `reply_to` is forwarded to Postal as both the `reply_to` field and the `Reply-To` header when it is exactly one bare printable-ASCII address (surrounding whitespace is trimmed). Anything else (a display name, a list, CR/LF, non-ASCII or invisible characters) is dropped and a warning is logged that names no address; the message is still sent, without a reply path. This makes it safe to pass a customer-supplied address, such as a contact-form enquirer's.

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
      cc: "billing@example.com",
      workflow_event: "admin.test_send",
      workflow_run_id: "wf_run_manual_123"
    }
  }
})

// Result returns the delivery info:
// { success: true, delivery: { message_id: "123", ... } }
```

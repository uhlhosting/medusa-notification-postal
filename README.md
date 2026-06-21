# @uhl/medusa-notification-postal

Postal notification provider for Medusa, combining SendGrid-style provider robustness with Resend-style option validation and template-friendly usage.

## Release

- Current package version: `0.1.0`
- License: `MIT`
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## Options

- `auth_type` - one of `smtp-api`, `smtp-ip`, `smtp` (default `smtp-api`)
- `from` - default sender e-mail address

### `smtp-api` options

- `base_url` - Postal base URL, for example `https://post.example.com`
- `api_key` - Postal server API key used in `X-Server-API-Key`

### `smtp-ip` options

- `smtp_host` - Postal SMTP host
- `smtp_port` - SMTP port, default `25`
- `smtp_secure` - `true` for TLS, default `false`
- `smtp_timeout` - connection timeout in ms, default `10000`

### `smtp` options

- `smtp_host` - Postal SMTP host
- `smtp_port` - SMTP port, default `25`
- `smtp_secure` - `true` for TLS, default `false`
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
        resolve: "@uhl/medusa-notification-postal",
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
  to: "customer@example.com",
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

### Programmatic Workflows

You can trigger a direct email notification through the Postal provider programmatically using the `sendPostalEmailWorkflow`. This ensures the mail goes through the provider's standard channel and logs full delivery metadata.

```typescript
import { sendPostalEmailWorkflow } from "@uhl/medusa-notification-postal"

const { result } = await sendPostalEmailWorkflow(req.scope).run({
  input: {
    to: "customer@example.com",
    from: "custom-sender@example.com", // Optional, defaults to POSTAL_FROM
    template: "custom-template-id",    // Optional
    provider_data: {
      subject: "Test Programmatic Email",
      html: "<p>Hello, this is a test email sent programmatically.</p>",
      text: "Hello, this is a test email sent programmatically.",
      cc: "copy@example.com",
      workflow_event: "admin.test_send",
      workflow_run_id: "wf_run_manual_123"
    }
  }
})

// Result returns the delivery info:
// { success: true, delivery: { message_id: "123", ... } }
```

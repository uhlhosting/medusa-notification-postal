# @uhlhosting/medusa-notification-postal

Postal notification provider for Medusa, combining SendGrid-style provider robustness with Resend-style option validation and template-friendly usage.

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
  to: "customer@example.com",
  template: "order-placed",
  provider_id: "postal",
  provider_data: {
    subject: "Order confirmation",
    html: "<p>Thanks for your order</p>",
    workflow_event: "order.placed",
    workflow_run_id: "wf_run_123",
  },
})
```

The provider logs `workflow_event` and `workflow_run_id` for traceability in Medusa runtime logs.

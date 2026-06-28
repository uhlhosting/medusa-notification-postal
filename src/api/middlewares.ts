import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

const zod = z as any

const postalSettingsSchema = zod.object({
  action: zod.enum(["save", "test"]).optional(),
  to: zod.string().optional(),
  cc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
  bcc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
  from_name: zod.string().optional(),
  reply_to: zod.string().optional(),
  template: zod.string().optional(),
  subject: zod.string().optional(),
  html: zod.string().optional(),
  text: zod.string().optional(),
  headers: zod.record(zod.string()).optional(),
  custom_args: zod.record(zod.any()).optional(),
  metadata: zod.record(zod.any()).optional(),
  settings: zod
    .object({
      auth_type: zod.enum(["smtp-api", "smtp-ip", "smtp"]).optional(),
      from: zod.string().optional(),
      base_url: zod.string().optional(),
      api_key: zod.string().optional(),
      smtp_host: zod.string().optional(),
      smtp_port: zod.string().optional(),
      smtp_secure: zod.string().optional(),
      smtp_user: zod.string().optional(),
      smtp_pass: zod.string().optional(),
      test_to: zod.string().optional(),
    })
    .partial()
    .optional(),
})

const postalSendTestSchema = zod
  .object({
    to: zod.union([zod.string().min(1), zod.array(zod.string().min(1)).min(1)]),
    from: zod.string().optional(),
    from_name: zod.string().optional(),
    reply_to: zod.string().optional(),
    template: zod.string().optional(),
    subject: zod.string().min(1),
    html: zod.string().optional(),
    text: zod.string().optional(),
    cc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
    bcc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
    headers: zod.record(zod.string()).optional(),
    custom_args: zod.record(zod.any()).optional(),
    metadata: zod.record(zod.any()).optional(),
  })
  .strict()

const postalWebhookSchema = zod
  .object({
    event: zod.string().optional(),
    event_type: zod.string().optional(),
    type: zod.string().optional(),
    name: zod.string().optional(),
    status: zod.string().optional(),
    message_status: zod.string().optional(),
    delivery_status: zod.string().optional(),
    timestamp: zod.union([zod.string(), zod.number()]).optional(),
    occurred_at: zod.union([zod.string(), zod.number()]).optional(),
    occurredAt: zod.union([zod.string(), zod.number()]).optional(),
    created_at: zod.union([zod.string(), zod.number()]).optional(),
    message: zod.record(zod.any()).optional(),
    data: zod.record(zod.any()).optional(),
    recipient: zod.string().optional(),
    to: zod.string().optional(),
    email: zod.string().optional(),
  })
  .passthrough()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/plugin-settings/postal",
      method: "POST",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"]),
        validateAndTransformBody(postalSettingsSchema),
      ],
    },
    {
      matcher: "/admin/postal/send-test",
      method: "POST",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"]),
        validateAndTransformBody(postalSendTestSchema),
      ],
    },
    {
      matcher: "/store/postal/webhooks",
      method: "POST",
      middlewares: [
        validateAndTransformBody(postalWebhookSchema),
      ],
    },
  ],
})

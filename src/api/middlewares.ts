import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

const postalSettingsSchema = z.object({
  action: z.enum(["save", "test"]).optional(),
  to: z.string().optional(),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  from_name: z.string().optional(),
  reply_to: z.string().optional(),
  template: z.string().optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  custom_args: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  settings: z
    .object({
      auth_type: z.enum(["smtp-api"]).optional(),
      from: z.string().optional(),
      base_url: z.string().optional(),
      api_key: z.string().optional(),
      test_to: z.string().optional(),
    })
    .partial()
    .optional(),
})

const MAX_EMAIL = 254
const MAX_NAME = 255
const MAX_SUBJECT = 998 // RFC 5322 hard limit
const MAX_BODY = 2_097_152 // 2 MB
const MAX_HEADER_KEY = 78
const MAX_HEADER_VAL = 998

const postalSendTestSchema = z
  .object({
    to: z.union([
      z.string().min(1).max(MAX_EMAIL),
      z.array(z.string().min(1).max(MAX_EMAIL)).min(1).max(50),
    ]),
    from: z.string().max(MAX_EMAIL).optional(),
    from_name: z.string().max(MAX_NAME).optional(),
    reply_to: z.string().max(MAX_EMAIL).optional(),
    template: z.string().max(MAX_NAME).optional(),
    subject: z.string().min(1).max(MAX_SUBJECT),
    html: z.string().max(MAX_BODY).optional(),
    text: z.string().max(MAX_BODY).optional(),
    cc: z
      .union([
        z.string().max(MAX_EMAIL),
        z.array(z.string().max(MAX_EMAIL)).max(50),
      ])
      .optional(),
    bcc: z
      .union([
        z.string().max(MAX_EMAIL),
        z.array(z.string().max(MAX_EMAIL)).max(50),
      ])
      .optional(),
    headers: z
      .record(z.string().max(MAX_HEADER_KEY), z.string().max(MAX_HEADER_VAL))
      .optional(),
    custom_args: z.record(z.string().max(MAX_NAME), z.string().max(MAX_NAME)).optional(),
    metadata: z.record(z.string().max(MAX_NAME), z.string().max(MAX_NAME)).optional(),
  })
  .strict()

// Public webhook payloads from Postal are flexible JSON objects; accept any
// object shape but reject arrays/primitives at the top level. The hard defense
// against payload-amplification DoS is the bodyParser size cap on the route.
const postalWebhookSchema = z.record(z.string(), z.unknown())

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/plugin",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/postal/health",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/postal/messages/:id",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/postal/webhooks",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/postal/webhook-url",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/plugin-settings/postal",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
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
      matcher: "/postal/webhooks/:token",
      method: "POST",
      bodyParser: { sizeLimit: "512kb" },
      middlewares: [validateAndTransformBody(postalWebhookSchema)],
    },
  ],
})

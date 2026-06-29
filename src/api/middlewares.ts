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
      auth_type: zod.enum(["smtp-api"]).optional(),
      from: zod.string().optional(),
      base_url: zod.string().optional(),
      api_key: zod.string().optional(),
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
  ],
})

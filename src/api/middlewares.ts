import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "zod"

const zod = z as any

const postalSettingsSchema = zod.object({
  action: zod.enum(["save", "test"]).optional(),
  to: zod.string().optional(),
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
    template: zod.string().optional(),
    subject: zod.string().min(1),
    html: zod.string().optional(),
    text: zod.string().optional(),
    cc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
    bcc: zod.union([zod.string(), zod.array(zod.string())]).optional(),
    headers: zod.record(zod.string()).optional(),
  })
  .strict()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/plugin-settings/postal",
      method: "POST",
      middlewares: [
        validateAndTransformBody(postalSettingsSchema),
      ],
    },
    {
      matcher: "/admin/postal/send-test",
      method: "POST",
      middlewares: [
        validateAndTransformBody(postalSendTestSchema),
      ],
    },
  ],
})

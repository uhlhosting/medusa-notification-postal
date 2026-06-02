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

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/plugin-settings/postal",
      method: "POST",
      middlewares: [
        validateAndTransformBody(postalSettingsSchema),
      ],
    },
  ],
})

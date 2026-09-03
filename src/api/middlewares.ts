import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { timingSafeEqual } from "node:crypto"

import { postalSettingsSchema } from "./admin/plugin-settings/postal/validators"
import { postalSendTestSchema } from "./admin/postal/send-test/validators"
import { postalWebhookSchema } from "./postal/webhooks/[token]/validators"

export const postalWebhookListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
})
export type PostalWebhookListQuery = z.infer<typeof postalWebhookListSchema>

const normalizeToken = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const authenticatePostalWebhook = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const providedToken = normalizeToken(req.params.token)
  const expectedToken = normalizeToken(process.env.POSTAL_WEBHOOK_TOKEN)

  if (!providedToken || !expectedToken) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Invalid Postal webhook token"
    )
  }

  const providedBuffer = Buffer.from(providedToken)
  const expectedBuffer = Buffer.from(expectedToken)

  if (
    !providedBuffer.length ||
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Invalid Postal webhook token"
    )
  }

  next()
}

// Invariant 4: every Postal admin route requires an authenticated Medusa admin
// user. One definition so a route cannot be added with a weaker set.
const authenticateAdmin = () =>
  authenticate("user", ["session", "bearer", "api-key"])

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/plugin",
      method: "GET",
      middlewares: [authenticateAdmin()],
    },
    {
      matcher: "/admin/postal/health",
      method: "GET",
      middlewares: [authenticateAdmin()],
    },
    {
      matcher: "/admin/postal/messages/:id",
      method: "GET",
      middlewares: [authenticateAdmin()],
    },
    {
      matcher: "/admin/postal/webhooks",
      method: "GET",
      middlewares: [
        authenticateAdmin(),
        validateAndTransformQuery(postalWebhookListSchema, {}),
      ],
    },
    {
      matcher: "/admin/postal/webhook-url",
      method: "GET",
      middlewares: [authenticateAdmin()],
    },
    {
      matcher: "/admin/plugin-settings/postal",
      method: "GET",
      middlewares: [authenticateAdmin()],
    },
    {
      matcher: "/admin/plugin-settings/postal",
      method: "POST",
      middlewares: [
        authenticateAdmin(),
        validateAndTransformBody(postalSettingsSchema),
      ],
    },
    {
      matcher: "/admin/postal/send-test",
      method: "POST",
      middlewares: [
        authenticateAdmin(),
        validateAndTransformBody(postalSendTestSchema),
      ],
    },
    {
      matcher: "/postal/webhooks/:token",
      method: "POST",
      bodyParser: { sizeLimit: "512kb" },
      middlewares: [
        authenticatePostalWebhook,
        validateAndTransformBody(postalWebhookSchema)
      ],
    },
  ],
})

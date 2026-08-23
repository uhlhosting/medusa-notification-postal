import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { timingSafeEqual } from "node:crypto"
import { handlePostalWebhookPost } from "../../../store/postal/webhooks/handler"

const normalizeToken = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const tokenMatches = (provided: string, expected: string) => {
  if (!provided || !expected || provided.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const providedToken = normalizeToken(req.params.token)
  const expectedToken = normalizeToken(process.env.POSTAL_WEBHOOK_TOKEN)

  if (!providedToken || !expectedToken || !tokenMatches(providedToken, expectedToken)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Invalid Postal webhook token"
    )
  }

  const { status, body } = await handlePostalWebhookPost({
    scope: req.scope,
    body: req.body as Record<string, unknown> | undefined,
    validatedBody: req.validatedBody as Record<string, unknown> | undefined,
  })

  return res.status(status).json(body)
}

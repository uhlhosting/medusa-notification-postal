import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { timingSafeEqual } from "node:crypto"
import { recordPostalWebhookWorkflow } from "../../../../workflows/record-postal-webhook"

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

  const payload = (req.validatedBody || req.body || {}) as Record<string, unknown>

  const { result } = await recordPostalWebhookWorkflow(req.scope).run({
    input: payload,
  })

  if (!result) {
    return res.status(202).json({
      ok: true,
      ignored: true,
    })
  }

  return res.status(202).json({
    ok: true,
    id: result.id,
    event_type: result.event_type,
    status: result.status,
  })
}

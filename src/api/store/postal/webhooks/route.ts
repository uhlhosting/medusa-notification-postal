import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { recordPostalWebhookWorkflow } from "../../../../workflows/record-postal-webhook"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = (req.validatedBody || req.body || {}) as Record<string, unknown>

  const { result } = await recordPostalWebhookWorkflow(req.scope).run({
    input: payload,
  })

  return res.status(202).json({
    ok: true,
    id: result.id,
    event_type: result.event_type,
    status: result.status,
  })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handlePostalWebhookPost } from "../../../store/postal/webhooks/handler"
import { type PostalWebhookBody } from "./validators"

export const POST = async (req: MedusaRequest<PostalWebhookBody>, res: MedusaResponse) => {
  const { status, body } = await handlePostalWebhookPost({
    scope: req.scope,
    validatedBody: req.validatedBody as Record<string, unknown>,
  })

  return res.status(status).json(body)
}

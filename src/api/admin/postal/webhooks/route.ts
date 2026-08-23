import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { resolvePostalModule } from "../../../../modules/postal/constants"
import {
  listPostalWebhookEvents,
  type PostalWebhookEventService,
} from "../../../../modules/postal/webhooks"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = resolvePostalModule<PostalWebhookEventService>(req.scope)

  const limit = Number(req.validatedQuery.limit ?? 25)
  const events = await listPostalWebhookEvents(service, limit)

  return res.status(200).json({
    events,
  })
}

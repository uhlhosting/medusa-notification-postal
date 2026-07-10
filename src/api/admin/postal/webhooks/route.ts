import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { POSTAL_PLUGIN_MODULE } from "../../../../modules/postal/constants"
import {
  listPostalWebhookEvents,
  type PostalWebhookEventService,
} from "../../../../modules/postal/webhooks"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  let service: PostalWebhookEventService | null = null
  try {
    service = req.scope.resolve(POSTAL_PLUGIN_MODULE) as PostalWebhookEventService
  } catch {
    service = null
  }

  const limit = Number.parseInt(String(req.query.limit || "25"), 10)
  const events = await listPostalWebhookEvents(service, limit)

  return res.status(200).json({
    events,
  })
}

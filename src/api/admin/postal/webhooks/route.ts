import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { resolveOptionalPgConnection } from "../../../../modules/postal/db"
import { listPostalWebhookEvents } from "../../../../modules/postal/webhooks"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pgConnection = resolveOptionalPgConnection(req.scope)
  const limit = Number.parseInt(String(req.query.limit || "25"), 10)
  const events = await listPostalWebhookEvents(pgConnection, limit)

  return res.status(200).json({
    events,
  })
}

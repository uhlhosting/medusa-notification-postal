import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listPostalWebhookEvents } from "../../../../modules/postal/webhooks"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve("pgConnection")
  const limit = Number.parseInt(String(req.query.limit || "25"), 10)
  const events = await listPostalWebhookEvents(pgConnection, limit)

  return res.status(200).json({
    events,
  })
}

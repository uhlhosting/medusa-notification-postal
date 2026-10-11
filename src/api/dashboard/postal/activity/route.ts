import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../../../../modules/postal/constants"
import type { PostalWebhookRecord } from "../../../../modules/postal/webhooks"
import type { PostalActivityQuery } from "./validators"

type ActivityService = {
  listAndCountPostalWebhookEvents: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<[PostalWebhookRecord[], number]>
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = resolvePostalModule<ActivityService>(req.scope)
  if (!service?.listAndCountPostalWebhookEvents) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Postal activity unavailable")
  const { limit, offset } = req.validatedQuery as PostalActivityQuery
  const [records, count] = await service.listAndCountPostalWebhookEvents(
    { created_at: { $gte: new Date(Date.now() - 30 * 86400000) } },
    { take: limit, skip: offset, order: { created_at: "DESC", id: "DESC" }, select: ["id", "event_type", "status", "message_id", "occurred_at", "created_at"] }
  )
  const events = records.map(({ id, event_type, status, message_id, occurred_at, created_at }) => ({ id, event_type, status, message_id, occurred_at, created_at }))
  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json({ events, count, limit, offset })
}

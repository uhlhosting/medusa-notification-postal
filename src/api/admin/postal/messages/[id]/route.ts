import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { PostalNotificationService } from "../../../../../providers/postal/services/postal"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const id = String(req.params.id || "").trim()
  const numericId = Number.parseInt(id, 10)

  if (!id || !Number.isFinite(numericId) || String(numericId) !== id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal message lookup requires a numeric message id"
    )
  }

  // Delegate to the resolved provider service instead of re-implementing the
  // Postal HTTP client and reading process.env directly. This keeps credential
  // and transport logic in one place (module -> provider -> route layering).
  const service = req.scope.resolve(
    "notification-postal"
  ) as PostalNotificationService

  const [message, deliveries] = await Promise.all([
    service.getMessageDetails(numericId),
    service.getMessageDeliveries(numericId),
  ])

  return res.status(200).json({
    id: numericId,
    message,
    deliveries,
  })
}

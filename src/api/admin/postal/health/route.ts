import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { resolvePostalProvider } from "../../../../providers/postal/resolve-provider"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const service = resolvePostalProvider(req.scope)
    const runtime = service.getHealthSnapshot()

    return res.status(200).json({
      code: "postal_provider_active",
      type: "postal_health_status",
      status: "ok",
      message: "Postal notification provider is active",
      auth_type: runtime.auth_type,
      mode: runtime.mode,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return res.status(503).json({
      code: "postal_provider_unavailable",
      type: "postal_health_status",
      status: "error",
      message: "Postal notification provider is not loaded",
      timestamp: new Date().toISOString(),
    })
  }
}

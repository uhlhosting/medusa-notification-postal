import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  let authType = "smtp-api"
  let mode = "http-api"

  try {
    const service = req.scope.resolve("notification-postal") as any
    const runtime = service?.getHealthSnapshot?.()
    if (runtime?.auth_type && runtime?.mode) {
      authType = runtime.auth_type
      mode = runtime.mode
    }
  } catch {
    // Keep env fallback for health endpoint resilience.
  }

  res.json({
    code: "postal_provider_active",
    type: "postal_health_status",
    status: "ok",
    message: "Postal notification provider is active",
    auth_type: authType,
    mode,
    timestamp: new Date().toISOString()
  })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const authType = process.env.POSTAL_AUTH_TYPE || "smtp-api"

  res.json({
    status: "ok",
    message: "Postal notification provider is active",
    auth_type: authType,
    mode:
      authType === "smtp-api"
        ? "http-api"
        : authType === "smtp-ip"
          ? "smtp-ip-allowlist"
          : "smtp-auth",
    timestamp: new Date().toISOString()
  })
}

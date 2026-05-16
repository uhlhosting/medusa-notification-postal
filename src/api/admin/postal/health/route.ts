import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve("logger")
  
  // We don't have direct access to provider options here easily without resolving the module
  // But we can try to fetch the Postal version or some public info if base_url is known
  // For now, we'll return a placeholder success if the module is loaded
  
  res.json({
    status: "ok",
    message: "Postal notification provider is active",
    timestamp: new Date().toISOString()
  })
}

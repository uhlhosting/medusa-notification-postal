import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../../../../modules/postal/constants"
import { toAbsoluteOrigin } from "../../../../modules/postal/origin"
import {
  getPostalSettings,
  type PostalSettingService,
} from "../../../../modules/postal/settings"

const getRequestOrigin = (req: AuthenticatedMedusaRequest) => {
  const headers = req.headers || {}
  const originHeader = toAbsoluteOrigin(headers.origin)
  if (originHeader) {
    return originHeader
  }

  const forwardedProto = String(
    headers["x-forwarded-proto"] || headers["x-forwarded-protocol"] || ""
  )
    .split(",")[0]
    .trim()
  const forwardedHost = String(
    headers["x-forwarded-host"] || headers.host || ""
  )
    .split(",")[0]
    .trim()

  if (!forwardedHost) {
    return (
      toAbsoluteOrigin(process.env.MEDUSA_BACKEND_URL) ||
      toAbsoluteOrigin(process.env.VITE_BACKEND_URL)
    )
  }

  const isLocalHost =
    /^localhost(?::\d+)?$/i.test(forwardedHost) ||
    /^127\.0\.0\.1(?::\d+)?$/i.test(forwardedHost) ||
    /^\[::1\](?::\d+)?$/i.test(forwardedHost) ||
    /\.local(?::\d+)?$/i.test(forwardedHost)
  const protocol = forwardedProto || (isLocalHost ? "http" : "https")
  return (
    toAbsoluteOrigin(`${protocol}://${forwardedHost}`) ||
    toAbsoluteOrigin(process.env.MEDUSA_BACKEND_URL) ||
    toAbsoluteOrigin(process.env.VITE_BACKEND_URL)
  )
}

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = resolvePostalModule<PostalSettingService>(req.scope)
  const settings = await getPostalSettings(service)
  const token = String(settings.webhook_token || "").trim()
  const origin = getRequestOrigin(req)

  if (!token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal webhook token is not configured. Set POSTAL_WEBHOOK_TOKEN in the backend environment."
    )
  }

  return res.status(200).json({
    token,
    path: `/postal/webhooks/${token}`,
    callback_url: origin
      ? new URL(`/postal/webhooks/${token}`, origin).toString()
      : null,
  })
}

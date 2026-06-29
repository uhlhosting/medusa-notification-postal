import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { resolveOptionalPgConnection } from "../../../../modules/postal/db"
import { getPostalSettings } from "../../../../modules/postal/settings"

const toAbsoluteOrigin = (value: unknown) => {
  const candidate = String(value || "").trim()
  if (!candidate) {
    return null
  }

  try {
    return new URL(candidate).origin.replace(/\/+$/, "")
  } catch {
    return null
  }
}

const getRequestOrigin = (req: AuthenticatedMedusaRequest) => {
  const headers = req.headers || {}
  const originHeader = toAbsoluteOrigin(headers.origin || headers["origin"])
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
  const pgConnection = resolveOptionalPgConnection(req.scope)
  const settings = await getPostalSettings(pgConnection)
  const token = String(settings.webhook_token || "").trim()
  const origin = getRequestOrigin(req)

  if (!token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal webhook token is not configured yet. Save Postal settings to generate it."
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

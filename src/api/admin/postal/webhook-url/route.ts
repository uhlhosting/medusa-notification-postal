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

// The callback URL embeds the webhook token and is meant to be pasted into
// Postal's dashboard, so its origin must come from trusted server
// configuration only. Request headers (Origin, Host, X-Forwarded-*) are
// caller-controlled — a forged or cross-origin admin request could otherwise
// make the Activity page display a tokenized URL on an attacker host.
const getConfiguredBackendOrigin = () =>
  toAbsoluteOrigin(process.env.MEDUSA_BACKEND_URL) ||
  toAbsoluteOrigin(process.env.VITE_BACKEND_URL)

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = resolvePostalModule<PostalSettingService>(req.scope)
  const settings = await getPostalSettings(service)
  const token = String(settings.webhook_token || "").trim()
  const origin = getConfiguredBackendOrigin()

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

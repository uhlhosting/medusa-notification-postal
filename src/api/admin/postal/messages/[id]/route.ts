import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type PostalApiResponse = {
  status?: string
  data?: any
}

const POSTAL_REQUEST_TIMEOUT_MS = 10000

const postPostalApi = async (path: string, payload: Record<string, unknown>) => {
  const authType = String(process.env.POSTAL_AUTH_TYPE || "smtp-api").trim()
  const baseUrl = String(process.env.POSTAL_BASE_URL || "").trim().replace(/\/$/, "")
  const apiKey = String(process.env.POSTAL_API_KEY || "").trim()

  if (authType !== "smtp-api") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal message lookup requires smtp-api mode"
    )
  }

  if (!baseUrl || !apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal message lookup requires POSTAL_BASE_URL and POSTAL_API_KEY"
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), POSTAL_REQUEST_TIMEOUT_MS)

  const response = await fetch(`${baseUrl}/api/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Server-API-Key": apiKey,
    },
    signal: controller.signal,
    body: JSON.stringify(payload),
  }).finally(() => clearTimeout(timeout))

  const body = (await response.json().catch(() => null)) as PostalApiResponse | null

  if (!response.ok || !body || body.status === "error") {
    const details =
      body?.data?.message ||
      body?.data?.error ||
      body?.status ||
      "unknown error"

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Postal API request failed: ${response.status} - ${details}`
    )
  }

  return body.data
}

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

  const [message, deliveries] = await Promise.all([
    postPostalApi("messages/message", {
      id: numericId,
      _expansions: true,
    }),
    postPostalApi("messages/deliveries", {
      id: numericId,
    }),
  ])

  return res.status(200).json({
    id: numericId,
    message,
    deliveries,
  })
}

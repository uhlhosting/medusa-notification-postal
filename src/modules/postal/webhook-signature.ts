import { createPublicKey, verify, type KeyObject } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

// Postal signs every webhook POST over the exact raw request body with its
// installation-wide RSA key (PKCS#1 v1.5, Base64). Postal >= 3.2 sends a SHA256
// signature; Postal 2.x only sends the legacy SHA1 one. Node lowercases header
// names on `req.headers`.
export const POSTAL_SIGNATURE_256_HEADER = "x-postal-signature-256"
export const POSTAL_SIGNATURE_HEADER = "x-postal-signature"

export type PostalSignatureHeaders = {
  signature256?: string
  signature?: string
}

const parseJwk = (value: string) => {
  const parsed = JSON.parse(value)
  // Accept Postal's /.well-known/jwks.json document as-is when it holds a
  // single key, so operators can paste it without extracting `keys[0]`.
  return Array.isArray(parsed?.keys) && parsed.keys.length === 1
    ? parsed.keys[0]
    : parsed
}

// Parses a PEM public key or an RSA JWK (JSON). Throws when the value is not an
// RSA public key.
export const parsePostalWebhookPublicKey = (value: string): KeyObject => {
  const trimmed = value.trim()
  const key = trimmed.startsWith("{")
    ? createPublicKey({ key: parseJwk(trimmed), format: "jwk" })
    : // Single-line env files often carry the PEM with literal "\n" escapes.
      createPublicKey(trimmed.replace(/\\n/g, "\n"))

  if (key.asymmetricKeyType !== "rsa") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal webhook public key must be an RSA key"
    )
  }

  return key
}

let cachedKey: { source: string; key: KeyObject | null } | null = null

// Parses the configured key once per distinct value. A value that fails to
// parse is cached as invalid too, so a misconfiguration is not re-parsed on
// every request. Only token-authenticated callers reach this, so the 500 body
// naming the misconfiguration is safe; it deliberately omits the parser cause,
// which can echo part of the configured value.
export const resolvePostalWebhookPublicKey = (source: string): KeyObject => {
  if (cachedKey?.source !== source) {
    let key: KeyObject | null = null

    try {
      key = parsePostalWebhookPublicKey(source)
    } catch {
      key = null
    }

    cachedKey = { source, key }
  }

  if (!cachedKey.key) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "POSTAL_WEBHOOK_PUBLIC_KEY is not a valid RSA public key (expected PEM or JWK)"
    )
  }

  return cachedKey.key
}

// Verifies Postal's signature over the raw body bytes. The SHA256 header wins
// whenever present; SHA1 is used only when that header is absent, so a failing
// SHA256 signature is never retried with the weaker digest.
export const hasValidPostalSignature = (
  rawBody: Buffer,
  headers: PostalSignatureHeaders,
  key: KeyObject
): boolean => {
  const signature256 = headers.signature256?.trim() || ""
  const signature = headers.signature?.trim() || ""
  const [algorithm, encoded] = signature256
    ? ["sha256", signature256]
    : ["sha1", signature]

  if (!encoded) {
    return false
  }

  try {
    return verify(algorithm, rawBody, key, Buffer.from(encoded, "base64"))
  } catch {
    return false
  }
}

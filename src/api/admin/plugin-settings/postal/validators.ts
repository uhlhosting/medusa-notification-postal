import { z } from "@medusajs/framework/zod"
import { isPublicPostalBaseUrl } from "../../../../providers/postal/base-url"

const optionalEmail = z.string().trim().max(254).refine(
  (value) => !value || z.string().email().safeParse(value).success,
  "Must be a valid email address"
)

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const optionalHttpUrl = z.string().trim().max(2048).refine(
  (value) => !value || isHttpUrl(value),
  "Must be an absolute http or https URL"
).refine((value) => {
  // The provider appends "/api/v1/<path>" to base_url, so a query or fragment
  // would swallow that path, and fetch refuses URLs with credentials.
  if (!value || !isHttpUrl(value)) {
    return true
  }
  const hasControlCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code < 0x20 || code === 0x7f
  })
  if (hasControlCharacter || value.includes("?") || value.includes("#")) {
    return false
  }
  const url = new URL(value)
  return !url.username && !url.password
}, "Must be a plain http or https URL without credentials, query or fragment").refine(
  // Same SSRF guard the provider applies before every request, so a base_url
  // that could never be used is refused when it is saved.
  (value) => !value || !isHttpUrl(value) || isPublicPostalBaseUrl(value),
  "Must not target localhost or a private, loopback, link-local or other non-public IP address; use a hostname"
)

export const postalSettingsDataSchema = z.object({
  auth_type: z.literal("smtp-api").optional(),
  from: optionalEmail.optional(),
  base_url: optionalHttpUrl.optional(),
  test_to: optionalEmail.optional(),
}).strict()

export const postalSettingsSchema = z.object({
  action: z.literal("save"),
  settings: postalSettingsDataSchema,
}).strict()

export type PostalSettingsBody = z.infer<typeof postalSettingsSchema>

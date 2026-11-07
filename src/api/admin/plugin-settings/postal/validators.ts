import { z } from "@medusajs/framework/zod"
import { isPublicPostalBaseUrl } from "../../../../providers/postal/base-url"

const optionalEmail = z.string().trim().max(254).refine(
  (value) => !value || z.string().email().safeParse(value).success,
  "Must be a valid email address"
)

const optionalHttpUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}, "Must be an absolute http or https URL").refine(
  // Same SSRF guard the provider applies before every request, so a base_url
  // that could never be used is refused when it is saved.
  (value) => !value || !URL.canParse(value) || isPublicPostalBaseUrl(value),
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

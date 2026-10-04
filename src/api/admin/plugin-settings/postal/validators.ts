import { z } from "@medusajs/framework/zod"

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
}, "Must be an absolute http or https URL")

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

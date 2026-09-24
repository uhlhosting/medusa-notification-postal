import { z } from "@medusajs/framework/zod"

const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export const postalSettingsDataSchema = z.object({
  auth_type: z.enum(["smtp-api"]).optional(),
  from: z.string().optional(),
  // Empty keeps the current value; anything else must be an http(s) URL
  // (invariant 11), so a bad value is never persisted and synced at boot.
  base_url: z
    .string()
    .trim()
    .refine((value) => !value || isHttpUrl(value), {
      message: "base_url must be an absolute http or https URL",
    })
    .optional(),
  test_to: z.string().optional(),
}).strict()

export const postalSettingsSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    settings: postalSettingsDataSchema.optional(),
  }).strict(),
  z.object({
    action: z.literal("test"),
    settings: postalSettingsDataSchema.optional(),
    to: z.string().optional(),
  }).strict(),
])

export type PostalSettingsBody = z.infer<typeof postalSettingsSchema>

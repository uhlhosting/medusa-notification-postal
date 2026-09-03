import { z } from "@medusajs/framework/zod"

export const postalSettingsDataSchema = z.object({
  auth_type: z.enum(["smtp-api"]).optional(),
  from: z.string().optional(),
  base_url: z.string().optional(),
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

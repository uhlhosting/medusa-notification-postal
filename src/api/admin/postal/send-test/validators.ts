import { z } from "@medusajs/framework/zod"
import { postalSettingsDataSchema } from "../../plugin-settings/postal/validators"

const MAX_EMAIL = 254
const MAX_NAME = 255
const MAX_SUBJECT = 998 // RFC 5322 hard limit
const MAX_BODY = 2_097_152 // 2 MB
const MAX_HEADER_KEY = 78
const MAX_HEADER_VAL = 998

export const postalSendTestSchema = z
  .object({
    to: z.union([
      z.string().min(1).max(MAX_EMAIL),
      z.array(z.string().min(1).max(MAX_EMAIL)).min(1).max(50),
    ]),
    from: z.string().max(MAX_EMAIL).optional(),
    from_name: z.string().max(MAX_NAME).optional(),
    reply_to: z.string().max(MAX_EMAIL).optional(),
    template: z.string().max(MAX_NAME).optional(),
    subject: z.string().min(1).max(MAX_SUBJECT),
    html: z.string().max(MAX_BODY).optional(),
    text: z.string().max(MAX_BODY).optional(),
    cc: z
      .union([
        z.string().max(MAX_EMAIL),
        z.array(z.string().max(MAX_EMAIL)).max(50),
      ])
      .optional(),
    bcc: z
      .union([
        z.string().max(MAX_EMAIL),
        z.array(z.string().max(MAX_EMAIL)).max(50),
      ])
      .optional(),
    headers: z
      .record(z.string().max(MAX_HEADER_KEY), z.string().max(MAX_HEADER_VAL))
      .optional(),
    custom_args: z.record(z.string().max(MAX_NAME), z.string().max(MAX_NAME)).optional(),
    metadata: z.record(z.string().max(MAX_NAME), z.string().max(MAX_NAME)).optional(),
    settings: postalSettingsDataSchema.optional(),
  })
  .strict()

export type PostalSendTestBody = z.infer<typeof postalSendTestSchema>

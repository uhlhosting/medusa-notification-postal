import { z } from "@medusajs/framework/zod"

const MAX_EMAIL = 254
const MAX_NAME = 255
const MAX_SUBJECT = 998 // RFC 5322 hard limit
const MAX_BODY = 2_097_152 // 2 MB
const MAX_HEADER_KEY = 78
const MAX_HEADER_VAL = 998

const email = z.string().trim().min(1).max(MAX_EMAIL).email()
const emailList = z.union([
  email,
  z.array(email).min(1).max(50),
])

export const postalSendTestSchema = z
  .object({
    to: emailList.optional(),
    from: email.optional(),
    from_name: z.string().trim().max(MAX_NAME).optional(),
    reply_to: email.optional(),
    template: z.string().trim().max(MAX_NAME).optional(),
    subject: z.string().trim().min(1).max(MAX_SUBJECT).optional(),
    html: z.string().max(MAX_BODY).optional(),
    text: z.string().max(MAX_BODY).optional(),
    cc: emailList.optional(),
    bcc: emailList.optional(),
    headers: z
      .record(z.string().max(MAX_HEADER_KEY), z.string().max(MAX_HEADER_VAL))
      .optional(),
    custom_args: z.record(z.string().max(MAX_NAME), z.unknown()).optional(),
    metadata: z.record(z.string().max(MAX_NAME), z.unknown()).optional(),
  })
  .strict()

export type PostalSendTestBody = z.infer<typeof postalSendTestSchema>

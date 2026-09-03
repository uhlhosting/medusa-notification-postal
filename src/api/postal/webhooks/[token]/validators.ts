import { z } from "@medusajs/framework/zod"

export const postalWebhookSchema = z.record(z.string(), z.unknown())

export type PostalWebhookBody = z.infer<typeof postalWebhookSchema>

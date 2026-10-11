import { z } from "@medusajs/framework/zod"

export const postalActivityQuerySchema = z.strictObject({
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().min(1).max(100)).default(25),
  offset: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().min(0).max(10000)).default(0),
})
export type PostalActivityQuery = z.infer<typeof postalActivityQuerySchema>

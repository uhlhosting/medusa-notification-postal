import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import PostalPluginModuleService from "../modules/postal/service"
import { publishPostalWebhookWorkflow } from "../workflows/publish-postal-webhook"
export default async function postalWebhookPublication(container: MedusaContainer) {
  const service = container.resolve<PostalPluginModuleService>("postalPlugin")
  const records = await service.listPostalWebhookEvents({ published_at: null, $or: [{ publication_owner: null }, { publication_expires_at: { $lte: new Date() } }] }, { take: 100, order: { updated_at: "ASC", id: "ASC" } })
  const deadline = Date.now() + 30_000
  for (const record of records) {
    if (Date.now() >= deadline) break
    try { await publishPostalWebhookWorkflow(container).run({ input: record.id }) }
    catch { container.resolve(ContainerRegistrationKeys.LOGGER).warn("Postal webhook publication remains pending") }
  }
}
export const config = { name: "postal-webhook-publication", schedule: "* * * * *" }

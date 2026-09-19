import type { MedusaContainer } from "@medusajs/framework/types"
import { purgePostalWebhookEventsWorkflow } from "../workflows/purge-postal-webhook-events"
import { runRetentionJob } from "../lib/retention-job"

/**
 * Enforces the plugin option `webhook_event_retention_days` on the plugin's
 * own `postal_webhook_events` table. Does nothing unless that option is set.
 */
export default async function purgePostalWebhookEvents(
  container: MedusaContainer
) {
  await runRetentionJob({
    container,
    option: "webhook_event_retention_days",
    label: "Postal webhook events",
    run: (input) => purgePostalWebhookEventsWorkflow(container).run({ input }),
  })
}

export const config = {
  name: "postal-purge-webhook-events",
  schedule: "40 3 * * *",
}

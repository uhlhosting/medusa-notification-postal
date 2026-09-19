import type { MedusaContainer } from "@medusajs/framework/types"
import { purgeExpiredNotificationsWorkflow } from "../workflows/purge-expired-notifications"
import { runRetentionJob } from "../lib/retention-job"

/**
 * Enforces the plugin option `notification_retention_days` on every row in
 * Medusa's core `notification` table, whichever provider sent it. Does
 * nothing unless that option is set.
 */
export default async function purgeExpiredNotifications(
  container: MedusaContainer
) {
  await runRetentionJob({
    container,
    option: "notification_retention_days",
    label: "notification records",
    run: (input) => purgeExpiredNotificationsWorkflow(container).run({ input }),
  })
}

export const config = {
  name: "postal-purge-expired-notifications",
  schedule: "30 3 * * *",
}

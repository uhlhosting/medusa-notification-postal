import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  deleteCreatedBefore,
  resolveRetentionCutoff,
  type RetentionStepInput,
  type RetentionStepResult,
} from "./retention"

/**
 * The generated list and delete methods of Medusa's notification module.
 * `INotificationModuleService` does not declare the delete, but the service
 * is a `MedusaService` over the `Notification` model, which provides it.
 */
type NotificationRecords = {
  listNotifications(
    filters: Record<string, unknown>,
    config: { select: string[]; take: number }
  ): Promise<Array<{ id: string }>>
  deleteNotifications(ids: string[]): Promise<void>
}

type StepContainer = {
  resolve: (key: string, options?: { allowUnregistered?: boolean }) => unknown
}

/**
 * Hard-deletes every row in Medusa's core `notification` table created before
 * the cutoff, whatever its provider, channel, template, resource or status.
 *
 * This is provider-neutral on purpose: the table is shared by every
 * notification provider, and each row is delivery metadata (recipient,
 * template, provider message id, and sometimes a Reply-To address) with no
 * retention of its own. Filtering on `created_at` alone is what makes a
 * retention period hold for all of it.
 *
 * Does nothing where no notification module is registered. No compensation:
 * a retention delete is not rolled back.
 */
export const postalDeleteExpiredNotificationsStepHandler = async (
  input: RetentionStepInput,
  { container }: { container: StepContainer }
): Promise<StepResponse<RetentionStepResult>> => {
  const cutoff = resolveRetentionCutoff(input)
  const notifications = container.resolve(Modules.NOTIFICATION, {
    allowUnregistered: true,
  }) as NotificationRecords | undefined

  if (!notifications) {
    return new StepResponse({ deleted: 0, cutoff: cutoff.toISOString() })
  }

  const deleted = await deleteCreatedBefore(
    cutoff,
    (filters, config) => notifications.listNotifications(filters, config),
    (ids) => notifications.deleteNotifications(ids)
  )

  return new StepResponse({ deleted, cutoff: cutoff.toISOString() })
}

export const postalDeleteExpiredNotificationsStep = createStep(
  "postal-delete-expired-notifications",
  postalDeleteExpiredNotificationsStepHandler
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  deleteCreatedBefore,
  resolveRetentionCutoff,
  type RetentionStepInput,
  type RetentionStepResult,
} from "./retention"

type PostalWebhookEventRecords = {
  listPostalWebhookEvents(
    filters: Record<string, unknown>,
    config: { select: string[]; take: number }
  ): Promise<Array<{ id: string }>>
  deletePostalWebhookEvents(ids: string[]): Promise<void>
}

/**
 * Hard-deletes `postal_webhook_events` rows created before the cutoff. Each
 * row holds a recipient address and the raw Postal callback payload.
 *
 * Does nothing where the plugin module is not registered. No compensation: a
 * retention delete is not rolled back.
 */
export const postalDeleteExpiredWebhookEventsStepHandler = async (
  input: RetentionStepInput,
  { container }: { container: { resolve: (key: string) => unknown } }
): Promise<StepResponse<RetentionStepResult>> => {
  const cutoff = resolveRetentionCutoff(input)
  const service = resolvePostalModule<PostalWebhookEventRecords>(container)

  if (
    typeof service?.listPostalWebhookEvents !== "function" ||
    typeof service.deletePostalWebhookEvents !== "function"
  ) {
    return new StepResponse({ deleted: 0, cutoff: cutoff.toISOString() })
  }

  const deleted = await deleteCreatedBefore(
    cutoff,
    (filters, config) => service.listPostalWebhookEvents(filters, config),
    (ids) => service.deletePostalWebhookEvents(ids)
  )

  return new StepResponse({ deleted, cutoff: cutoff.toISOString() })
}

export const postalDeleteExpiredWebhookEventsStep = createStep(
  "postal-delete-expired-webhook-events",
  postalDeleteExpiredWebhookEventsStepHandler
)

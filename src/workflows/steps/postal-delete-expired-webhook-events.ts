import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  deleteCreatedBefore,
  resolveRetentionCutoff,
  type RetentionStepInput,
  type RetentionStepResult
} from "./retention"

type PostalWebhookEventRecords = {
  listPostalWebhookEvents(
    filters: Record<string, unknown>,
    config: { select: string[]; take: number }
  ): Promise<Array<{ id: string }>>
  deletePostalWebhookEvents(ids: string[]): Promise<void>
}

/**
 * Hard-deletes published, unleased callback metadata created before the cutoff.
 * Unpublished receipts remain durable work, regardless of age. Preserve any
 * lease metadata conservatively; publication claims only accept unpublished
 * rows, so an eligible published row cannot acquire a new publisher lease.
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
    (filters, config) =>
      service.listPostalWebhookEvents(
        {
          ...filters,
          published_at: { $ne: null },
          publication_owner: null,
          publication_expires_at: null
        },
        config
      ),
    (ids) => service.deletePostalWebhookEvents(ids)
  )

  return new StepResponse({ deleted, cutoff: cutoff.toISOString() })
}

export const postalDeleteExpiredWebhookEventsStep = createStep(
  "postal-delete-expired-webhook-events",
  postalDeleteExpiredWebhookEventsStepHandler
)

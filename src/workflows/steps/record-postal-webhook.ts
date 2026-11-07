import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  readPostalPluginOptions,
  type PostalPluginOptionsReader,
} from "../../modules/postal/options"
import {
  recordPostalWebhookEventOutcome,
  type PostalWebhookEventService,
} from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = Record<string, unknown>

type StepContainer = { container: { resolve: (key: string) => unknown } }

// Records the webhook only. The `postal.<status>` event is emitted by the
// workflow, and only when this step inserted a new row.
export const recordPostalWebhookEventStepHandler = async (
  payload: RecordPostalWebhookStepInput,
  { container }: StepContainer
) => {
  const service = resolvePostalModule<
    PostalWebhookEventService & PostalPluginOptionsReader
  >(container)
  const { ignore_engagement_webhooks } = await readPostalPluginOptions(service)
  const outcome = await recordPostalWebhookEventOutcome(service, payload, {
    ignoreEngagement: ignore_engagement_webhooks,
  })

  // Only a row this run inserted is handed to the compensation; a replay's
  // row belongs to an earlier, successful delivery.
  return new StepResponse(
    outcome,
    outcome?.created ? outcome.record.id : undefined
  )
}

export const recordPostalWebhookEventCompensation = async (
  insertedId: string | undefined,
  { container }: StepContainer
) => {
  if (!insertedId) {
    return
  }

  // The emit failed after this run inserted the row. Remove it so Postal's
  // retry of the same uuid records and emits it. Hard delete: a soft-deleted
  // row keeps the primary key but is hidden from the replay lookup, so every
  // retry would then fail on the key.
  const service = resolvePostalModule<PostalWebhookEventService>(container)
  await service?.deletePostalWebhookEvents?.(insertedId)
}

export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  recordPostalWebhookEventStepHandler,
  recordPostalWebhookEventCompensation
)

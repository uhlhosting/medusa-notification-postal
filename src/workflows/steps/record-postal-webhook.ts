import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  recordPostalWebhookEventOutcome,
  type PostalWebhookEventService,
} from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = Record<string, unknown>

// Records the webhook only. The `postal.<status>` event is emitted by the
// workflow, and only when this step inserted a new row.
export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  async (payload: RecordPostalWebhookStepInput, { container }) => {
    const service = resolvePostalModule<PostalWebhookEventService>(container)
    const outcome = await recordPostalWebhookEventOutcome(service, payload)

    // Only a row this run inserted is handed to the compensation; a replay's
    // row belongs to an earlier, successful delivery.
    return new StepResponse(
      outcome,
      outcome?.created ? outcome.record.id : undefined
    )
  },
  async (insertedId, { container }) => {
    if (!insertedId) {
      return
    }

    // If emitting fails, remove the row so Postal's retry of the same uuid
    // records it again and emits. Hard delete: a soft-deleted row still holds
    // the primary key but is hidden from the replay lookup, so every retry
    // would fail on the key.
    const service = resolvePostalModule<PostalWebhookEventService>(container)
    await service?.deletePostalWebhookEvents?.(insertedId)
  })

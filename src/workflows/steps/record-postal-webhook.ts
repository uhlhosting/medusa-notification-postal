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

    return new StepResponse(outcome)
  })

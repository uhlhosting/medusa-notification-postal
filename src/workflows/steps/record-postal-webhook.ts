import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { recordPostalWebhookEvent } from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = Record<string, unknown>

export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  async (payload: RecordPostalWebhookStepInput, { container }) => {
    const pgConnection = container.resolve("pgConnection")
    const event = await recordPostalWebhookEvent(pgConnection, payload)

    return new StepResponse(event)
  }
)

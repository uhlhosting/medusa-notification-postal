import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { POSTAL_PLUGIN_MODULE } from "../../modules/postal/constants"
import {
  recordPostalWebhookEvent,
  type PostalWebhookEventService,
} from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = Record<string, unknown>

const resolvePostalWebhookEventService = (container: {
  resolve: (key: string) => unknown
}): PostalWebhookEventService | null => {
  try {
    return container.resolve(POSTAL_PLUGIN_MODULE) as PostalWebhookEventService
  } catch {
    return null
  }
}

export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  async (payload: RecordPostalWebhookStepInput, { container }) => {
    const service = resolvePostalWebhookEventService(container)
    const event = await recordPostalWebhookEvent(service, payload)

    if (event) {
      // Emit a delivery event so subscribers can react (e.g. postal.bounced).
      // The event bus is optional — recording has already succeeded.
      try {
        const eventBus = container.resolve(Modules.EVENT_BUS) as {
          emit: (message: { name: string; data: unknown }) => Promise<void>
        }
        await eventBus.emit({
          name: `postal.${event.status}`,
          data: {
            id: event.id,
            event_type: event.event_type,
            status: event.status,
            message_id: event.message_id,
            recipient: event.recipient,
            occurred_at: event.occurred_at,
          },
        })
      } catch {
        // Ignore: event emission is best-effort.
      }
    }

    return new StepResponse(event)
  })

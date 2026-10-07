import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  readPostalPluginOptions,
  type PostalPluginOptionsReader,
} from "../../modules/postal/options"
import {
  recordPostalWebhookEvent,
  type PostalWebhookEventService,
} from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = Record<string, unknown>

export const recordPostalWebhookEventStepHandler = async (
  payload: RecordPostalWebhookStepInput,
  { container }: { container: { resolve: (key: string) => unknown } }
) => {
  const service = resolvePostalModule<
    PostalWebhookEventService & PostalPluginOptionsReader
  >(container)
  const { ignore_engagement_webhooks } = await readPostalPluginOptions(service)
  const event = await recordPostalWebhookEvent(service, payload, {
    ignoreEngagement: ignore_engagement_webhooks,
  })

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
          occurred_at: event.occurred_at,
        },
      })
    } catch {
      // Ignore: event emission is best-effort.
    }
  }

  return new StepResponse(event)
}

export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  recordPostalWebhookEventStepHandler
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  readPostalPluginOptions,
  type PostalPluginOptionsReader,
} from "../../modules/postal/options"
import {
  recordPreparedPostalWebhookEvent,
  type PreparedPostalWebhook,
  type PostalWebhookEventService,
} from "../../modules/postal/webhooks"

type RecordPostalWebhookStepInput = PreparedPostalWebhook

type PublicationService = PostalWebhookEventService & {
  claimWebhookPublication?: (id: string) => Promise<string | null>
  settleWebhookPublication?: (id: string, owner: string, success: boolean) => Promise<boolean>
}

export const publishPostalWebhookEvent = async (
  service: PublicationService,
  event: NonNullable<Awaited<ReturnType<typeof recordPreparedPostalWebhookEvent>>>,
  container: { resolve: (key: string) => unknown }
) => {
  if (!service.claimWebhookPublication || !service.settleWebhookPublication) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Postal durable webhook publication service is unavailable")
  const owner = await service.claimWebhookPublication(event.id)
  if (!owner) return
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const eventBus = container.resolve(Modules.EVENT_BUS) as { emit: (message: { name: string; data: unknown }) => Promise<void> }
    await Promise.race([
      eventBus.emit({ name: `postal.${event.status}`, data: {
        id: event.id, event_type: event.event_type, status: event.status,
        message_id: event.message_id, occurred_at: event.occurred_at,
      } }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Postal webhook publication timed out")), 15000) }),
    ])
    if (!await service.settleWebhookPublication(event.id, owner, true)) throw new MedusaError(MedusaError.Types.CONFLICT, "Postal webhook publication owner was lost")
  } catch {
    await service.settleWebhookPublication(event.id, owner, false)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Postal webhook publication failed; durable retry pending")
  } finally { clearTimeout(timer) }
}

export const recordPostalWebhookEventStepHandler = async (
  payload: RecordPostalWebhookStepInput,
  { container }: { container: { resolve: (key: string) => unknown } }
) => {
  const service = resolvePostalModule<
    PostalWebhookEventService & PostalPluginOptionsReader
  >(container)
  const { ignore_engagement_webhooks } = await readPostalPluginOptions(service)
  const event = await recordPreparedPostalWebhookEvent(service, payload, {
    ignoreEngagement: ignore_engagement_webhooks,
  })

  if (event && service) await publishPostalWebhookEvent(service, event, container)

  return new StepResponse(event)
}

export const recordPostalWebhookEventStep = createStep(
  "record-postal-webhook-event",
  recordPostalWebhookEventStepHandler
)

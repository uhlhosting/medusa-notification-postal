import {
  createWorkflow,
  ReturnWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { recordPostalWebhookEventStep } from "./steps/record-postal-webhook"
import type { PostalWebhookRecord } from "../modules/postal/webhooks"

export type RecordPostalWebhookWorkflowInput = Record<string, unknown>

export const recordPostalWebhookWorkflow: ReturnWorkflow<
  RecordPostalWebhookWorkflowInput,
  PostalWebhookRecord | null,
  []
> = createWorkflow(
  "record-postal-webhook",
  function (payload: RecordPostalWebhookWorkflowInput) {
    const outcome = recordPostalWebhookEventStep(payload)

    // Emit at most once per Postal delivery: replays find the existing row and
    // report created=false. Grouped events are released when the workflow
    // succeeds.
    when("emit-postal-webhook-event-on-insert", { outcome }, ({ outcome }) =>
      Boolean(outcome?.created)
    ).then(() => {
      const eventInput = transform({ outcome }, ({ outcome }) => {
        const record = outcome!.record
        return {
          eventName: `postal.${record.status}`,
          data: {
            id: record.id,
            event_type: record.event_type,
            status: record.status,
            message_id: record.message_id,
            recipient: record.recipient,
            occurred_at: record.occurred_at,
          },
        }
      })

      emitEventStep(eventInput).config({ name: "emit-postal-webhook-event" })
    })

    const event = transform({ outcome }, ({ outcome }) => outcome?.record ?? null)

    return new WorkflowResponse(event)
  })

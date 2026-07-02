import {
  createWorkflow,
  ReturnWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
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
    const event = recordPostalWebhookEventStep(payload)

    return new WorkflowResponse(event)
  })

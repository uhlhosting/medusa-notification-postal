import {
  createWorkflow,
  ReturnWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { postalDeleteExpiredWebhookEventsStep } from "./steps/postal-delete-expired-webhook-events"
import type {
  RetentionStepInput,
  RetentionStepResult,
} from "./steps/retention"

export type PurgePostalWebhookEventsWorkflowInput = RetentionStepInput

/**
 * Deletes stored Postal webhook events older than `retention_days`. Run by
 * the `postal-purge-webhook-events` job when the plugin option
 * `webhook_event_retention_days` is set.
 */
export const postalPurgeWebhookEventsWorkflow: ReturnWorkflow<
  PurgePostalWebhookEventsWorkflowInput,
  RetentionStepResult,
  []
> = createWorkflow(
  "postal-purge-webhook-events",
  function (input: PurgePostalWebhookEventsWorkflowInput) {
    const result = postalDeleteExpiredWebhookEventsStep(input)

    return new WorkflowResponse(result)
  }
)

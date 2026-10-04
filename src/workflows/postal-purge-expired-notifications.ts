import {
  createWorkflow,
  ReturnWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { postalDeleteExpiredNotificationsStep } from "./steps/postal-delete-expired-notifications"
import type {
  RetentionStepInput,
  RetentionStepResult,
} from "./steps/retention"

export type PurgeExpiredNotificationsWorkflowInput = RetentionStepInput

/**
 * Deletes every Medusa notification row older than `retention_days`. Run by
 * the `postal-purge-expired-notifications` job when the plugin option
 * `notification_retention_days` is set.
 */
export const postalPurgeExpiredNotificationsWorkflow: ReturnWorkflow<
  PurgeExpiredNotificationsWorkflowInput,
  RetentionStepResult,
  []
> = createWorkflow(
  "postal-purge-expired-notifications",
  function (input: PurgeExpiredNotificationsWorkflowInput) {
    const result = postalDeleteExpiredNotificationsStep(input)

    return new WorkflowResponse(result)
  }
)

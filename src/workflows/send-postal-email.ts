import { createWorkflow, WorkflowResponse, ReturnWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  sendPostalEmailStep,
  type SendPostalEmailStepInput,
} from "./steps/send-postal-email"

// The workflow input is the step input — invariant 2 governs this
// `provider_data` shape, so it is defined once next to the step that consumes it.
export type SendPostalEmailWorkflowInput = SendPostalEmailStepInput

export type SendPostalEmailWorkflowResult = {
  success: boolean
  delivery: {
    id: string | null
    to: string[]
    subject: string
    delivered_at: string
    deliveries: Array<{ id: string | null }>
  }
  deliveries: Array<{ id: string | null }>
}

export const sendPostalEmailWorkflow: ReturnWorkflow<
  SendPostalEmailWorkflowInput,
  SendPostalEmailWorkflowResult,
  []
> = createWorkflow(
  "send-postal-email",
  function (input: SendPostalEmailWorkflowInput) {
    const delivery = sendPostalEmailStep(input)

    return new WorkflowResponse({
      success: true,
      delivery,
      deliveries: delivery.deliveries,
    })
  }
)

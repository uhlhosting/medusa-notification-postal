import { createWorkflow, WorkflowResponse, ReturnWorkflow } from "@medusajs/framework/workflows-sdk"
import { sendPostalEmailStep } from "./steps/send-postal-email"

export type SendPostalEmailWorkflowInput = {
  to: string | string[]
  from?: string
  template?: string
  provider_data: {
    subject: string
    html?: string
    text?: string
    cc?: string | string[]
    bcc?: string | string[]
    headers?: Record<string, string>
    workflow_event?: string
    workflow_run_id?: string
  }
}

export const sendPostalEmailWorkflow: ReturnWorkflow<
  SendPostalEmailWorkflowInput,
  { success: boolean; delivery: any },
  []
> = createWorkflow(
  "send-postal-email",
  function (input: SendPostalEmailWorkflowInput) {
    const delivery = sendPostalEmailStep(input)

    return new WorkflowResponse({
      success: true,
      delivery,
    })
  }
)

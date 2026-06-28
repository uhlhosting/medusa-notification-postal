import { createWorkflow, WorkflowResponse, ReturnWorkflow } from "@medusajs/framework/workflows-sdk"
import { sendPostalEmailStep } from "./steps/send-postal-email"
import type { PostalTemplateName } from "../providers/postal/templates"

export type SendPostalEmailWorkflowInput = {
  to: string | string[]
  from?: string
  from_name?: string
  reply_to?: string
  template?: PostalTemplateName | string
  provider_data: {
    from?: string
    from_name?: string
    reply_to?: string
    subject: string
    html?: string
    text?: string
    cc?: string | string[]
    bcc?: string | string[]
    headers?: Record<string, string>
    custom_args?: Record<string, unknown>
    metadata?: Record<string, unknown>
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

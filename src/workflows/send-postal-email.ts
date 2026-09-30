import { createWorkflow, WorkflowResponse, ReturnWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep } from "@medusajs/medusa/core-flows"
import {
  normalizeRecipients,
  buildPostalNotificationsStep,
  type SendPostalEmailStepInput,
} from "./steps/send-postal-email"

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
    const notifications = buildPostalNotificationsStep(input)

    const sent = sendNotificationsStep(notifications)

    const delivery = transform({ input, sent, notifications }, (data) => {
      const recipients = normalizeRecipients(data.input.to)
      return {
        id: data.sent?.[0]?.id || null,
        to: recipients,
        subject: data.input.provider_data?.subject || "",
        delivered_at: new Date().toISOString(),
        deliveries: data.sent.map((notification) => ({
          id: notification.id || null,
        }))
      }
    })

    return new WorkflowResponse({
      success: true,
      delivery,
      deliveries: delivery.deliveries,
    })
  }
)

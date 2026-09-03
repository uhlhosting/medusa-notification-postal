import { createWorkflow, WorkflowResponse, ReturnWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep } from "@medusajs/core-flows"
import {
  normalizeRecipients,
  buildPostalNotificationsStep,
  type SendPostalEmailStepInput,
} from "./steps/send-postal-email"
import { getPostalSettingsStep } from "./steps/get-postal-settings"

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
    const settings = getPostalSettingsStep()

    const emailInput = transform({ input, settings }, (data) => {
      const emailInput: SendPostalEmailStepInput = {
        ...data.input,
        from: data.input.from || data.settings.from || undefined,
        provider_data: {
          ...data.input.provider_data,
          from: data.input.provider_data?.from || data.input.from || data.settings.from || undefined,
        },
      }
      return emailInput
    })

    const notifications = buildPostalNotificationsStep(emailInput)

    const sent = sendNotificationsStep(notifications)

    const delivery = transform({ input, sent, notifications }, (data) => {
      const recipients = normalizeRecipients(data.input.to)
      return {
        id: data.sent?.[0]?.id || null,
        to: recipients,
        subject: data.input.provider_data?.subject || "",
        delivered_at: new Date().toISOString(),
        deliveries: data.sent.map((s: any) => ({ id: s.id || null }))
      }
    })

    return new WorkflowResponse({
      success: true,
      delivery,
      deliveries: delivery.deliveries,
    })
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type SendPostalEmailStepInput = {
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

type PostalNotificationProvider = {
  send: (input: SendPostalEmailStepInput) => Promise<{ id?: string | null }>
}

export const sendPostalEmailStep = createStep(
  "send-postal-email",
  async (input: SendPostalEmailStepInput, { container }) => {
    const postalService = container.resolve(
      "notification-postal"
    ) as PostalNotificationProvider
    const result = await postalService.send(input)

    return new StepResponse({
      id: result?.id || null,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.provider_data?.subject || "",
      delivered_at: new Date().toISOString(),
    })
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

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

export const sendPostalEmailStep = createStep(
  "send-postal-email",
  async (input: SendPostalEmailStepInput, { container }) => {
    const notificationModuleService = container.resolve<INotificationModuleService>(
      Modules.NOTIFICATION
    )

    const to = Array.isArray(input.to) ? input.to.join(",") : input.to

    const result = await notificationModuleService.createNotifications({
      to,
      channel: "email",
      template: input.template || "default",
      data: input.provider_data as any,
    })

    return new StepResponse({
      id: Array.isArray(result) ? result[0]?.id : result?.id || null,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.provider_data?.subject || "",
      delivered_at: new Date().toISOString(),
    })
  }
)

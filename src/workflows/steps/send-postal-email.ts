import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import type { PostalTemplateName } from "../../providers/postal/templates"

type SendPostalEmailStepInput = {
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
      content: {
        subject: input.provider_data.subject,
        html: input.provider_data.html,
        text: input.provider_data.text,
      },
      provider_data: {
        from: input.provider_data.from || input.from,
        from_name: input.provider_data.from_name || input.from_name,
        reply_to: input.provider_data.reply_to || input.reply_to,
        cc: input.provider_data.cc,
        bcc: input.provider_data.bcc,
        headers: input.provider_data.headers,
        custom_args: input.provider_data.custom_args,
        metadata: input.provider_data.metadata,
        workflow_event: input.provider_data.workflow_event,
        workflow_run_id: input.provider_data.workflow_run_id,
      },
    })

    return new StepResponse({
      id: Array.isArray(result) ? result[0]?.id : result?.id || null,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.provider_data?.subject || "",
      delivered_at: new Date().toISOString(),
    })
  }
)

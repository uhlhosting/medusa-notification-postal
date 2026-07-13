import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/framework/types"
import type { PostalTemplateName } from "../../providers/postal/templates"

const POSTAL_PROVIDER_ID = "postal"

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

    if (!notificationModuleService) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Notification module is not loaded. Ensure Medusa notification is configured and the backend has been restarted."
      )
    }

    const recipients = normalizeRecipients(input.to)
    if (!recipients.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification requires at least one recipient"
      )
    }

    const template = input.template || "default"
    const providerData = buildProviderData(input)

    const deliveries = await Promise.all(
      recipients.map(async (to) => {
        const result = await notificationModuleService.createNotifications(
          buildPostalNotificationInput(input, to, template, providerData)
        )

        return { id: (result as any)?.id || null }
      })
    )

    return new StepResponse({
      id: deliveries[0]?.id || null,
      to: recipients,
      subject: input.provider_data?.subject || "",
      delivered_at: new Date().toISOString(),
      deliveries,
    })
  }
)

const normalizeRecipients = (value: string | string[]) => {
  const list = Array.isArray(value) ? value : [value]
  return list.map((entry) => entry.trim()).filter(Boolean)
}

const buildProviderData = (input: SendPostalEmailStepInput) => ({
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
})

export const buildPostalNotificationInput = (
  input: SendPostalEmailStepInput,
  to: string,
  template: string,
  providerData: ReturnType<typeof buildProviderData>
) => {
  // Guard against duplicate sends on workflow retry: when a workflow run id is
  // present, the same run + recipient dedupes at the notification module.
  const workflowRunId = input.provider_data.workflow_run_id
  const idempotencyKey = workflowRunId
    ? `postal:${workflowRunId}:${template}:${to}`
    : undefined

  return {
    to,
    from: input.from,
    channel: "email",
    provider_id: POSTAL_PROVIDER_ID,
    template,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    content: {
      subject: input.provider_data.subject,
      html: input.provider_data.html,
      text: input.provider_data.text,
    },
    data: providerData,
    provider_data: providerData,
  } as any
}

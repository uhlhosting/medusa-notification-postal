import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import type { PostalNotificationService } from "../../providers/postal/services/postal"
import type { PostalTemplateName } from "../../providers/postal/templates"

/** Container key under which Medusa registers notification providers. */
const POSTAL_PROVIDER_KEY = "np_notification-postal"

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
    // Resolve the Postal provider directly so email is always delivered through
    // Postal, regardless of other notification providers that may be registered
    // for the "email" channel in the notification module.
    const postalService = container.resolve<PostalNotificationService>(
      POSTAL_PROVIDER_KEY
    )

    if (!postalService) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Postal notification provider is not loaded. Ensure the plugin is configured and the backend has been restarted."
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
        const result = await postalService.send({
          to,
          from: input.from,
          channel: "email",
          template,
          content: {
            subject: input.provider_data.subject,
            html: input.provider_data.html,
            text: input.provider_data.text,
          },
          provider_data: providerData,
        })

        return { id: result?.id || null }
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

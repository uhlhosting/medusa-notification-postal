import {
  createWorkflow,
  WorkflowResponse,
  transform,
  when,
  type ReturnWorkflow
} from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep } from "@medusajs/core-flows"
import type { PostalSettingsInput, PostalSettingsSnapshot } from "../modules/postal/settings"
import { savePostalSettingsStep } from "./steps/save-postal-settings"
import { getPostalSettingsStep } from "./steps/get-postal-settings"
import {
  buildPostalNotificationsStep,
  normalizeRecipients,
  validateModeRequirementsStep,
  validateTestRecipientStep,
} from "./steps/send-postal-email"
import { buildPostalAdminTestProviderData } from "../api/admin/plugin-settings/postal/test-payload"

export type SendPostalTestWorkflowInput = {
  to?: string | string[]
  settings?: PostalSettingsInput
  run_id: string
  // Test payload fields
  from?: string
  from_name?: string
  reply_to?: string
  template?: string
  subject?: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  custom_args?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type SendPostalTestWorkflowResult = {
  delivery: {
    id: string | null
    to: string[]
    subject: string
    delivered_at: string
    deliveries: Array<{ id: string | null }>
  }
  to: string | string[]
  settings: PostalSettingsSnapshot
}

export const sendPostalTestWorkflow: ReturnWorkflow<
  SendPostalTestWorkflowInput,
  SendPostalTestWorkflowResult,
  []
> = createWorkflow(
  "send-postal-test",
  function (input: SendPostalTestWorkflowInput) {
    const baseSettings = getPostalSettingsStep()

    const savedSettings = when(input, (input) => {
      return !!input.settings
    }).then(() => {
      const payload = transform({ input }, (data) => data.input.settings || {})
      return savePostalSettingsStep(payload)
    })

    const effectiveSettings = transform({ baseSettings, savedSettings }, (data) => {
      return data.savedSettings || data.baseSettings
    })

    const validatedSettings = validateModeRequirementsStep(effectiveSettings)

    const to = validateTestRecipientStep({ 
      to: input.to, 
      test_to: validatedSettings.test_to, 
      from: validatedSettings.from 
    })

    const emailInput = transform({ input, validatedSettings, to }, (data) => {
      const providerDataRaw = buildPostalAdminTestProviderData(
        {
          from: data.validatedSettings.from || undefined,
          test_to: data.validatedSettings.test_to || undefined,
          auth_type: data.validatedSettings.auth_type,
        },
        data.input,
        data.input.run_id
      )

      return {
        to: data.to,
        from: data.validatedSettings.from || undefined,
        template: providerDataRaw.template,
        provider_data: {
          ...providerDataRaw,
          from: data.validatedSettings.from || undefined,
        },
      }
    })

    const notifications = buildPostalNotificationsStep(emailInput)

    const sent = sendNotificationsStep(notifications)

    const delivery = transform({ input, sent, notifications, to }, (data) => {
      const recipients = normalizeRecipients(data.to)
      return {
        id: data.sent?.[0]?.id || null,
        to: recipients,
        subject: (data.notifications[0]?.provider_data as Record<string, unknown>)?.subject as string || "",
        delivered_at: new Date().toISOString(),
        deliveries: data.sent.map((s: any) => ({ id: s.id || null }))
      }
    })

    return new WorkflowResponse({
      delivery,
      to,
      settings: validatedSettings
    })
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import type { CreateNotificationDTO } from "@medusajs/framework/types"
import type { PostalTemplateName } from "../../providers/postal/templates"
import { validateModeRequirements, type PostalSettingsSnapshot } from "../../modules/postal/settings"

export type SendPostalEmailStepInput = {
  to: string | string[]
  from?: string
  from_name?: string
  reply_to?: string
  template?: PostalTemplateName | (string & {})
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

// sendPostalEmailStep was replaced with sendNotificationsStep from core-flows.

export const normalizeRecipients = (value: string | string[]) => {
  const list = Array.isArray(value) ? value : [value]
  const result: string[] = []
  for (const entry of list) {
    const trimmed = entry.trim()
    if (trimmed) {
      result.push(trimmed)
    }
  }
  return result
}

export const buildProviderData = (input: SendPostalEmailStepInput) => ({
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
    template,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    content: {
      subject: input.provider_data.subject,
      html: input.provider_data.html,
      text: input.provider_data.text,
    },
    data: providerData,
    provider_data: providerData,
  } satisfies CreateNotificationDTO
}

export const validateTestRecipientStep = createStep("validate-test-recipient", async (input: { to?: string | string[] | null, test_to?: string | null, from?: string | null }) => {
  let recipient = input.to
  if (typeof recipient === "string") recipient = recipient.trim() || null
  recipient = recipient || input.test_to || input.from

  if (!recipient) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing recipient. Provide `to` or set POSTAL_TEST_TO/POSTAL_FROM."
    )
  }
  return new StepResponse(recipient)
})

export const validateModeRequirementsStep = createStep("validate-mode-requirements", async (settings: PostalSettingsSnapshot) => {
  const error = validateModeRequirements(settings)
  if (error) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error)
  }
  return new StepResponse(settings)
})

export const buildPostalNotificationsStep = createStep("build-postal-notifications", async (emailInput: SendPostalEmailStepInput) => {
  const recipients = normalizeRecipients(emailInput.to)
  if (!recipients.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal notification requires at least one recipient"
    )
  }

  const template = emailInput.template || "default"
  const providerData = buildProviderData(emailInput)

  const notifications = recipients.map((to) =>
    buildPostalNotificationInput(emailInput, to, template as string, providerData)
  )

  return new StepResponse(notifications)
})

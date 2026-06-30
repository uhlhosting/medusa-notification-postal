import {
  getPostalTemplateExample,
  type PostalTemplateName,
} from "../../../../providers/postal/templates"

export type PostalAdminTestBody = {
  to?: string | string[]
  from?: string
  from_name?: string
  reply_to?: string
  template?: PostalTemplateName | string
  subject?: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  custom_args?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

type PostalAdminTestSettings = {
  from?: string | null
  test_to?: string | null
  auth_type?: string | null
}

export type PostalAdminTestProviderData = {
  template: PostalTemplateName | string
  subject: string
  text?: string
  html?: string
  from?: string
  from_name?: string
  reply_to?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers: Record<string, string>
  custom_args?: Record<string, unknown>
  metadata?: Record<string, unknown>
  workflow_event: string
  workflow_run_id: string
}

const normalizeEmailList = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    return value.trim() || undefined
  }

  return undefined
}

const normalizeString = (value?: string) => value?.trim() || undefined

const mergeHeaders = (
  base: Record<string, string>,
  override?: Record<string, string>
) => ({
  ...base,
  ...(override || {}),
})

const mergeRecord = <T extends Record<string, unknown>>(
  base: T,
  override?: Record<string, unknown>
) => ({
  ...base,
  ...(override || {}),
}) as T

export const buildPostalAdminTestProviderData = (
  settings: PostalAdminTestSettings,
  body: PostalAdminTestBody,
  runId: string
): PostalAdminTestProviderData => {
  const templateName =
    normalizeString(body.template) || "postal-admin-test"
  const example = getPostalTemplateExample(
    templateName as PostalTemplateName
  )

  return {
    template: templateName,
    subject: normalizeString(body.subject) || example.subject,
    text: normalizeString(body.text) || example.text,
    html: normalizeString(body.html) || example.html,
    from: normalizeString(body.from) || settings.from || example.from,
    from_name: normalizeString(body.from_name) || example.from_name,
    reply_to: normalizeString(body.reply_to) || example.reply_to,
    cc: normalizeEmailList(body.cc),
    bcc: normalizeEmailList(body.bcc),
    headers: mergeHeaders(example.headers, body.headers),
    custom_args: mergeRecord(example.custom_args, body.custom_args),
    metadata: mergeRecord(example.metadata, body.metadata),
    workflow_event: "postal.admin.test_send",
    workflow_run_id: runId,
  }
}

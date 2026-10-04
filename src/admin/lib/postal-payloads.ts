// Request bodies the Postal admin page sends. The server schemas are strict and
// reject secret fields (invariant 3), so these builders send only the
// non-secret settings and never the page-only fields such as `api_key`.

export type PostalSettingsPayload = {
  auth_type: "smtp-api"
  from: string
  base_url: string
  test_to: string
}

export const toPostalSettingsPayload = (form: PostalSettingsPayload) => ({
  auth_type: form.auth_type,
  from: form.from,
  base_url: form.base_url,
  test_to: form.test_to,
})

export type PostalTestSendPayload = {
  to?: string
  cc?: string[]
  bcc?: string[]
  from_name?: string
  reply_to?: string
  template?: string
  subject?: string
  text?: string
  html?: string
  headers?: Record<string, string>
  custom_args?: Record<string, unknown>
  metadata?: Record<string, unknown>
  settings: ReturnType<typeof toPostalSettingsPayload>
}

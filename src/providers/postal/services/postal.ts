import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  Attachment,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  normalizePostalCustomArgs,
  resolvePostalTemplate,
  resolvePostalSender,
} from "../templates"
// The webhook side matches this exact prefix to attribute callbacks back to the
// plugin, so writer and reader must share one definition.
import { POSTAL_WEBHOOK_TAG_PREFIX } from "../../../modules/postal/webhooks"

type PostalAuthType = "smtp-api"

interface PostalOptions {
  auth_type?: PostalAuthType
  base_url?: string
  api_key?: string
  from: string
}

type PostalApiResult = {
  status?: string
  data?: unknown
}

type PostalApiData = Record<string, unknown>

type PostalRecipientMessage = {
  id?: unknown
  token?: unknown
}

type PostalSendPayload = {
  to: string[]
  cc?: string[]
  bcc?: string[]
  from: string
  reply_to?: string
  subject: string
  html_body?: string
  plain_body?: string
  tag?: string
  headers?: Record<string, string>
  attachments?: Array<{
    name: string
    content_type: string
    data: string
  }>
}

type PostalNotificationProviderData = {
  from?: string
  from_name?: string
  reply_to?: string
  subject?: string
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

const POSTAL_DEFAULT_TIMEOUT_MS = 10000
const POSTAL_MIN_TIMEOUT_MS = 1000
const POSTAL_MAX_TIMEOUT_MS = 60000

const resolveRequestTimeoutMs = (): number => {
  const raw = Number.parseInt(String(process.env.POSTAL_REQUEST_TIMEOUT_MS || ""), 10)
  if (!Number.isFinite(raw)) {
    return POSTAL_DEFAULT_TIMEOUT_MS
  }
  return Math.min(Math.max(raw, POSTAL_MIN_TIMEOUT_MS), POSTAL_MAX_TIMEOUT_MS)
}

const TRUTHY = new Set(["1", "true", "yes", "on"])

export const SANDBOX_HEADER = "X-Postal-Sandbox"
export const SANDBOX_ORIGINAL_TO_HEADER = "X-Postal-Sandbox-To"
export const SANDBOX_ORIGINAL_CC_HEADER = "X-Postal-Sandbox-Cc"
export const SANDBOX_ORIGINAL_BCC_HEADER = "X-Postal-Sandbox-Bcc"

export type PostalSandboxConfig = {
  enabled: boolean
  recipient: string
}

/**
 * Whether this process may mail real people, and where its mail goes instead.
 *
 * A staging or preview deployment sends the same mail a production one does -
 * order confirmations, quotes, contact enquiries - to the same real customers,
 * because nothing in the provider ever looked at which environment it is.
 * Sandbox mode closes that: every recipient is replaced by one address, and who
 * the message was addressed to survives in headers and in the subject.
 *
 * POSTAL_SANDBOX is deliberately explicit, with no environment sniffing behind
 * it. NODE_ENV cannot stand in: the platform's backend image sets
 * NODE_ENV=production in its runtime stage, so staging, preview and production
 * are all "production" to this process and the value carries no signal at all.
 *
 * Nor does it default to on when POSTAL_TEST_TO happens to be set. Production
 * sets that too - it is the recipient of the admin's "send test email" button -
 * so such a default would turn one forgotten variable in production into every
 * customer's order confirmation being delivered to an internal test inbox
 * instead. Silently swallowing real mail is a worse failure than the one this
 * fixes, so the switch fails closed and non-production environments opt in.
 *
 * The recipient is POSTAL_TEST_TO, the address the admin's Postal settings
 * already call the test recipient. The module's boot loader copies the saved
 * setting into the environment, so this follows the admin UI without a provider
 * having to read the database.
 */
export const resolvePostalSandbox = (): PostalSandboxConfig => {
  const flag = String(process.env.POSTAL_SANDBOX || "").trim().toLowerCase()

  return {
    enabled: TRUTHY.has(flag),
    recipient: String(process.env.POSTAL_TEST_TO || "").trim(),
  }
}

export class PostalNotificationService extends AbstractNotificationProviderService {
  static readonly identifier = "notification-postal"

  protected config_: {
    authType: PostalAuthType
    baseUrl: string
    apiKey: string
    from: string
  }
  protected logger_: Pick<Logger, "info">

  constructor(container: { logger: Pick<Logger, "info"> }, options: PostalOptions) {
    super()
    const { logger } = container

    const authType = (options.auth_type || "smtp-api").trim() as PostalAuthType
    const baseUrl = (options.base_url || "").trim().replace(/\/$/, "")
    const apiKey = (options.api_key || "").trim()
    const from = (options.from || "").trim()

    if (authType !== "smtp-api") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider only supports API auth mode."
      )
    }

    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider requires 'from'"
      )
    }

    if (!baseUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal API mode requires 'base_url'"
      )
    }

    let parsedBaseUrl: URL
    try {
      parsedBaseUrl = new URL(baseUrl)
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal 'base_url' must be a valid absolute URL"
      )
    }
    if (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal 'base_url' must use the http or https protocol"
      )
    }

    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal API mode requires 'api_key'"
      )
    }

    this.config_ = {
      authType,
      baseUrl,
      apiKey,
      from,
    }
    this.logger_ = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    const from = String(options?.from || "").trim()

    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }

    if (!String(options?.base_url || "").trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `base_url` is required."
      )
    }

    if (!String(options?.api_key || "").trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification information provided"
      )
    }

    const providerData = this.resolveProviderData(notification)
    const content = notification.content || {}
    const to = this.normalizeEmails(notification.to)
    const cc = this.normalizeEmails(providerData.cc)
    const bcc = this.normalizeEmails(providerData.bcc)

    if (!to.length && !cc.length && !bcc.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification requires at least one recipient"
      )
    }

    const sender = resolvePostalSender(
      {
        from: providerData.from || notification.from || undefined,
        from_name: providerData.from_name,
        reply_to: providerData.reply_to,
      },
      this.config_.from
    )

    if (!sender.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification requires a from address"
      )
    }

    const template = resolvePostalTemplate(notification.template, {
      subject: content?.subject || providerData.subject,
      html: content?.html || providerData.html,
      text: content?.text || providerData.text,
    })

    const sandbox = this.applySandbox({ to, cc, bcc })

    const payload = this.buildSendPayload({
      to: sandbox.to,
      cc: sandbox.cc,
      bcc: sandbox.bcc,
      sender,
      template: sandbox.subjectPrefix
        ? { ...template, subject: `${sandbox.subjectPrefix} ${template.subject}` }
        : template,
      attachments: notification.attachments,
      providerData,
      sandboxHeaders: sandbox.headers,
    })

    this.logger_.info(
      `Postal notification send started template=${
        template.template_name || "default"
      } recipients=${payload.to.length} event=${
        providerData.workflow_event || "none"
      } run_id=${providerData.workflow_run_id || "none"}`
    )

    return await this.sendViaApi(payload)
  }

  async getMessageDetails(id: string | number) {
    return await this.fetchPostalApi("messages/message", {
      id: this.normalizePostalLookupId(id),
      _expansions: true,
    })
  }

  async getMessageDeliveries(id: string | number) {
    return await this.fetchPostalApi("messages/deliveries", {
      id: this.normalizePostalLookupId(id),
    })
  }

  private async sendViaApi(payload: PostalSendPayload): Promise<{ id: string }> {
    try {
      const body = await this.fetchPostalApi("send/message", payload)
      const rawMessageId = body?.message_id
      const messageId = typeof rawMessageId === "string" || typeof rawMessageId === "number" ? String(rawMessageId) : ""
      const recipientMessage = this.getFirstRecipientMessage(body?.messages)
      const externalId = recipientMessage?.id || messageId

      this.logger_.info(
        `Postal notification send succeeded auth=api message_id=${
          messageId || "unknown"
        } postal_id=${recipientMessage?.id || "unknown"}`
      )

      return {
        id: externalId,
      }
    } catch (error: unknown) {
      if (error instanceof MedusaError) {
        throw error
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Postal API: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      )
    }
  }

  private async fetchPostalApi(
    path: string,
    payload: Record<string, unknown> | PostalSendPayload
  ): Promise<PostalApiData> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), resolveRequestTimeoutMs())

    const response = await fetch(`${this.config_.baseUrl}/api/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Server-API-Key": this.config_.apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    }).finally(() => clearTimeout(timeout))

    const body = (await response.json().catch(() => null)) as PostalApiResult | null

    const data =
      body?.data && typeof body.data === "object"
        ? (body.data as PostalApiData)
        : null

    if (!response.ok || !body || body.status === "error" || !data) {
      const details =
        data?.message ||
        data?.error ||
        body?.status ||
        "unknown error"
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Postal API request failed: ${response.status} - ${
          typeof details === "string" || typeof details === "number"
            ? String(details)
            : "unknown error"
        }`
      )
    }

    return data
  }

  private resolveProviderData(
    notification: ProviderSendNotificationDTO
  ): PostalNotificationProviderData {
    return (
      (notification.provider_data as PostalNotificationProviderData) ||
      (notification.data as PostalNotificationProviderData) ||
      {}
    ) as PostalNotificationProviderData
  }

  // Allowed header name prefixes/exact names forwarded to Postal.
  // Anything not on this list is silently dropped to prevent header smuggling.
  private static readonly ALLOWED_HEADER_PREFIXES = [
    "x-",
    "reply-to",
    "list-unsubscribe",
    "list-unsubscribe-post",
    "message-id",
    "in-reply-to",
    "references",
    "mime-version",
  ]

  private static isAllowedHeader(name: string): boolean {
    const lower = name.toLowerCase()
    // Reject any value containing CR or LF regardless of name
    return PostalNotificationService.ALLOWED_HEADER_PREFIXES.some((prefix) =>
      lower.startsWith(prefix)
    )
  }

  private filterHeaders(
    raw: Record<string, string> | undefined
  ): Record<string, string> {
    if (!raw || typeof raw !== "object") {
      return {}
    }
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      const name = String(key).trim()
      const val = String(value ?? "").trim()
      // Reject headers with CRLF injection characters in name or value
      if (/[\r\n]/.test(name) || /[\r\n]/.test(val)) {
        continue
      }
      if (!PostalNotificationService.isAllowedHeader(name)) {
        continue
      }
      result[name] = val
    }
    return result
  }

  /*
    Replaces every recipient with the sandbox address when this process is not
    allowed to mail real people.

    The original addresses are not discarded: they go into X- headers, and the
    first one into the subject. One test inbox receives mail that was addressed
    to many different people, and the subject line is the only part of that
    visible in a mailbox list, so it has to carry who the message was for.

    The originals are checked for CR/LF here rather than relying on
    buildSendPayload, which from this point on only ever sees the sandbox
    address - a header or subject built from an unchecked recipient would be
    exactly the injection that check exists to prevent.
  */
  private applySandbox(recipients: {
    to: string[]
    cc: string[]
    bcc: string[]
  }): {
    to: string[]
    cc: string[]
    bcc: string[]
    headers: Record<string, string>
    subjectPrefix: string
  } {
    const passthrough = { ...recipients, headers: {}, subjectPrefix: "" }
    const sandbox = resolvePostalSandbox()

    if (!sandbox.enabled) {
      return passthrough
    }

    // Enabled but unconfigured. Refusing would make every non-production
    // deployment unable to send at all, including the ones that only ever mail
    // their own operators, so this says so loudly and sends as addressed.
    if (!sandbox.recipient) {
      if (!PostalNotificationService.warnedAboutUnconfiguredSandbox) {
        PostalNotificationService.warnedAboutUnconfiguredSandbox = true
        this.logger_.info(
          "Postal sandbox is on but POSTAL_TEST_TO is empty, so mail is being sent to its real recipients. Set POSTAL_TEST_TO, or set POSTAL_SANDBOX=false if this environment is meant to send real mail."
        )
      }

      return passthrough
    }

    PostalNotificationService.assertNoHeaderInjection(
      sandbox.recipient,
      "sandbox recipient"
    )
    for (const recipient of [
      ...recipients.to,
      ...recipients.cc,
      ...recipients.bcc,
    ]) {
      PostalNotificationService.assertNoHeaderInjection(
        recipient,
        "recipient address"
      )
    }

    const headers: Record<string, string> = { [SANDBOX_HEADER]: "true" }
    if (recipients.to.length) {
      headers[SANDBOX_ORIGINAL_TO_HEADER] = recipients.to.join(", ")
    }
    if (recipients.cc.length) {
      headers[SANDBOX_ORIGINAL_CC_HEADER] = recipients.cc.join(", ")
    }
    if (recipients.bcc.length) {
      headers[SANDBOX_ORIGINAL_BCC_HEADER] = recipients.bcc.join(", ")
    }

    const addressed = [...recipients.to, ...recipients.cc, ...recipients.bcc]
    const others = addressed.length - 1
    const subjectPrefix = `[sandbox: ${addressed[0]}${
      others > 0 ? ` +${others}` : ""
    }]`

    this.logger_.info(
      `Postal sandbox redirected ${addressed.length} recipient(s) to ${sandbox.recipient}`
    )

    return {
      to: [sandbox.recipient],
      cc: [],
      bcc: [],
      headers,
      subjectPrefix,
    }
  }

  private static warnedAboutUnconfiguredSandbox = false

  private static assertNoHeaderInjection(value: string, field: string): void {
    if (/[\r\n]/.test(value)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Postal ${field} must not contain CR/LF characters`
      )
    }
  }

  private buildSendPayload(input: {
    to: string[]
    cc: string[]
    bcc: string[]
    sender: { from: string; reply_to?: string }
    template: { template_name?: string; subject: string; html?: string; text?: string }
    attachments: Attachment[] | null | undefined
    providerData: PostalNotificationProviderData
    sandboxHeaders?: Record<string, string>
  }): PostalSendPayload {
    PostalNotificationService.assertNoHeaderInjection(input.sender.from, "sender address")
    PostalNotificationService.assertNoHeaderInjection(input.template.subject, "subject")
    for (const recipient of [...input.to, ...input.cc, ...input.bcc]) {
      PostalNotificationService.assertNoHeaderInjection(recipient, "recipient address")
    }

    const htmlBody = input.template.html || ""
    const plainBody = input.template.text || (htmlBody ? this.stripHtml(htmlBody) : "")
    const customArgHeaders = normalizePostalCustomArgs(input.providerData.custom_args)
    const filteredInputHeaders = this.filterHeaders(input.providerData.headers)
    const filteredCustomArgHeaders = this.filterHeaders(customArgHeaders)
    const replyToHeader: Record<string, string> =
      input.sender.reply_to && !/[\r\n]/.test(input.sender.reply_to)
        ? { "Reply-To": input.sender.reply_to }
        : {}
    // Sandbox headers are merged last: they record where the message would
    // have gone, so nothing in the caller's own headers may overwrite them.
    const headers: Record<string, string> = {
      ...filteredInputHeaders,
      ...replyToHeader,
      ...filteredCustomArgHeaders,
      ...this.filterHeaders(input.sandboxHeaders),
    }

    return {
      to: input.to,
      cc: input.cc.length ? input.cc : undefined,
      bcc: input.bcc.length ? input.bcc : undefined,
      from: input.sender.from,
      reply_to: input.sender.reply_to,
      subject: input.template.subject,
      html_body: htmlBody || undefined,
      plain_body: plainBody || undefined,
      tag: input.template.template_name
        ? `${POSTAL_WEBHOOK_TAG_PREFIX}${input.template.template_name}`
        : undefined,
      headers: Object.keys(headers).length ? headers : undefined,
      attachments: this.normalizeAttachments(input.attachments),
    }
  }

  private getFirstRecipientMessage(messages: unknown) {
    if (!messages || typeof messages !== "object") {
      return null
    }

    const entries = Object.entries(messages as Record<string, PostalRecipientMessage>)
    for (const [recipient, message] of entries) {
      const id = message?.id
      if (id === undefined || id === null || id === "" || (typeof id !== "string" && typeof id !== "number")) {
        continue
      }

      return {
        recipient,
        id: String(id),
        token: typeof message?.token === "string" ? message.token : undefined,
      }
    }

    return null
  }

  private normalizePostalLookupId(id: string | number) {
    const normalized = Number.parseInt(String(id), 10)
    if (!Number.isFinite(normalized) || String(normalized) !== String(id).trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal message lookup requires the numeric per-recipient message id stored by API sends"
      )
    }

    return normalized
  }

  protected normalizeEmails(value: unknown): string[] {
    if (!value) {
      return []
    }

    const values = Array.isArray(value) ? value : [value]

    return values
      .map((entry) => (typeof entry === "string" ? entry : entry?.email || ""))
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  protected normalizeAttachments(
    attachments: Attachment[] | null | undefined
  ): PostalSendPayload["attachments"] | undefined {
    if (!Array.isArray(attachments) || !attachments.length) {
      return undefined
    }

    return attachments
      .map((attachment) => {
        if (!attachment?.filename || !attachment?.content) {
          return null
        }

        return {
          name: attachment.filename,
          content_type: attachment.content_type || "application/octet-stream",
          data: attachment.content,
        }
      })
      .filter(Boolean) as NonNullable<PostalSendPayload["attachments"]>
  }

  protected stripHtml(html: string): string {
    // Linear single-pass strip: avoids O(n²) backtracking on '<'-heavy input.
    const src = String(html)
    const out: string[] = []
    let inTag = false
    for (const ch of src) {
      if (ch === "<") {
        inTag = true
        out.push(" ")
      } else if (ch === ">" && inTag) {
        inTag = false
      } else if (!inTag) {
        out.push(ch)
      }
    }
    return out.join("").replace(/\s+/g, " ").trim()
  }

  getHealthSnapshot() {
    return {
      auth_type: this.config_.authType,
      mode: "api",
    }
  }}

import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  normalizePostalCustomArgs,
  resolvePostalTemplate,
  resolvePostalSender,
} from "../templates"

type PostalAuthType = "smtp-api"

interface PostalOptions {
  auth_type?: PostalAuthType
  base_url?: string
  api_key?: string
  from: string
}

type PostalApiResult = {
  status?: string
  data?: any
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

const POSTAL_REQUEST_TIMEOUT_MS = 10000

export class PostalNotificationService extends AbstractNotificationProviderService {
  static readonly identifier = "notification-postal"

  protected config_: {
    authType: PostalAuthType
    baseUrl: string
    apiKey: string
    from: string
  }
  protected logger_: Logger
  protected container_: any

  constructor(container: any, options: PostalOptions) {
    super()
    this.container_ = container
    const { logger } = container

    const authType = (options.auth_type || "smtp-api").trim() as PostalAuthType
    const baseUrl = (options.base_url || "").trim().replace(/\/$/, "")
    const apiKey = (options.api_key || "").trim()
    const from = (options.from || "").trim()

    if (authType !== "smtp-api") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider only supports auth_type `smtp-api`."
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
        "Postal smtp-api mode requires 'base_url'"
      )
    }

    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal smtp-api mode requires 'api_key'"
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

  static validateOptions(options: Record<string, any>) {
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
    const content = (notification.content as any) || {}
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

    const payload = this.buildSendPayload({
      to,
      cc,
      bcc,
      sender,
      template,
      attachments: notification.attachments as any,
      providerData,
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
      const messageId = body?.message_id ? String(body.message_id) : ""
      const recipientMessage = this.getFirstRecipientMessage(body?.messages)
      const externalId = recipientMessage?.id || messageId

      this.logger_.info(
        `Postal notification send succeeded auth=smtp-api message_id=${
          messageId || "unknown"
        } postal_id=${recipientMessage?.id || "unknown"}`
      )

      return {
        id: externalId,
      }
    } catch (error: any) {
      if (error instanceof MedusaError) {
        throw error
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Postal API: ${error?.message || "unknown error"}`
      )
    }
  }

  private async fetchPostalApi(path: string, payload: any) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), POSTAL_REQUEST_TIMEOUT_MS)

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

    if (!response.ok || !body || body.status === "error") {
      const details =
        body?.data?.message ||
        body?.data?.error ||
        body?.status ||
        "unknown error"
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Postal API request failed: ${response.status} - ${details}`
      )
    }

    return body?.data
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

  private buildSendPayload(input: {
    to: string[]
    cc: string[]
    bcc: string[]
    sender: { from: string; reply_to?: string }
    template: { template_name?: string; subject: string; html?: string; text?: string }
    attachments: any
    providerData: PostalNotificationProviderData
  }): PostalSendPayload {
    const htmlBody = input.template.html || ""
    const plainBody = input.template.text || (htmlBody ? this.stripHtml(htmlBody) : "")
    const customArgHeaders = normalizePostalCustomArgs(input.providerData.custom_args)
    const headers = {
      ...(input.providerData.headers || {}),
      ...(input.sender.reply_to ? { "Reply-To": input.sender.reply_to } : {}),
      ...customArgHeaders,
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
      tag: input.template.template_name || undefined,
      headers: Object.keys(headers).length ? headers : undefined,
      attachments: this.normalizeAttachments(input.attachments),
    }
  }

  private getFirstRecipientMessage(messages: unknown) {
    if (!messages || typeof messages !== "object") {
      return null
    }

    const entries = Object.entries(messages as Record<string, any>)
    for (const [recipient, message] of entries) {
      const id = message?.id
      if (id === undefined || id === null || id === "") {
        continue
      }

      return {
        recipient,
        id: String(id),
        token: message?.token ? String(message.token) : undefined,
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
    attachments: any[] | null | undefined
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
    return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }

  getHealthSnapshot() {
    return {
      auth_type: this.config_.authType,
      mode: "http-api",
    }
  }
}

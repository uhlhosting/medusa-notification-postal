import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

type PostalAuthType = "smtp-api" | "smtp-ip" | "smtp"

interface PostalOptions {
  auth_type?: PostalAuthType
  base_url?: string
  api_key?: string
  from: string
  smtp_host?: string
  smtp_port?: number
  smtp_secure?: boolean
  smtp_user?: string
  smtp_pass?: string
  smtp_timeout?: number
}

type PostalApiResult = {
  status?: string
  data?: any
}

const parseBooleanOption = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false
    }
  }
  if (typeof value === "number") {
    return value !== 0
  }
  return fallback
}

export class PostalNotificationService extends AbstractNotificationProviderService {
  static readonly identifier = "notification-postal"

  protected config_: {
    authType: PostalAuthType
    baseUrl?: string
    apiKey?: string
    from: string
    smtpHost?: string
    smtpPort: number
    smtpSecure: boolean
    smtpUser?: string
    smtpPass?: string
    smtpTimeout: number
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
    const smtpHost = (options.smtp_host || "").trim()
    const smtpPort = Number(options.smtp_port || 25)
    const smtpSecure = parseBooleanOption(options.smtp_secure, false)
    const smtpUser = (options.smtp_user || "").trim()
    const smtpPass = (options.smtp_pass || "").trim()
    const smtpTimeout = Number(options.smtp_timeout || 10000)


    if (!["smtp-api", "smtp-ip", "smtp"].includes(authType)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider requires valid 'auth_type' (smtp-api | smtp-ip | smtp)"
      )
    }

    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider requires 'from'"
      )
    }

    if (authType === "smtp-api") {
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
    }

    if (authType === "smtp" || authType === "smtp-ip") {
      if (!smtpHost) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Postal ${authType} mode requires 'smtp_host'`
        )
      }
    }

    if (authType === "smtp" && (!smtpUser || !smtpPass)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal smtp mode requires 'smtp_user' and 'smtp_pass'"
      )
    }

    this.config_ = {
      authType,
      baseUrl: baseUrl || undefined,
      apiKey: apiKey || undefined,
      from,
      smtpHost: smtpHost || undefined,
      smtpPort: Number.isFinite(smtpPort) ? smtpPort : 25,
      smtpSecure,
      smtpUser: smtpUser || undefined,
      smtpPass: smtpPass || undefined,
      smtpTimeout: Number.isFinite(smtpTimeout) ? smtpTimeout : 10000,
    }
    this.logger_ = logger
  }

  static validateOptions(options: Record<string, any>) {
    const authType = (options?.auth_type || "smtp-api") as PostalAuthType
    const from = String(options?.from || "").trim()

    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }

    if (authType === "smtp-api") {
      if (!String(options?.base_url || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Option `base_url` is required when auth_type is `smtp-api`."
        )
      }
      if (!String(options?.api_key || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Option `api_key` is required when auth_type is `smtp-api`."
        )
      }
    }

    if (authType === "smtp" || authType === "smtp-ip") {
      if (!String(options?.smtp_host || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Option `smtp_host` is required for smtp transport modes."
        )
      }
    }

    if (authType === "smtp") {
      if (!String(options?.smtp_user || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Option `smtp_user` is required when auth_type is `smtp`."
        )
      }
      if (!String(options?.smtp_pass || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Option `smtp_pass` is required when auth_type is `smtp`."
        )
      }
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

    const providerData =
      (notification.provider_data as any) ||
      (notification.data as any) ||
      {}
    const content = (notification.content as any) || {}

    const to = this.normalizeEmails(notification.to)
    const cc = this.normalizeEmails(providerData?.cc)
    const bcc = this.normalizeEmails(providerData?.bcc)

    if (!to.length && !cc.length && !bcc.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification requires at least one recipient"
      )
    }

    const from = (notification.from || "").trim() || this.config_.from
    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification requires a from address"
      )
    }

    const subject =
      content?.subject || providerData?.subject || notification.template || "Notification"

    const htmlBody = content?.html || providerData?.html || ""
    const plainBody =
      content?.text ||
      providerData?.text ||
      (htmlBody ? this.stripHtml(htmlBody) : "")

    const attachments = this.normalizeAttachments(
      notification.attachments as any
    )

    const payload = {
      to,
      cc,
      bcc,
      from,
      subject,
      html_body: htmlBody || undefined,
      plain_body: plainBody || undefined,
      tag: notification.template || undefined,
      headers: providerData?.headers || undefined,
      attachments,
    }

    const workflowEvent = String(providerData?.workflow_event || "")
    const workflowRunId = String(providerData?.workflow_run_id || "")

    this.logger_.info(
      `Postal notification send started auth=${
        this.config_.authType
      } template=${notification.template || "none"} event=${
        workflowEvent || "none"
      } run_id=${workflowRunId || "none"}`
    )

    if (this.config_.authType === "smtp-api") {
      return await this.sendViaApi(payload)
    }

    return await this.sendViaSmtp(payload)
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

  private async sendViaApi(payload: any): Promise<{ id: string }> {
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
        `Failed to send email with Postal API: ${
          error?.message || "unknown error"
        }`
      )
    }
  }

  private async fetchPostalApi(path: string, payload: any) {
    if (this.config_.authType !== "smtp-api") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal API lookup requires smtp-api mode"
      )
    }

    const response = await fetch(
      `${this.config_.baseUrl}/api/v1/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Server-API-Key": this.config_.apiKey as string,
        },
        body: JSON.stringify(payload),
      }
    )

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
        "Postal message lookup requires the numeric per-recipient message id stored by new smtp-api sends"
      )
    }

    return normalized
  }

  private async sendViaSmtp(payload: any): Promise<{ id: string }> {
    try {
      const nodemailer = (await import("nodemailer")).default
      const transporter = nodemailer.createTransport({
        host: this.config_.smtpHost,
        port: this.config_.smtpPort,
        secure: this.config_.smtpSecure,
        connectionTimeout: this.config_.smtpTimeout,
        auth:
          this.config_.authType === "smtp"
            ? {
                user: this.config_.smtpUser,
                pass: this.config_.smtpPass,
              }
            : undefined,
      })

      const result = await transporter.sendMail({
        from: payload.from,
        to: payload.to.length ? payload.to : undefined,
        cc: payload.cc.length ? payload.cc : undefined,
        bcc: payload.bcc.length ? payload.bcc : undefined,
        subject: payload.subject,
        html: payload.html_body,
        text: payload.plain_body,
        headers: payload.headers,
        attachments: (payload.attachments || []).map((attachment: any) => ({
          filename: attachment.name,
          content: attachment.data,
          contentType: attachment.content_type,
          encoding: "base64",
        })),
      })

      this.logger_.info(
        `Postal notification send succeeded auth=${
          this.config_.authType
        } message_id=${result?.messageId || "unknown"}`
      )

      return {
        id: result?.messageId,
      }
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Postal SMTP: ${
          error?.message || "unknown error"
        }`
      )
    }
  }

  protected normalizeEmails(value: any): string[] {
    if (!value) {
      return []
    }

    const values = Array.isArray(value) ? value : [value]

    return values
      .map((entry) => (typeof entry === "string" ? entry : entry?.email || ""))
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  protected normalizeAttachments(attachments: any[] | null | undefined) {
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
      .filter(Boolean)
  }

  protected stripHtml(html: string): string {
    return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }

  getHealthSnapshot() {
    const authType = this.config_.authType
    let mode = "smtp-auth"

    if (authType === "smtp-api") {
      mode = "http-api"
    } else if (authType === "smtp-ip") {
      mode = "smtp-ip-allowlist"
    }

    return {
      auth_type: authType,
      mode,
    }
  }
}

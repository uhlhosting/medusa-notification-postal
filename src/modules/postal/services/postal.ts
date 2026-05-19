import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import nodemailer from "nodemailer"

interface PostalOptions {
  auth_type?: "smtp-api" | "smtp-ip" | "smtp"
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

export class PostalNotificationService extends AbstractNotificationProviderService {
  static readonly identifier = "notification-postal"

  protected config_: {
    authType: "smtp-api" | "smtp-ip" | "smtp"
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

  constructor({ logger }: { logger: Logger }, options: PostalOptions) {
    super()

    const authType = (options.auth_type || "smtp-api").trim() as
      | "smtp-api"
      | "smtp-ip"
      | "smtp"
    const baseUrl = (options.base_url || "").trim().replace(/\/$/, "")
    const apiKey = (options.api_key || "").trim()
    const from = (options.from || "").trim()
    const smtpHost = (options.smtp_host || "").trim()
    const smtpPort = Number(options.smtp_port || 25)
    const smtpSecure = Boolean(options.smtp_secure)
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
    const authType = (options?.auth_type || "smtp-api") as
      | "smtp-api"
      | "smtp-ip"
      | "smtp"
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

    const to = this.normalizeEmails(notification.to)
    const providerData = (notification.provider_data as any) || {}
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

    const subject = providerData?.subject || notification.template || "Notification"

    const htmlBody = providerData?.html || ""
    const plainBody =
      providerData?.text ||
      (htmlBody ? this.stripHtml(htmlBody) : "")

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
      attachments: this.normalizeAttachments(notification.attachments as any),
    }

    const workflowEvent = String(providerData?.workflow_event || "")
    const workflowRunId = String(providerData?.workflow_run_id || "")

    this.logger_.info(
      `Postal notification send started auth=${this.config_.authType} template=${notification.template || "none"} event=${workflowEvent || "none"} run_id=${workflowRunId || "none"}`
    )

    if (this.config_.authType === "smtp-api") {
      try {
        const response = await fetch(
          `${this.config_.baseUrl}/api/v1/send/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Server-API-Key": this.config_.apiKey as string,
            },
            body: JSON.stringify(payload),
          }
        )

        const body = await response.json().catch(() => null)

        if (!response.ok || body?.status === "error") {
          const details =
            body?.data?.message || body?.data?.error || body?.status || "unknown error"
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Failed to send email with Postal API: ${response.status} - ${details}`
          )
        }

        this.logger_.info(
          `Postal notification send succeeded auth=smtp-api message_id=${body?.data?.message_id || "unknown"}`
        )

        return {
          id: body?.data?.message_id,
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

    try {
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
        from,
        to: to.length ? to : undefined,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject,
        html: htmlBody || undefined,
        text: plainBody || undefined,
        headers: providerData?.headers || undefined,
        attachments: (this.normalizeAttachments(notification.attachments as any) || []).map(
          (attachment: any) => ({
            filename: attachment.name,
            content: attachment.data,
            contentType: attachment.content_type,
            encoding: "base64",
          })
        ),
      })

      this.logger_.info(
        `Postal notification send succeeded auth=${this.config_.authType} message_id=${result?.messageId || "unknown"}`
      )

      return {
        id: result?.messageId,
      }
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Postal SMTP: ${error?.message || "unknown error"}`
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

    return {
      auth_type: authType,
      mode:
        authType === "smtp-api"
          ? "http-api"
          : authType === "smtp-ip"
            ? "smtp-ip-allowlist"
            : "smtp-auth",
    }
  }
}

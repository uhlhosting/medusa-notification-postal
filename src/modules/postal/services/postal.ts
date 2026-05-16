import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { 
  Logger, 
  ProviderSendNotificationDTO, 
  ProviderSendNotificationResultsDTO 
} from "@medusajs/framework/types"

interface PostalOptions {
  base_url: string
  api_key: string
  from: string
}

export class PostalNotificationService extends AbstractNotificationProviderService {
  static readonly identifier = "notification-postal"

  protected config_: {
    baseUrl: string
    apiKey: string
    from: string
  }
  protected logger_: Logger

  constructor({ logger }: { logger: Logger }, options: PostalOptions) {
    super()

    const baseUrl = (options.base_url || "").trim().replace(/\/$/, "")
    const apiKey = (options.api_key || "").trim()
    const from = (options.from || "").trim()

    if (!baseUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider requires 'base_url'"
      )
    }

    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal notification provider requires 'api_key'"
      )
    }

    this.config_ = {
      baseUrl,
      apiKey,
      from,
    }
    this.logger_ = logger
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
    const providerData = (notification.data as any)?.provider_data || {}
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
      (notification.data as any)?.subject ||
      notification.template ||
      "Notification"

    const htmlBody = (notification.data as any)?.html || ""
    const plainBody =
      (notification.data as any)?.text ||
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

    try {
      const response = await fetch(`${this.config_.baseUrl}/api/v1/send/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Server-API-Key": this.config_.apiKey,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json().catch(() => null)

      if (!response.ok || body?.status === "error") {
        const details = body?.data?.message || body?.data?.error || body?.status || "unknown error"
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Failed to send email with Postal: ${response.status} - ${details}`
        )
      }

      return {
        id: body?.data?.message_id,
      }
    } catch (error: any) {
      if (error instanceof MedusaError) {
        throw error
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Postal: ${error?.message || "unknown error"}`
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
}

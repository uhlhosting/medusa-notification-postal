"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
class PostalNotificationService extends utils_1.AbstractNotificationProviderService {
    constructor({ logger }, options) {
        super();
        const baseUrl = (options.base_url || "").trim().replace(/\/$/, "");
        const apiKey = (options.api_key || "").trim();
        const from = (options.from || "").trim();
        if (!baseUrl) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider requires 'base_url'");
        }
        if (!apiKey) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider requires 'api_key'");
        }
        this.config_ = {
            baseUrl,
            apiKey,
            from,
        };
        this.logger_ = logger;
    }
    async send(notification) {
        if (!notification) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No notification information provided");
        }
        const to = this.normalizeEmails(notification.to);
        const providerData = notification.data?.provider_data || {};
        const cc = this.normalizeEmails(providerData?.cc);
        const bcc = this.normalizeEmails(providerData?.bcc);
        if (!to.length && !cc.length && !bcc.length) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires at least one recipient");
        }
        const from = (notification.from || "").trim() || this.config_.from;
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires a from address");
        }
        const subject = notification.data?.subject ||
            notification.template ||
            "Notification";
        const htmlBody = notification.data?.html || "";
        const plainBody = notification.data?.text ||
            (htmlBody ? this.stripHtml(htmlBody) : "");
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
            attachments: this.normalizeAttachments(notification.attachments),
        };
        try {
            const response = await fetch(`${this.config_.baseUrl}/api/v1/send/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Server-API-Key": this.config_.apiKey,
                },
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => null);
            if (!response.ok || body?.status === "error") {
                const details = body?.data?.message || body?.data?.error || body?.status || "unknown error";
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal: ${response.status} - ${details}`);
            }
            return {
                id: body?.data?.message_id,
            };
        }
        catch (error) {
            if (error instanceof utils_1.MedusaError) {
                throw error;
            }
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal: ${error?.message || "unknown error"}`);
        }
    }
    normalizeEmails(value) {
        if (!value) {
            return [];
        }
        const values = Array.isArray(value) ? value : [value];
        return values
            .map((entry) => (typeof entry === "string" ? entry : entry?.email || ""))
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    normalizeAttachments(attachments) {
        if (!Array.isArray(attachments) || !attachments.length) {
            return undefined;
        }
        return attachments
            .map((attachment) => {
            if (!attachment?.filename || !attachment?.content) {
                return null;
            }
            return {
                name: attachment.filename,
                content_type: attachment.content_type || "application/octet-stream",
                data: attachment.content,
            };
        })
            .filter(Boolean);
    }
    stripHtml(html) {
        return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
}
exports.PostalNotificationService = PostalNotificationService;
PostalNotificationService.identifier = "notification-postal";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvcG9zdGFsL3NlcnZpY2VzL3Bvc3RhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFHa0M7QUFhbEMsTUFBYSx5QkFBMEIsU0FBUSwyQ0FBbUM7SUFVaEYsWUFBWSxFQUFFLE1BQU0sRUFBc0IsRUFBRSxPQUFzQjtRQUNoRSxLQUFLLEVBQUUsQ0FBQTtRQUVQLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7UUFFeEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsa0RBQWtELENBQ25ELENBQUE7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsaURBQWlELENBQ2xELENBQUE7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNiLE9BQU87WUFDUCxNQUFNO1lBQ04sSUFBSTtTQUNMLENBQUE7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtJQUN2QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUksQ0FDUixZQUF5QztRQUV6QyxJQUFJLENBQUMs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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const send_postal_email_1 = require("../../../workflows/send-postal-email");
class PostalNotificationService extends utils_1.AbstractNotificationProviderService {
    constructor(container, options) {
        super();
        this.container_ = container;
        const { logger } = container;
        const authType = (options.auth_type || "smtp-api").trim();
        const baseUrl = (options.base_url || "").trim().replace(/\/$/, "");
        const apiKey = (options.api_key || "").trim();
        const from = (options.from || "").trim();
        const smtpHost = (options.smtp_host || "").trim();
        const smtpPort = Number(options.smtp_port || 25);
        const smtpSecure = Boolean(options.smtp_secure);
        const smtpUser = (options.smtp_user || "").trim();
        const smtpPass = (options.smtp_pass || "").trim();
        const smtpTimeout = Number(options.smtp_timeout || 10000);
        if (!["smtp-api", "smtp-ip", "smtp"].includes(authType)) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider requires valid 'auth_type' (smtp-api | smtp-ip | smtp)");
        }
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider requires 'from'");
        }
        if (authType === "smtp-api") {
            if (!baseUrl) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal smtp-api mode requires 'base_url'");
            }
            if (!apiKey) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal smtp-api mode requires 'api_key'");
            }
        }
        if (authType === "smtp" || authType === "smtp-ip") {
            if (!smtpHost) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Postal ${authType} mode requires 'smtp_host'`);
            }
        }
        if (authType === "smtp" && (!smtpUser || !smtpPass)) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal smtp mode requires 'smtp_user' and 'smtp_pass'");
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
        };
        this.logger_ = logger;
    }
    static validateOptions(options) {
        const authType = (options?.auth_type || "smtp-api");
        const from = String(options?.from || "").trim();
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `from` is required in the provider's options.");
        }
        if (authType === "smtp-api") {
            if (!String(options?.base_url || "").trim()) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `base_url` is required when auth_type is `smtp-api`.");
            }
            if (!String(options?.api_key || "").trim()) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `api_key` is required when auth_type is `smtp-api`.");
            }
        }
        if (authType === "smtp" || authType === "smtp-ip") {
            if (!String(options?.smtp_host || "").trim()) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `smtp_host` is required for smtp transport modes.");
            }
        }
        if (authType === "smtp") {
            if (!String(options?.smtp_user || "").trim()) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `smtp_user` is required when auth_type is `smtp`.");
            }
            if (!String(options?.smtp_pass || "").trim()) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `smtp_pass` is required when auth_type is `smtp`.");
            }
        }
    }
    async send(notification) {
        if (!notification) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No notification information provided");
        }
        const providerData = notification.provider_data || {};
        if (!providerData?.__is_workflow_execution) {
            this.logger_.info(`PostalNotificationService.send programmatically executing send-postal-email workflow`);
            const { result } = await (0, send_postal_email_1.sendPostalEmailWorkflow)(this.container_).run({
                input: {
                    to: notification.to,
                    from: notification.from || undefined,
                    template: notification.template || undefined,
                    provider_data: {
                        ...providerData,
                        workflow_event: providerData?.workflow_event || notification.template || "email.send",
                        workflow_run_id: providerData?.workflow_run_id || `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        __is_workflow_execution: true,
                    },
                },
            });
            return {
                id: result?.delivery?.id || undefined,
            };
        }
        const to = this.normalizeEmails(notification.to);
        const cc = this.normalizeEmails(providerData?.cc);
        const bcc = this.normalizeEmails(providerData?.bcc);
        if (!to.length && !cc.length && !bcc.length) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires at least one recipient");
        }
        const from = (notification.from || "").trim() || this.config_.from;
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires a from address");
        }
        const subject = providerData?.subject || notification.template || "Notification";
        const htmlBody = providerData?.html || "";
        const plainBody = providerData?.text ||
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
        const workflowEvent = String(providerData?.workflow_event || "");
        const workflowRunId = String(providerData?.workflow_run_id || "");
        this.logger_.info(`Postal notification send started auth=${this.config_.authType} template=${notification.template || "none"} event=${workflowEvent || "none"} run_id=${workflowRunId || "none"}`);
        if (this.config_.authType === "smtp-api") {
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
                    throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal API: ${response.status} - ${details}`);
                }
                this.logger_.info(`Postal notification send succeeded auth=smtp-api message_id=${body?.data?.message_id || "unknown"}`);
                return {
                    id: body?.data?.message_id,
                };
            }
            catch (error) {
                if (error instanceof utils_1.MedusaError) {
                    throw error;
                }
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal API: ${error?.message || "unknown error"}`);
            }
        }
        try {
            const nodemailer = (await import("nodemailer")).default;
            const transporter = nodemailer.createTransport({
                host: this.config_.smtpHost,
                port: this.config_.smtpPort,
                secure: this.config_.smtpSecure,
                connectionTimeout: this.config_.smtpTimeout,
                auth: this.config_.authType === "smtp"
                    ? {
                        user: this.config_.smtpUser,
                        pass: this.config_.smtpPass,
                    }
                    : undefined,
            });
            const result = await transporter.sendMail({
                from,
                to: to.length ? to : undefined,
                cc: cc.length ? cc : undefined,
                bcc: bcc.length ? bcc : undefined,
                subject,
                html: htmlBody || undefined,
                text: plainBody || undefined,
                headers: providerData?.headers || undefined,
                attachments: (this.normalizeAttachments(notification.attachments) || []).map((attachment) => ({
                    filename: attachment.name,
                    content: attachment.data,
                    contentType: attachment.content_type,
                    encoding: "base64",
                })),
            });
            this.logger_.info(`Postal notification send succeeded auth=${this.config_.authType} message_id=${result?.messageId || "unknown"}`);
            return {
                id: result?.messageId,
            };
        }
        catch (error) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal SMTP: ${error?.message || "unknown error"}`);
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
    getHealthSnapshot() {
        const authType = this.config_.authType;
        return {
            auth_type: authType,
            mode: authType === "smtp-api"
                ? "http-api"
                : authType === "smtp-ip"
                    ? "smtp-ip-allowlist"
                    : "smtp-auth",
        };
    }
}
exports.PostalNotificationService = PostalNotificationService;
PostalNotificationService.identifier = "notification-postal";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvcG9zdGFsL3NlcnZpY2VzL3Bvc3RhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFHa0M7QUFNbEMsNEVBQThFO0FBZTlFLE1BQWEseUJBQTBCLFNBQVEsMkNBQW1DO0lBa0JoRixZQUFZLFNBQWMsRUFBRSxPQUFzQjtRQUNoRCxLQUFLLEVBQUUsQ0FBQTtRQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFBO1FBQzNCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUE7UUFFNUIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxDQUFDLElBQUksRUFHN0MsQ0FBQTtRQUNWLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDeEMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ2pELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDL0MsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FB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
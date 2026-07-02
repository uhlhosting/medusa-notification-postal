"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const templates_1 = require("../templates");
const POSTAL_REQUEST_TIMEOUT_MS = 10000;
const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:";
class PostalNotificationService extends utils_1.AbstractNotificationProviderService {
    constructor(container, options) {
        super();
        this.container_ = container;
        const { logger } = container;
        const authType = (options.auth_type || "smtp-api").trim();
        const baseUrl = (options.base_url || "").trim().replace(/\/$/, "");
        const apiKey = (options.api_key || "").trim();
        const from = (options.from || "").trim();
        if (authType !== "smtp-api") {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider only supports API auth mode.");
        }
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification provider requires 'from'");
        }
        if (!baseUrl) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal API mode requires 'base_url'");
        }
        if (!apiKey) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal API mode requires 'api_key'");
        }
        this.config_ = {
            authType,
            baseUrl,
            apiKey,
            from,
        };
        this.logger_ = logger;
    }
    static validateOptions(options) {
        const from = String(options?.from || "").trim();
        if (!from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `from` is required in the provider's options.");
        }
        if (!String(options?.base_url || "").trim()) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `base_url` is required.");
        }
        if (!String(options?.api_key || "").trim()) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Option `api_key` is required.");
        }
    }
    async send(notification) {
        if (!notification) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No notification information provided");
        }
        const providerData = this.resolveProviderData(notification);
        const content = notification.content || {};
        const to = this.normalizeEmails(notification.to);
        const cc = this.normalizeEmails(providerData.cc);
        const bcc = this.normalizeEmails(providerData.bcc);
        if (!to.length && !cc.length && !bcc.length) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires at least one recipient");
        }
        const sender = (0, templates_1.resolvePostalSender)({
            from: providerData.from || notification.from || undefined,
            from_name: providerData.from_name,
            reply_to: providerData.reply_to,
        }, this.config_.from);
        if (!sender.from) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires a from address");
        }
        const template = (0, templates_1.resolvePostalTemplate)(notification.template, {
            subject: content?.subject || providerData.subject,
            html: content?.html || providerData.html,
            text: content?.text || providerData.text,
        });
        const payload = this.buildSendPayload({
            to,
            cc,
            bcc,
            sender,
            template,
            attachments: notification.attachments,
            providerData,
        });
        this.logger_.info(`Postal notification send started template=${template.template_name || "default"} recipients=${payload.to.length} event=${providerData.workflow_event || "none"} run_id=${providerData.workflow_run_id || "none"}`);
        return await this.sendViaApi(payload);
    }
    async getMessageDetails(id) {
        return await this.fetchPostalApi("messages/message", {
            id: this.normalizePostalLookupId(id),
            _expansions: true,
        });
    }
    async getMessageDeliveries(id) {
        return await this.fetchPostalApi("messages/deliveries", {
            id: this.normalizePostalLookupId(id),
        });
    }
    async sendViaApi(payload) {
        try {
            const body = await this.fetchPostalApi("send/message", payload);
            const messageId = body?.message_id ? String(body.message_id) : "";
            const recipientMessage = this.getFirstRecipientMessage(body?.messages);
            const externalId = recipientMessage?.id || messageId;
            this.logger_.info(`Postal notification send succeeded auth=api message_id=${messageId || "unknown"} postal_id=${recipientMessage?.id || "unknown"}`);
            return {
                id: externalId,
            };
        }
        catch (error) {
            if (error instanceof utils_1.MedusaError) {
                throw error;
            }
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal API: ${error?.message || "unknown error"}`);
        }
    }
    async fetchPostalApi(path, payload) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), POSTAL_REQUEST_TIMEOUT_MS);
        const response = await fetch(`${this.config_.baseUrl}/api/v1/${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Server-API-Key": this.config_.apiKey,
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
        }).finally(() => clearTimeout(timeout));
        const body = (await response.json().catch(() => null));
        if (!response.ok || !body || body.status === "error") {
            const details = body?.data?.message ||
                body?.data?.error ||
                body?.status ||
                "unknown error";
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Postal API request failed: ${response.status} - ${details}`);
        }
        return body?.data;
    }
    resolveProviderData(notification) {
        return (notification.provider_data ||
            notification.data ||
            {});
    }
    static isAllowedHeader(name) {
        const lower = name.toLowerCase();
        // Reject any value containing CR or LF regardless of name
        return PostalNotificationService.ALLOWED_HEADER_PREFIXES.some((prefix) => lower.startsWith(prefix));
    }
    filterHeaders(raw) {
        if (!raw || typeof raw !== "object") {
            return {};
        }
        const result = {};
        for (const [key, value] of Object.entries(raw)) {
            const name = String(key).trim();
            const val = String(value ?? "").trim();
            // Reject headers with CRLF injection characters in name or value
            if (/[\r\n]/.test(name) || /[\r\n]/.test(val)) {
                continue;
            }
            if (!PostalNotificationService.isAllowedHeader(name)) {
                continue;
            }
            result[name] = val;
        }
        return result;
    }
    buildSendPayload(input) {
        const htmlBody = input.template.html || "";
        const plainBody = input.template.text || (htmlBody ? this.stripHtml(htmlBody) : "");
        const customArgHeaders = (0, templates_1.normalizePostalCustomArgs)(input.providerData.custom_args);
        const filteredInputHeaders = this.filterHeaders(input.providerData.headers);
        const filteredCustomArgHeaders = this.filterHeaders(customArgHeaders);
        const replyToHeader = input.sender.reply_to && !/[\r\n]/.test(input.sender.reply_to)
            ? { "Reply-To": input.sender.reply_to }
            : {};
        const headers = {
            ...filteredInputHeaders,
            ...replyToHeader,
            ...filteredCustomArgHeaders,
        };
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
        };
    }
    getFirstRecipientMessage(messages) {
        if (!messages || typeof messages !== "object") {
            return null;
        }
        const entries = Object.entries(messages);
        for (const [recipient, message] of entries) {
            const id = message?.id;
            if (id === undefined || id === null || id === "") {
                continue;
            }
            return {
                recipient,
                id: String(id),
                token: message?.token ? String(message.token) : undefined,
            };
        }
        return null;
    }
    normalizePostalLookupId(id) {
        const normalized = Number.parseInt(String(id), 10);
        if (!Number.isFinite(normalized) || String(normalized) !== String(id).trim()) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal message lookup requires the numeric per-recipient message id stored by API sends");
        }
        return normalized;
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
        // Linear single-pass strip: avoids O(n²) backtracking on '<'-heavy input.
        const src = String(html);
        const out = [];
        let inTag = false;
        for (let i = 0; i < src.length; i++) {
            const ch = src[i];
            if (ch === "<") {
                inTag = true;
                out.push(" ");
            }
            else if (ch === ">" && inTag) {
                inTag = false;
            }
            else if (!inTag) {
                out.push(ch);
            }
        }
        return out.join("").replace(/\s+/g, " ").trim();
    }
    getHealthSnapshot() {
        return {
            auth_type: "api",
            mode: "api",
        };
    }
}
exports.PostalNotificationService = PostalNotificationService;
PostalNotificationService.identifier = "notification-postal";
// Allowed header name prefixes/exact names forwarded to Postal.
// Anything not on this list is silently dropped to prevent header smuggling.
PostalNotificationService.ALLOWED_HEADER_PREFIXES = [
    "x-",
    "reply-to",
    "list-unsubscribe",
    "list-unsubscribe-post",
    "message-id",
    "in-reply-to",
    "references",
    "mime-version",
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9wb3N0YWwvc2VydmljZXMvcG9zdGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUdrQztBQU1sQyw0Q0FJcUI7QUFrRHJCLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFBO0FBQ3ZDLE1BQU0seUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFFMUUsTUFBYSx5QkFBMEIsU0FBUSwyQ0FBbUM7SUFZaEYsWUFBWSxTQUFjLEVBQUUsT0FBc0I7UUFDaEQsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQTtRQUMzQixNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFBO1FBRTVCLE1BQU0sUUFBUSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQW9CLENBQUE7UUFDM0UsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDbEUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQzdDLE1BQU0sSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUV4QyxJQUFJLFFBQVEsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5QiwyREFBMkQsQ0FDNUQsQ0FBQTtRQUNILENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixNQUFNLElB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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const templates_1 = require("../templates");
const POSTAL_DEFAULT_TIMEOUT_MS = 10000;
const POSTAL_MIN_TIMEOUT_MS = 1000;
const POSTAL_MAX_TIMEOUT_MS = 60000;
const resolveRequestTimeoutMs = () => {
    const raw = Number.parseInt(String(process.env.POSTAL_REQUEST_TIMEOUT_MS || ""), 10);
    if (!Number.isFinite(raw)) {
        return POSTAL_DEFAULT_TIMEOUT_MS;
    }
    return Math.min(Math.max(raw, POSTAL_MIN_TIMEOUT_MS), POSTAL_MAX_TIMEOUT_MS);
};
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
        let parsedBaseUrl;
        try {
            parsedBaseUrl = new URL(baseUrl);
        }
        catch {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal 'base_url' must be a valid absolute URL");
        }
        if (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal 'base_url' must use the http or https protocol");
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
        const timeout = setTimeout(() => controller.abort(), resolveRequestTimeoutMs());
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
    static assertNoHeaderInjection(value, field) {
        if (/[\r\n]/.test(value)) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Postal ${field} must not contain CR/LF characters`);
        }
    }
    buildSendPayload(input) {
        PostalNotificationService.assertNoHeaderInjection(input.sender.from, "sender address");
        PostalNotificationService.assertNoHeaderInjection(input.template.subject, "subject");
        for (const recipient of [...input.to, ...input.cc, ...input.bcc]) {
            PostalNotificationService.assertNoHeaderInjection(recipient, "recipient address");
        }
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
            auth_type: this.config_.authType,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9wb3N0YWwvc2VydmljZXMvcG9zdGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUdrQztBQU1sQyw0Q0FJcUI7QUFrRHJCLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFBO0FBQ3ZDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFBO0FBQ2xDLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBRW5DLE1BQU0sdUJBQXVCLEdBQUcsR0FBVyxFQUFFO0lBQzNDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDcEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUMxQixPQUFPLHlCQUF5QixDQUFBO0lBQ2xDLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUscUJBQXFCLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO0FBQzlFLENBQUMsQ0FBQTtBQUVELE1BQU0seUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFFMUUsTUFBYSx5QkFBMEIsU0FBUSwyQ0FBbUM7SUFZaEYsWUFBWSxTQUFjLEVBQUUsT0FBc0I7UUFDaEQsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQTtRQUMzQixNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFBO1FBRTVCLE1BQU0sUUFBUSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQW9CLENBQUE7UUFDM0UsTUFBTSxPQUFPLEdB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
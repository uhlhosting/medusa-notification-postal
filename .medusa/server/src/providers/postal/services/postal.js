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
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send email with Postal API: ${error instanceof Error ? error.message : "unknown error"}`);
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
        const data = body?.data && typeof body.data === "object"
            ? body.data
            : null;
        if (!response.ok || !body || body.status === "error" || !data) {
            const details = data?.message ||
                data?.error ||
                body?.status ||
                "unknown error";
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Postal API request failed: ${response.status} - ${details}`);
        }
        return data;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9wb3N0YWwvc2VydmljZXMvcG9zdGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUdrQztBQU9sQyw0Q0FJcUI7QUF5RHJCLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFBO0FBQ3ZDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFBO0FBQ2xDLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBRW5DLE1BQU0sdUJBQXVCLEdBQUcsR0FBVyxFQUFFO0lBQzNDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDcEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUMxQixPQUFPLHlCQUF5QixDQUFBO0lBQ2xDLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUscUJBQXFCLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO0FBQzlFLENBQUMsQ0FBQTtBQUVELE1BQU0seUJBQXlCLEdBQUcsd0NBQXdDLENBQUE7QUFFMUUsTUFBYSx5QkFBMEIsU0FBUSwyQ0FBbUM7SUFXaEYsWUFBWSxTQUEyQyxFQUFFLE9BQXNCO1FBQzdFLEtBQUssRUFBRSxDQUFBO1FBQ1AsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQTtRQUU1QixNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFvQixDQUFBO1FBQzNFLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7UUFFeEMsSUFBSSxRQUFRLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsMkRBQTJELENBQzVELENBQUE7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsOENBQThDLENBQy9DLENBQUE7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIscUNBQXFDLENBQ3RDLENBQUE7UUFDSCxDQUFDO1FBRUQsSUFBSSxhQUFrQixDQUFBO1FBQ3RCLElBQUksQ0FBQztZQUNILGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNsQyxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1AsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsZ0RBQWdELENBQ2pELENBQUE7UUFDSCxDQUFDO1FBQ0QsSUFBSSxhQUFhLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxhQUFhLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlFLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHVEQUF1RCxDQUN4RCxDQUFBO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLG9DQUFvQyxDQUNyQyxDQUFBO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFPLEdBQUc7WUFDYixRQUFRO1lBQ1IsT0FBTztZQUNQLE1BQU07WUFDTixJQUFJO1NBQ0wsQ0FBQTtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQWdDO1FBQ3JELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBRS9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHNEQUFzRCxDQUN2RCxDQUFBO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQzVDLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLGdDQUFnQyxDQUNqQyxDQUFBO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQzNDLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLCtCQUErQixDQUNoQyxDQUFBO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUNSLFlBQXlDO1FBRXpDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNsQixNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5QixzQ0FBc0MsQ0FDdkMsQ0FBQTtRQUNILENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDM0QsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUE7UUFDMUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDaEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDaEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFbEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzVDLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHFEQUFxRCxDQUN0RCxDQUFBO1FBQ0gsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLElBQUEsK0JBQW1CLEVBQ2hDO1lBQ0UsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksSUFBSSxTQUFTO1lBQ3pELFNBQVMsRUFBRSxZQUFZLENBQUMsU0FBUztZQUNqQyxRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVE7U0FDaEMsRUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDbEIsQ0FBQTtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsNkNBQTZDLENBQzlDLENBQUE7UUFDSCxDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBQSxpQ0FBcUIsRUFBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzVELE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPO1lBQ2pELElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJO1lBQ3hDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJO1NBQ3pDLENBQUMsQ0FBQTtRQUVGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUNwQyxFQUFFO1lBQ0YsRUFBRTtZQUNGLEdBQUc7WUFDSCxNQUFNO1lBQ04sUUFBUTtZQUNSLFdBQVcsRUFBRSxZQUFZLENBQUMsV0FBVztZQUNyQyxZQUFZO1NBQ2IsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQ2YsNkNBQ0UsUUFBUSxDQUFDLGFBQWEsSUFBSSxTQUM1QixlQUFlLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxVQUM5QixZQUFZLENBQUMsY0FBYyxJQUFJLE1BQ2pDLFdBQVcsWUFBWSxDQUFDLGVBQWUsSUFBSSxNQUFNLEVBQUUsQ0FDcEQsQ0FBQTtRQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFRCxLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBbUI7UUFDekMsT0FBTyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUU7WUFDbkQsRUFBRSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7WUFDcEMsV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxFQUFtQjtRQUM1QyxPQUFPLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRTtZQUN0RCxFQUFFLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztTQUNyQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUEwQjtRQUNqRCxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQy9ELE1BQU0sU0FBUyxHQUFHLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtZQUNqRSxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFDdEUsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLFNBQVMsQ0FBQTtZQUVwRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDZiwwREFDRSxTQUFTLElBQUksU0FDZixjQUFjLGdCQUFnQixFQUFFLEVBQUUsSUFBSSxTQUFTLEVBQUUsQ0FDbEQsQ0FBQTtZQUVELE9BQU87Z0JBQ0wsRUFBRSxFQUFFLFVBQVU7YUFDZixDQUFBO1FBQ0gsQ0FBQztRQUFDLE9BQU8sS0FBYyxFQUFFLENBQUM7WUFDeEIsSUFBSSxLQUFLLFlBQVksbUJBQVcsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLEtBQUssQ0FBQTtZQUNiLENBQUM7WUFFRCxNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQ2xDLHlDQUNFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQzNDLEVBQUUsQ0FDSCxDQUFBO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsY0FBYyxDQUMxQixJQUFZLEVBQ1osT0FBb0Q7UUFFcEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQTtRQUN4QyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtRQUUvRSxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxXQUFXLElBQUksRUFBRSxFQUFFO1lBQ3JFLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTthQUN4QztZQUNELE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtZQUN6QixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7U0FDOUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUV2QyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBMkIsQ0FBQTtRQUVoRixNQUFNLElBQUksR0FDUixJQUFJLEVBQUUsSUFBSSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRO1lBQ3pDLENBQUMsQ0FBRSxJQUFJLENBQUMsSUFBc0I7WUFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQTtRQUVWLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDOUQsTUFBTSxPQUFPLEdBQ1gsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsSUFBSSxFQUFFLE1BQU07Z0JBQ1osZUFBZSxDQUFBO1lBQ2pCLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFDbEMsOEJBQThCLFFBQVEsQ0FBQyxNQUFNLE1BQU0sT0FBTyxFQUFFLENBQzdELENBQUE7UUFDSCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU8sbUJBQW1CLENBQ3pCLFlBQXlDO1FBRXpDLE9BQU8sQ0FDSixZQUFZLENBQUMsYUFBZ0Q7WUFDN0QsWUFBWSxDQUFDLElBQXVDO1lBQ3JELEVBQUUsQ0FDK0IsQ0FBQTtJQUNyQyxDQUFDO0lBZU8sTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFZO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNoQywwREFBMEQ7UUFDMUQsT0FBTyx5QkFBeUIsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUN2RSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUN6QixDQUFBO0lBQ0gsQ0FBQztJQUVPLGFBQWEsQ0FDbkIsR0FBdUM7UUFFdkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxPQUFPLEVBQUUsQ0FBQTtRQUNYLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBMkIsRUFBRSxDQUFBO1FBQ3pDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDL0MsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQy9CLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDdEMsaUVBQWlFO1lBQ2pFLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLFNBQVE7WUFDVixDQUFDO1lBQ0QsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxTQUFRO1lBQ1YsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUE7UUFDcEIsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVPLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFhLEVBQUUsS0FBYTtRQUNqRSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5QixVQUFVLEtBQUssb0NBQW9DLENBQ3BELENBQUE7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVPLGdCQUFnQixDQUFDLEtBUXhCO1FBQ0MseUJBQXlCLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtRQUN0Rix5QkFBeUIsQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNwRixLQUFLLE1BQU0sU0FBUyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2pFLHlCQUF5QixDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO1FBQ25GLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUE7UUFDMUMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ25GLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxxQ0FBeUIsRUFBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ2xGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzNFLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQ3JFLE1BQU0sYUFBYSxHQUNqQixLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDNUQsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ3ZDLENBQUMsQ0FBQyxFQUFFLENBQUE7UUFDUixNQUFNLE9BQU8sR0FBMkI7WUFDdEMsR0FBRyxvQkFBb0I7WUFDdkIsR0FBRyxhQUFhO1lBQ2hCLEdBQUcsd0JBQXdCO1NBQzVCLENBQUE7UUFFRCxPQUFPO1lBQ0wsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ1osRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUM3QyxJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJO1lBQ3ZCLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7WUFDL0IsT0FBTyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTztZQUMvQixTQUFTLEVBQUUsUUFBUSxJQUFJLFNBQVM7WUFDaEMsVUFBVSxFQUFFLFNBQVMsSUFBSSxTQUFTO1lBQ2xDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWE7Z0JBQy9CLENBQUMsQ0FBQyxHQUFHLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFO2dCQUMvRCxDQUFDLENBQUMsU0FBUztZQUNiLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzFELFdBQVcsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztTQUMxRCxDQUFBO0lBQ0gsQ0FBQztJQUVPLHdCQUF3QixDQUFDLFFBQWlCO1FBQ2hELElBQUksQ0FBQyxRQUFRLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDOUMsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFrRCxDQUFDLENBQUE7UUFDbEYsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzNDLE1BQU0sRUFBRSxHQUFHLE9BQU8sRUFBRSxFQUFFLENBQUE7WUFDdEIsSUFBSSxFQUFFLEtBQUssU0FBUyxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxTQUFRO1lBQ1YsQ0FBQztZQUVELE9BQU87Z0JBQ0wsU0FBUztnQkFDVCxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDZCxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUMxRCxDQUFBO1FBQ0gsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVPLHVCQUF1QixDQUFDLEVBQW1CO1FBQ2pELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUM3RSxNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5Qix5RkFBeUYsQ0FDMUYsQ0FBQTtRQUNILENBQUM7UUFFRCxPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0lBRVMsZUFBZSxDQUFDLEtBQWM7UUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUE7UUFDWCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXJELE9BQU8sTUFBTTthQUNWLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQzthQUN4RSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUM1QixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDcEIsQ0FBQztJQUVTLG9CQUFvQixDQUM1QixXQUE0QztRQUU1QyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN2RCxPQUFPLFNBQVMsQ0FBQTtRQUNsQixDQUFDO1FBRUQsT0FBTyxXQUFXO2FBQ2YsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQ2xELE9BQU8sSUFBSSxDQUFBO1lBQ2IsQ0FBQztZQUVELE9BQU87Z0JBQ0wsSUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRO2dCQUN6QixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVksSUFBSSwwQkFBMEI7Z0JBQ25FLElBQUksRUFBRSxVQUFVLENBQUMsT0FBTzthQUN6QixDQUFBO1FBQ0gsQ0FBQyxDQUFDO2FBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBa0QsQ0FBQTtJQUNyRSxDQUFDO0lBRVMsU0FBUyxDQUFDLElBQVk7UUFDOUIsMEVBQTBFO1FBQzFFLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QixNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUE7UUFDeEIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2pCLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNmLEtBQUssR0FBRyxJQUFJLENBQUE7Z0JBQ1osR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNmLENBQUM7aUJBQU0sSUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMvQixLQUFLLEdBQUcsS0FBSyxDQUFBO1lBQ2YsQ0FBQztpQkFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDZCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ2pELENBQUM7SUFFRCxpQkFBaUI7UUFDZixPQUFPO1lBQ0wsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUNoQyxJQUFJLEVBQUUsS0FBSztTQUNaLENBQUE7SUFDSCxDQUFDOztBQWhjSCw4REFnY0k7QUEvYmMsb0NBQVUsR0FBRyxxQkFBcUIsQ0FBQTtBQStQbEQsZ0VBQWdFO0FBQ2hFLDZFQUE2RTtBQUNyRCxpREFBdUIsR0FBRztJQUNoRCxJQUFJO0lBQ0osVUFBVTtJQUNWLGtCQUFrQjtJQUNsQix1QkFBdUI7SUFDdkIsWUFBWTtJQUNaLGFBQWE7SUFDYixZQUFZO0lBQ1osY0FBYztDQUNmLENBQUEifQ==
import { AbstractNotificationProviderService } from "@medusajs/framework/utils";
import { Logger, Attachment, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types";
type PostalAuthType = "smtp-api";
interface PostalOptions {
    auth_type?: PostalAuthType;
    base_url?: string;
    api_key?: string;
    from: string;
}
type PostalApiData = Record<string, unknown>;
type PostalSendPayload = {
    to: string[];
    cc?: string[];
    bcc?: string[];
    from: string;
    reply_to?: string;
    subject: string;
    html_body?: string;
    plain_body?: string;
    tag?: string;
    headers?: Record<string, string>;
    attachments?: Array<{
        name: string;
        content_type: string;
        data: string;
    }>;
};
export declare class PostalNotificationService extends AbstractNotificationProviderService {
    static readonly identifier = "notification-postal";
    protected config_: {
        authType: PostalAuthType;
        baseUrl: string;
        apiKey: string;
        from: string;
    };
    protected logger_: Pick<Logger, "info">;
    constructor(container: {
        logger: Pick<Logger, "info">;
    }, options: PostalOptions);
    static validateOptions(options: Record<string, unknown>): void;
    send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO>;
    getMessageDetails(id: string | number): Promise<PostalApiData>;
    getMessageDeliveries(id: string | number): Promise<PostalApiData>;
    private sendViaApi;
    private fetchPostalApi;
    private resolveProviderData;
    private static readonly ALLOWED_HEADER_PREFIXES;
    private static isAllowedHeader;
    private filterHeaders;
    private static assertNoHeaderInjection;
    private buildSendPayload;
    private getFirstRecipientMessage;
    private normalizePostalLookupId;
    protected normalizeEmails(value: unknown): string[];
    protected normalizeAttachments(attachments: Attachment[] | null | undefined): PostalSendPayload["attachments"] | undefined;
    protected stripHtml(html: string): string;
    getHealthSnapshot(): {
        auth_type: "smtp-api";
        mode: string;
    };
}
export {};

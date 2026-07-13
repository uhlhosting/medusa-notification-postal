export type PostalWebhookStatus = "sent" | "delayed" | "failed" | "held" | "bounced" | "clicked" | "loaded" | "dns_error" | "unknown";
export type PostalWebhookRecord = {
    id: string;
    event_type: string;
    status: PostalWebhookStatus;
    message_id: string | null;
    recipient: string | null;
    occurred_at: string | null;
    payload: Record<string, unknown>;
    created_at?: string;
};
export declare const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:";
export type PostalWebhookEventService = {
    listPostalWebhookEvents: (filter?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<PostalWebhookRecord[]>;
    createPostalWebhookEvents: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>;
};
export declare const isPostalWebhookFromPlugin: (payload: Record<string, unknown>) => boolean;
export declare const isPostalSentWebhookFromPlugin: (payload: Record<string, unknown>) => boolean;
export declare const normalizePostalWebhookPayload: (payload: Record<string, unknown>) => PostalWebhookRecord;
export declare const recordPostalWebhookEvent: (service: PostalWebhookEventService | null | undefined, payload: Record<string, unknown>) => Promise<PostalWebhookRecord | null>;
export declare const listPostalWebhookEvents: (service: PostalWebhookEventService | null | undefined, limit?: number) => Promise<PostalWebhookRecord[]>;

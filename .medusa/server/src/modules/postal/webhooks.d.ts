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
export declare const isPostalWebhookFromPlugin: (payload: Record<string, unknown>) => boolean;
export declare const isPostalSentWebhookFromPlugin: (payload: Record<string, unknown>) => boolean;
export declare const normalizePostalWebhookPayload: (payload: Record<string, unknown>) => PostalWebhookRecord;
export declare const recordPostalWebhookEvent: (pgConnection: any, payload: Record<string, unknown>) => Promise<PostalWebhookRecord | null>;
export declare const listPostalWebhookEvents: (pgConnection: any, limit?: number) => Promise<PostalWebhookRecord[]>;

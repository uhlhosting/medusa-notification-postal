export type PostalWebhookPostHandlerInput = {
    scope: any;
    body?: Record<string, unknown>;
    validatedBody?: Record<string, unknown>;
    runWebhookWorkflow?: (payload: Record<string, unknown>) => Promise<{
        result: {
            id: string | null;
            event_type: string;
            status: string;
        } | null;
    }>;
};
export declare const handlePostalWebhookPost: (input: PostalWebhookPostHandlerInput) => Promise<{
    status: number;
    body: {
        ok: boolean;
        ignored: boolean;
        id?: undefined;
        event_type?: undefined;
        status?: undefined;
    };
} | {
    status: number;
    body: {
        ok: boolean;
        id: string | null;
        event_type: string;
        status: string;
        ignored?: undefined;
    };
}>;

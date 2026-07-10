export { POSTAL_PLUGIN_MODULE, POSTAL_SETTINGS_ID } from "./constants";
export type PostalAuthType = "smtp-api";
export type PostalSettingsInput = {
    auth_type?: PostalAuthType;
    from?: string;
    from_name?: string;
    reply_to?: string;
    base_url?: string;
    api_key?: string;
    test_to?: string;
    webhook_token?: string;
};
export type PostalSettingRecord = {
    id: string;
    auth_type: string;
    from_address: string;
    base_url: string;
    test_to: string;
    pending_restart: boolean;
};
export type PostalSettingService = {
    listPostalSettings: (filter: Record<string, unknown>, config?: Record<string, unknown>) => Promise<PostalSettingRecord[]>;
    createPostalSettings: (data: Record<string, unknown>) => Promise<unknown>;
    updatePostalSettings: (data: Record<string, unknown>) => Promise<unknown>;
};
export type PostalSettings = PostalSettingsSnapshot;
export type PostalSettingsSnapshot = {
    provider_id: "postal";
    auth_type: PostalAuthType;
    from: string | null;
    base_url: string | null;
    api_key: string;
    test_to: string | null;
    webhook_token: string;
    configured: {
        from: boolean;
        api_key: boolean;
        base_url: boolean;
        webhook_token: boolean;
    };
    secret_hints: {
        api_key_masked: string | null;
        webhook_token_masked: string | null;
    };
};
export declare const toPublicPostalSettings: (settings: PostalSettingsSnapshot) => {
    api_key: string;
    webhook_token: string;
    provider_id: "postal";
    auth_type: PostalAuthType;
    from: string | null;
    base_url: string | null;
    test_to: string | null;
    configured: {
        from: boolean;
        api_key: boolean;
        base_url: boolean;
        webhook_token: boolean;
    };
    secret_hints: {
        api_key_masked: string | null;
        webhook_token_masked: string | null;
    };
};
export declare const getPostalSettings: (service: PostalSettingService | null | undefined) => Promise<PostalSettingsSnapshot>;
export declare const persistPostalSettings: (service: PostalSettingService | null | undefined, payload: PostalSettingsInput) => Promise<PostalSettingsSnapshot>;
export declare const validateModeRequirements: (settings: PostalSettingsSnapshot) => "POSTAL_FROM is required" | "POSTAL_BASE_URL is required for API mode" | "POSTAL_API_KEY is required for API mode" | null;

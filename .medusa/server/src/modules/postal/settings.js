"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateModeRequirements = exports.persistPostalSettings = exports.getPostalSettings = exports.toPublicPostalSettings = exports.POSTAL_SETTINGS_ID = exports.POSTAL_PLUGIN_MODULE = void 0;
const constants_1 = require("./constants");
var constants_2 = require("./constants");
Object.defineProperty(exports, "POSTAL_PLUGIN_MODULE", { enumerable: true, get: function () { return constants_2.POSTAL_PLUGIN_MODULE; } });
Object.defineProperty(exports, "POSTAL_SETTINGS_ID", { enumerable: true, get: function () { return constants_2.POSTAL_SETTINGS_ID; } });
const sanitizeValue = (value) => typeof value === "string" ? value.trim() : "";
const maskSecret = (value) => {
    const secret = sanitizeValue(value);
    if (!secret) {
        return null;
    }
    const visibleTail = secret.slice(-4);
    return `${"*".repeat(Math.max(8, secret.length - 4))}${visibleTail}`;
};
const buildSnapshot = (values) => ({
    provider_id: "postal",
    auth_type: values.auth_type,
    from: values.from || null,
    base_url: values.base_url || null,
    api_key: values.api_key || "",
    test_to: values.test_to || null,
    webhook_token: values.webhook_token || "",
    configured: {
        from: Boolean(values.from),
        api_key: Boolean(values.api_key),
        base_url: Boolean(values.base_url),
        webhook_token: Boolean(values.webhook_token),
    },
    secret_hints: {
        api_key_masked: maskSecret(values.api_key),
        webhook_token_masked: maskSecret(values.webhook_token),
    },
});
const toPublicPostalSettings = (settings) => ({
    ...settings,
    api_key: "",
    webhook_token: "",
});
exports.toPublicPostalSettings = toPublicPostalSettings;
const readSettingRecord = async (service) => {
    if (!service?.listPostalSettings) {
        return undefined;
    }
    try {
        const rows = await service.listPostalSettings({ id: constants_1.POSTAL_SETTINGS_ID }, { take: 1 });
        return rows?.[0];
    }
    catch {
        // Fall back to environment-only configuration.
        return undefined;
    }
};
// Secrets come from the environment only; non-secret values come from the
// persisted row when present, otherwise from the environment.
const getPostalSettings = async (service) => {
    const record = await readSettingRecord(service);
    return buildSnapshot({
        auth_type: "smtp-api",
        from: record?.from_address || process.env.POSTAL_FROM || "",
        base_url: record?.base_url || process.env.POSTAL_BASE_URL || "",
        test_to: record?.test_to || process.env.POSTAL_TEST_TO || "",
        api_key: process.env.POSTAL_API_KEY || "",
        webhook_token: process.env.POSTAL_WEBHOOK_TOKEN || "",
    });
};
exports.getPostalSettings = getPostalSettings;
// Persists non-secret settings via the module service. Secret fields in the
// payload are ignored — secrets are managed through the environment only.
const persistPostalSettings = async (service, payload) => {
    const current = await (0, exports.getPostalSettings)(service);
    const next = {
        auth_type: "smtp-api",
        from_address: sanitizeValue(payload.from) || current.from || "",
        base_url: sanitizeValue(payload.base_url) || current.base_url || "",
        test_to: sanitizeValue(payload.test_to) || current.test_to || "",
        pending_restart: true,
    };
    if (service?.listPostalSettings) {
        const existing = await readSettingRecord(service);
        if (existing) {
            await service.updatePostalSettings({ id: constants_1.POSTAL_SETTINGS_ID, ...next });
        }
        else {
            await service.createPostalSettings({ id: constants_1.POSTAL_SETTINGS_ID, ...next });
        }
    }
    return (0, exports.getPostalSettings)(service);
};
exports.persistPostalSettings = persistPostalSettings;
const validateModeRequirements = (settings) => {
    if (!settings.from) {
        return "POSTAL_FROM is required";
    }
    switch (settings.auth_type) {
        case "smtp-api":
            if (!settings.base_url)
                return "POSTAL_BASE_URL is required for API mode";
            if (!settings.configured.api_key)
                return "POSTAL_API_KEY is required for API mode";
            break;
    }
    return null;
};
exports.validateModeRequirements = validateModeRequirements;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQWdEO0FBRWhELHlDQUFzRTtBQUE3RCxpSEFBQSxvQkFBb0IsT0FBQTtBQUFFLCtHQUFBLGtCQUFrQixPQUFBO0FBMERqRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFLENBQ3ZDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7QUFFL0MsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFxQixFQUFFLEVBQUU7SUFDM0MsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ25DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNwQyxPQUFPLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUE7QUFDdEUsQ0FBQyxDQUFBO0FBV0QsTUFBTSxhQUFhLEdBQUcsQ0FDcEIsTUFBNkIsRUFDTCxFQUFFLENBQUMsQ0FBQztJQUM1QixXQUFXLEVBQUUsUUFBUTtJQUNyQixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7SUFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtJQUN6QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsSUFBSSxJQUFJO0lBQ2pDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJ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
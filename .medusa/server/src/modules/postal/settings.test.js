"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_process_1 = require("node:process");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = require("node:os");
const node_url_1 = require("node:url");
const settings_1 = require("./settings");
(0, node_test_1.default)("normalizeSettings fills configuration and masks secrets", () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const settings = (0, settings_1.normalizeSettings)({
        POSTAL_AUTH_TYPE: "smtp-api",
        POSTAL_FROM: "  Postal <no-reply@example.com>  ",
        POSTAL_BASE_URL: "https://postal.example.test",
        POSTAL_API_KEY: `  ${apiKeyValue}  `,
        POSTAL_TEST_TO: "ops@example.com",
        POSTAL_WEBHOOK_TOKEN: webhookTokenValue,
    });
    strict_1.default.equal(settings.provider_id, "postal");
    strict_1.default.equal(settings.auth_type, "smtp-api");
    strict_1.default.equal(settings.from, "  Postal <no-reply@example.com>  ");
    strict_1.default.equal(settings.base_url, "https://postal.example.test");
    strict_1.default.equal(settings.api_key, `  ${apiKeyValue}  `);
    strict_1.default.equal(settings.test_to, "ops@example.com");
    strict_1.default.equal(settings.webhook_token, webhookTokenValue);
    strict_1.default.equal(settings.configured.from, true);
    strict_1.default.equal(settings.configured.api_key, true);
    strict_1.default.equal(settings.configured.base_url, true);
    strict_1.default.equal(settings.configured.webhook_token, true);
    strict_1.default.match(settings.secret_hints.api_key_masked ?? "", new RegExp(`^\\*+${apiKeyValue.slice(-4)}$`));
    strict_1.default.match(settings.secret_hints.webhook_token_masked ?? "", new RegExp(`^\\*+${webhookTokenValue.slice(-4)}$`));
});
(0, node_test_1.default)("toPublicPostalSettings strips secrets from the snapshot", () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const publicSettings = (0, settings_1.toPublicPostalSettings)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: "Postal <no-reply@example.com>",
        base_url: "https://postal.example.test",
        api_key: apiKeyValue,
        test_to: null,
        webhook_token: webhookTokenValue,
        configured: {
            from: true,
            api_key: true,
            base_url: true,
            webhook_token: true,
        },
        secret_hints: {
            api_key_masked: "********key",
            webhook_token_masked: "********oken",
        },
    });
    strict_1.default.equal(publicSettings.api_key, "");
    strict_1.default.equal(publicSettings.webhook_token, "");
    strict_1.default.equal(publicSettings.from, "Postal <no-reply@example.com>");
});
(0, node_test_1.default)("validateModeRequirements enforces API mode configuration", () => {
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: null,
        base_url: null,
        api_key: "",
        test_to: null,
        webhook_token: "",
        configured: {
            from: false,
            api_key: false,
            base_url: false,
            webhook_token: false,
        },
        secret_hints: {
            api_key_masked: null,
            webhook_token_masked: null,
        },
    }), "POSTAL_FROM is required");
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: "Postal <no-reply@example.com>",
        base_url: null,
        api_key: "",
        test_to: null,
        webhook_token: "",
        configured: {
            from: true,
            api_key: false,
            base_url: false,
            webhook_token: false,
        },
        secret_hints: {
            api_key_masked: null,
            webhook_token_masked: null,
        },
    }), "POSTAL_BASE_URL is required for API mode");
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: "Postal <no-reply@example.com>",
        base_url: "https://postal.example.test",
        api_key: "",
        test_to: null,
        webhook_token: "",
        configured: {
            from: true,
            api_key: false,
            base_url: true,
            webhook_token: false,
        },
        secret_hints: {
            api_key_masked: null,
            webhook_token_masked: null,
        },
    }), "POSTAL_API_KEY is required for API mode");
});
(0, node_test_1.default)("validateModeRequirements allows complete API settings", () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: "Postal <no-reply@example.com>",
        base_url: "https://postal.example.test",
        api_key: apiKeyValue,
        test_to: null,
        webhook_token: webhookTokenValue,
        configured: {
            from: true,
            api_key: true,
            base_url: true,
            webhook_token: true,
        },
        secret_hints: {
            api_key_masked: null,
            webhook_token_masked: null,
        },
    }), null);
});
(0, node_test_1.default)("validateModeRequirements ignores unsupported auth modes", () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "webhook",
        from: "Postal <no-reply@example.com>",
        base_url: "https://postal.example.test",
        api_key: apiKeyValue,
        test_to: null,
        webhook_token: webhookTokenValue,
        configured: {
            from: true,
            api_key: true,
            base_url: true,
            webhook_token: true,
        },
        secret_hints: {
            api_key_masked: null,
            webhook_token_masked: null,
        },
    }), null);
});
(0, node_test_1.default)("normalizeSettings falls back to default auth type and nullish fields", () => {
    const settings = (0, settings_1.normalizeSettings)({});
    strict_1.default.equal(settings.auth_type, "smtp-api");
    strict_1.default.equal(settings.from, null);
    strict_1.default.equal(settings.base_url, null);
    strict_1.default.equal(settings.api_key, "");
    strict_1.default.equal(settings.test_to, null);
    strict_1.default.equal(settings.webhook_token, "");
    strict_1.default.equal(settings.secret_hints.api_key_masked, null);
    strict_1.default.equal(settings.secret_hints.webhook_token_masked, null);
});
(0, node_test_1.default)("getPostalSettings and persistPostalSettings merge env and db state", async () => {
    const savedApiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const savedWebhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-merge-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        'POSTAL_AUTH_TYPE="smtp-api"',
        'POSTAL_FROM=Env Postal <env@example.com>',
        "POSTAL_BASE_URL=https://postal.env.example.test",
        "POSTAL_API_KEY=env-key",
        "POSTAL_TEST_TO=env-test@example.com",
        "POSTAL_WEBHOOK_TOKEN=env-token",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?merge=env`);
        const pgState = { value: null };
        const rawCalls = [];
        const pgConnection = {
            raw: async (sql, params) => {
                rawCalls.push({ sql, params });
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return { rows: [{ value: pgState.value }] };
                }
                if (sql.includes("INSERT INTO admin_plugin_settings")) {
                    const value = params?.[1];
                    pgState.value = typeof value === "string" ? JSON.parse(value) : null;
                }
                return { rows: [] };
            },
        };
        const initial = await settings.getPostalSettings(pgConnection);
        strict_1.default.equal(initial.from, "Env Postal <env@example.com>");
        strict_1.default.equal(initial.base_url, "https://postal.env.example.test");
        strict_1.default.equal(initial.api_key, "env-key");
        strict_1.default.equal(initial.webhook_token, "env-token");
        await settings.persistPostalSettings(pgConnection, {
            from: "Saved Postal <saved@example.com>",
            base_url: "https://postal.saved.example.test",
            api_key: savedApiKeyValue,
            test_to: "saved-test@example.com",
            webhook_token: savedWebhookTokenValue,
        });
        const updated = await settings.getPostalSettings(pgConnection);
        strict_1.default.equal(updated.from, "Saved Postal <saved@example.com>");
        strict_1.default.equal(updated.base_url, "https://postal.saved.example.test");
        strict_1.default.equal(updated.api_key, savedApiKeyValue);
        strict_1.default.equal(updated.webhook_token, savedWebhookTokenValue);
        strict_1.default.ok(rawCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC9zZXR0aW5ncy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyw2Q0FBd0M7QUFDeEMsK0NBQXlDO0FBQ3pDLHFDQUF1RTtBQUN2RSwwREFBNEI7QUFDNUIscUNBQWdDO0FBQ2hDLHVDQUF3QztBQUN4Qyx5Q0FJbUI7QUFFbkIsSUFBQSxtQkFBSSxFQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtJQUNuRSxNQUFNLFdBQVcsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFckUsTUFBTSxRQUFRLEdBQUcsSUFBQSw0QkFBaUIsRUFBQztRQUNqQyxnQkFBZ0IsRUFBRSxVQUFVO1FBQzVCLFdBQVcsRUFBRSxtQ0FBbUM7UUFDaEQsZUFBZSxFQUFFLDZCQUE2QjtRQUM5QyxjQUFjLEVBQUUsS0FBSyxXQUFXLElBQUk7UUFDcEMsY0FBYyxFQUFFLGlCQUFpQjtRQUNqQyxvQkFBb0IsRUFBRSxpQkFBaUI7S0FDeEMsQ0FBQyxDQUFBO0lBRUYsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM1QyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQzVDLGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJ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
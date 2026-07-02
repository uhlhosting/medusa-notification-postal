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
        POSTAL_FROM: "  Postal <no-reply@uhlhosting.ch>  ",
        POSTAL_BASE_URL: "https://postal.example.test",
        POSTAL_API_KEY: `  ${apiKeyValue}  `,
        POSTAL_TEST_TO: "ops@uhlhosting.ch",
        POSTAL_WEBHOOK_TOKEN: "webhook-token-1234",
    });
    strict_1.default.equal(settings.provider_id, "postal");
    strict_1.default.equal(settings.auth_type, "smtp-api");
    strict_1.default.equal(settings.from, "  Postal <no-reply@uhlhosting.ch>  ");
    strict_1.default.equal(settings.base_url, "https://postal.example.test");
    strict_1.default.equal(settings.api_key, `  ${apiKeyValue}  `);
    strict_1.default.equal(settings.test_to, "ops@uhlhosting.ch");
    strict_1.default.equal(settings.webhook_token, "webhook-token-1234");
    strict_1.default.equal(settings.configured.from, true);
    strict_1.default.equal(settings.configured.api_key, true);
    strict_1.default.equal(settings.configured.base_url, true);
    strict_1.default.equal(settings.configured.webhook_token, true);
    strict_1.default.match(settings.secret_hints.api_key_masked ?? "", new RegExp(`^\\*+${apiKeyValue.slice(-4)}$`));
    strict_1.default.match(settings.secret_hints.webhook_token_masked ?? "", /^\*+1234$/);
});
(0, node_test_1.default)("toPublicPostalSettings strips secrets from the snapshot", () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const publicSettings = (0, settings_1.toPublicPostalSettings)({
        provider_id: "postal",
        auth_type: "smtp-api",
        from: "Postal <no-reply@uhlhosting.ch>",
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
    strict_1.default.equal(publicSettings.from, "Postal <no-reply@uhlhosting.ch>");
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
        from: "Postal <no-reply@uhlhosting.ch>",
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
        from: "Postal <no-reply@uhlhosting.ch>",
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
        from: "Postal <no-reply@uhlhosting.ch>",
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
    strict_1.default.equal((0, settings_1.validateModeRequirements)({
        provider_id: "postal",
        auth_type: "webhook",
        from: "Postal <no-reply@uhlhosting.ch>",
        base_url: "https://postal.example.test",
        api_key: "api-key-1234",
        test_to: null,
        webhook_token: "webhook-token-1234",
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
        'POSTAL_FROM=Env Postal <env@uhlhosting.ch>',
        "POSTAL_BASE_URL=https://postal.env.example.test",
        "POSTAL_API_KEY=env-key",
        "POSTAL_TEST_TO=env-test@uhlhosting.ch",
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
        strict_1.default.equal(initial.from, "Env Postal <env@uhlhosting.ch>");
        strict_1.default.equal(initial.base_url, "https://postal.env.example.test");
        strict_1.default.equal(initial.api_key, "env-key");
        strict_1.default.equal(initial.webhook_token, "env-token");
        await settings.persistPostalSettings(pgConnection, {
            from: "Saved Postal <saved@uhlhosting.ch>",
            base_url: "https://postal.saved.example.test",
            api_key: savedApiKeyValue,
            test_to: "saved-test@uhlhosting.ch",
            webhook_token: savedWebhookTokenValue,
        });
        const updated = await settings.getPostalSettings(pgConnection);
        strict_1.default.equal(updated.from, "Saved Postal <saved@uhlhosting.ch>");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC9zZXR0aW5ncy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyw2Q0FBd0M7QUFDeEMsK0NBQXlDO0FBQ3pDLHFDQUF1RTtBQUN2RSwwREFBNEI7QUFDNUIscUNBQWdDO0FBQ2hDLHVDQUF3QztBQUN4Qyx5Q0FJbUI7QUFFbkIsSUFBQSxtQkFBSSxFQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtJQUNuRSxNQUFNLFdBQVcsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFckUsTUFBTSxRQUFRLEdBQUcsSUFBQSw0QkFBaUIsRUFBQztRQUNqQyxnQkFBZ0IsRUFBRSxVQUFVO1FBQzVCLFdBQVcsRUFBRSxxQ0FBcUM7UUFDbEQsZUFBZSxFQUFFLDZCQUE2QjtRQUM5QyxjQUFjLEVBQUUsS0FBSyxXQUFXLElBQUk7UUFDcEMsY0FBYyxFQUFFLG1CQUFtQjtRQUNuQyxvQkFBb0IsRUFBRSxvQkFBb0I7S0FDM0MsQ0FBQyxDQUFBO0lBRUYsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM1QyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQzVDLGdCQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJ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
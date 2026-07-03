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
(0, node_test_1.default)("postal settings reads and writes the backend env file", async () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const newApiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const newWebhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    const envPath = node_path_1.default.join(backendDir, ".env");
    (0, node_fs_1.writeFileSync)(envPath, [
        "# postal settings",
        'POSTAL_AUTH_TYPE="smtp-api"',
        "POSTAL_FROM=Postal <no-reply@example.com>",
        'POSTAL_BASE_URL="https://postal.example.test"',
        `POSTAL_API_KEY=${apiKeyValue}`,
        "POSTAL_TEST_TO=ops@example.com",
        `POSTAL_WEBHOOK_TOKEN=${webhookTokenValue}`,
        "INVALID_LINE",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=env`);
        const pgCalls = [];
        let storedDbValue = {
            POSTAL_FROM: "Db Postal <db@example.com>",
        };
        const pgConnection = {
            raw: async (sql, params) => {
                pgCalls.push({ sql, params });
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return {
                        rows: [
                            {
                                value: storedDbValue,
                            },
                        ],
                    };
                }
                if (sql.includes("INSERT INTO admin_plugin_settings")) {
                    const rawValue = params?.[1];
                    storedDbValue =
                        typeof rawValue === "string" ? JSON.parse(rawValue) : storedDbValue;
                }
                return { rows: [] };
            },
        };
        const snapshot = await settings.getPostalSettings(pgConnection);
        strict_1.default.equal(snapshot.from, "Db Postal <db@example.com>");
        strict_1.default.equal(snapshot.base_url, "https://postal.example.test");
        strict_1.default.equal(snapshot.api_key, apiKeyValue);
        strict_1.default.equal(snapshot.webhook_token, webhookTokenValue);
        const persisted = await settings.persistPostalSettings(pgConnection, {
            from: "Postal <admin@example.com>",
            base_url: "https://postal.example.test",
            api_key: newApiKeyValue,
            test_to: "test@example.com",
            webhook_token: newWebhookTokenValue,
        });
        strict_1.default.equal(persisted.from, "Postal <admin@example.com>");
        strict_1.default.equal(persisted.api_key, newApiKeyValue);
        strict_1.default.equal(persisted.webhook_token, newWebhookTokenValue);
        strict_1.default.ok(pgCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")));
        const writtenEnv = (0, node_fs_1.readFileSync)(envPath, "utf8");
        strict_1.default.match(writtenEnv, /POSTAL_FROM="Postal <admin@example\.com>"/);
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_API_KEY=${newApiKeyValue}`));
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_WEBHOOK_TOKEN=${newWebhookTokenValue}`));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings preserves unrelated env entries when persisting updates", async () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-preserve-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    const envPath = node_path_1.default.join(backendDir, ".env");
    (0, node_fs_1.writeFileSync)(envPath, [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Postal <ops@example.com>",
        "POSTAL_BASE_URL=https://postal.example.test",
        "POSTAL_API_KEY=existing-key",
        "POSTAL_WEBHOOK_TOKEN=existing-token",
        "OTHER_SETTING=keep-me",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=preserve-env`);
        await settings.persistPostalSettings({
            raw: async (sql) => {
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return { rows: [] };
                }
                return { rows: [] };
            },
        }, {
            from: "Postal <ops@example.com>",
            base_url: "https://postal.example.test",
            api_key: apiKeyValue,
            test_to: "test@example.com",
            webhook_token: webhookTokenValue,
        });
        const writtenEnv = (0, node_fs_1.readFileSync)(envPath, "utf8");
        strict_1.default.match(writtenEnv, /OTHER_SETTING=keep-me/);
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_API_KEY=${apiKeyValue}`));
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_WEBHOOK_TOKEN=${webhookTokenValue}`));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings keeps malformed quoted env values as raw text", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-quoted-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        'POSTAL_AUTH_TYPE="smtp-api"',
        'POSTAL_API_KEY="bad\\q"',
        'POSTAL_WEBHOOK_TOKEN="token_quoted"',
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=quoted`);
        const snapshot = await settings.getPostalSettings(undefined);
        strict_1.default.equal(snapshot.api_key, '"bad\\q"');
        strict_1.default.equal(snapshot.webhook_token, "token_quoted");
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings ignores malformed env assignments with missing keys", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-malformed-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        " =orphaned-value",
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Malformed Postal <malformed@example.com>",
        "POSTAL_BASE_URL=https://postal.malformed.example.test",
        "POSTAL_API_KEY=malformed-key",
        "POSTAL_WEBHOOK_TOKEN=malformed-token",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=malformed-env`);
        const snapshot = await settings.getPostalSettings(undefined);
        strict_1.default.equal(snapshot.from, "Malformed Postal <malformed@example.com>");
        strict_1.default.equal(snapshot.api_key, "malformed-key");
        strict_1.default.equal(snapshot.webhook_token, "malformed-token");
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings resolves the env file when already inside apps/backend", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-root-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Backend Postal <backend@example.com>",
        "POSTAL_BASE_URL=https://postal.backend.example.test",
        "POSTAL_API_KEY=backend-key",
        "POSTAL_WEBHOOK_TOKEN=backend-token",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(backendDir);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=backend-root`);
        const snapshot = await settings.getPostalSettings(undefined);
        strict_1.default.equal(snapshot.from, "Backend Postal <backend@example.com>");
        strict_1.default.equal(snapshot.base_url, "https://postal.backend.example.test");
        strict_1.default.equal(snapshot.api_key, "backend-key");
        strict_1.default.equal(snapshot.webhook_token, "backend-token");
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings generates a webhook token when one is missing", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const previousWebhookToken = process.env.POSTAL_WEBHOOK_TOKEN;
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-generate-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Postal <ops@example.com>",
        "POSTAL_BASE_URL=https://postal.example.test",
        "POSTAL_API_KEY=existing-key",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    delete process.env.POSTAL_WEBHOOK_TOKEN;
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=generate-token`);
        const persisted = await settings.persistPostalSettings({
            raw: async (sql) => {
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return { rows: [] };
                }
                return { rows: [] };
            },
        }, {
            from: "Postal <ops@example.com>",
            base_url: "https://postal.example.test",
            api_key: "",
            test_to: "ops@example.com",
        });
        strict_1.default.equal(persisted.from, "Postal <ops@example.com>");
        strict_1.default.equal(persisted.api_key, "existing-key");
        strict_1.default.match(persisted.webhook_token, /^[a-f0-9]{64}$/);
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        if (previousWebhookToken === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previousWebhookToken;
        }
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings falls back to process.env when no env file values exist", async () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const previousCwd = (0, node_process_1.cwd)();
    const previousEnv = {
        POSTAL_AUTH_TYPE: process.env.POSTAL_AUTH_TYPE,
        POSTAL_FROM: process.env.POSTAL_FROM,
        POSTAL_BASE_URL: process.env.POSTAL_BASE_URL,
        POSTAL_API_KEY: process.env.POSTAL_API_KEY,
        POSTAL_WEBHOOK_TOKEN: process.env.POSTAL_WEBHOOK_TOKEN,
    };
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-process-env-"));
    (0, node_fs_1.mkdirSync)(node_path_1.default.join(tempRoot, "apps", "backend"), { recursive: true });
    process.env.POSTAL_AUTH_TYPE = "smtp-api";
    process.env.POSTAL_FROM = "Process Env <env@example.com>";
    process.env.POSTAL_BASE_URL = "https://postal.process.example.test";
    process.env.POSTAL_API_KEY = apiKeyValue;
    process.env.POSTAL_WEBHOOK_TOKEN = webhookTokenValue;
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=process-env`);
        const snapshot = await settings.getPostalSettings(undefined);
        strict_1.default.equal(snapshot.from, "Process Env <env@example.com>");
        strict_1.default.equal(snapshot.base_url, "https://postal.process.example.test");
        strict_1.default.equal(snapshot.api_key, apiKeyValue);
        strict_1.default.equal(snapshot.webhook_token, webhookTokenValue);
    }
    finally {
        (0, node_process_1.chdir)(previousCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = value;
            }
        }
    }
});
(0, node_test_1.default)("postal settings cleans up when writing the env file fails", async () => {
    const previousCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-write-fail-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.mkdirSync)(node_path_1.default.join(backendDir, ".env.tmp"));
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Postal <ops@example.com>",
        "POSTAL_BASE_URL=https://postal.example.test",
        "POSTAL_API_KEY=existing-key",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=write-fail`);
        await strict_1.default.rejects(() => settings.persistPostalSettings({
            raw: async (sql) => {
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return { rows: [] };
                }
                return { rows: [] };
            },
        }, {
            from: "Postal <ops@example.com>",
            base_url: "https://postal.example.test",
            api_key: "new-key",
            test_to: "ops@example.com",
            webhook_token: "token-new",
        }), /EISDIR|illegal operation on a directory/i);
    }
    finally {
        (0, node_process_1.chdir)(previousCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings can persist without a database connection", async () => {
    const previousCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-no-db-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Postal <ops@example.com>",
        "POSTAL_BASE_URL=https://postal.example.test",
        "POSTAL_API_KEY=existing-key",
        "POSTAL_WEBHOOK_TOKEN=existing-token",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=no-db`);
        const persisted = await settings.persistPostalSettings(undefined, {
            from: "Postal <new@example.com>",
            base_url: "https://postal.example.test",
            api_key: "new-key",
            test_to: "ops@example.com",
            webhook_token: "new-token",
        });
        strict_1.default.equal(persisted.from, "Postal <new@example.com>");
        strict_1.default.equal(persisted.api_key, "new-key");
        strict_1.default.equal(persisted.webhook_token, "new-token");
    }
    finally {
        (0, node_process_1.chdir)(previousCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings falls back cleanly when the database read fails", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-db-fallback-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(backendDir, ".env"), [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Fallback Postal <fallback@example.com>",
        "POSTAL_BASE_URL=https://postal.fallback.example.test",
        "POSTAL_API_KEY=fallback-key",
        "POSTAL_WEBHOOK_TOKEN=fallback-token",
        "",
    ].join("\n"), "utf8");
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?db-fallback`);
        const snapshot = await settings.getPostalSettings({
            raw: async () => {
                throw new Error("db unavailable");
            },
        });
        strict_1.default.equal(snapshot.from, "Fallback Postal <fallback@example.com>");
        strict_1.default.equal(snapshot.api_key, "fallback-key");
        strict_1.default.equal(snapshot.webhook_token, "fallback-token");
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings can persist when the env file does not exist yet", async () => {
    const apiKeyValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const webhookTokenValue = (0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 12);
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-create-env-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=create-env`);
        const persisted = await settings.persistPostalSettings({
            raw: async (sql) => {
                if (sql.includes("SELECT value FROM admin_plugin_settings")) {
                    return { rows: [] };
                }
                return { rows: [] };
            },
        }, {
            from: "Postal <ops@example.com>",
            base_url: "https://postal.example.test",
            api_key: apiKeyValue,
            test_to: "ops@example.com",
            webhook_token: webhookTokenValue,
        });
        strict_1.default.equal(persisted.api_key, apiKeyValue);
        strict_1.default.equal(persisted.webhook_token, webhookTokenValue);
        strict_1.default.ok((0, node_fs_1.readFileSync)(node_path_1.default.join(backendDir, ".env"), "utf8").includes("POSTAL_FROM"));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtZW52LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvc2V0dGluZ3MtZW52LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLDZDQUF3QztBQUN4QywrQ0FBeUM7QUFDekMscUNBQXFGO0FBQ3JGLDBEQUE0QjtBQUM1QixxQ0FBZ0M7QUFDaEMsdUNBQXdDO0FBRXhDLElBQUEsbUJBQUksRUFBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtJQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDckUsTUFBTSxjQUFjLEdBQUcsSUFBQSx3QkFBVSxHQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ2xFLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSx3QkFBVSxHQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3hFLE1BQU0sV0FBVyxHQUFHLElBQUEsa0JBQUcsR0FBRSxDQUFBO0lBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUEscUJBQVcsRUFBQyxtQkFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFNLEdBQUUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENB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
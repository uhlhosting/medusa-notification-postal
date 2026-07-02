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
        "POSTAL_FROM=Postal <no-reply@uhlhosting.ch>",
        'POSTAL_BASE_URL="https://postal.example.test"',
        `POSTAL_API_KEY=${apiKeyValue}`,
        "POSTAL_TEST_TO=ops@uhlhosting.ch",
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
            POSTAL_FROM: "Db Postal <db@uhlhosting.ch>",
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
        strict_1.default.equal(snapshot.from, "Db Postal <db@uhlhosting.ch>");
        strict_1.default.equal(snapshot.base_url, "https://postal.example.test");
        strict_1.default.equal(snapshot.api_key, apiKeyValue);
        strict_1.default.equal(snapshot.webhook_token, webhookTokenValue);
        const persisted = await settings.persistPostalSettings(pgConnection, {
            from: "Postal <admin@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: newApiKeyValue,
            test_to: "test@uhlhosting.ch",
            webhook_token: newWebhookTokenValue,
        });
        strict_1.default.equal(persisted.from, "Postal <admin@uhlhosting.ch>");
        strict_1.default.equal(persisted.api_key, newApiKeyValue);
        strict_1.default.equal(persisted.webhook_token, newWebhookTokenValue);
        strict_1.default.ok(pgCalls.some((call) => call.sql.includes("INSERT INTO admin_plugin_settings")));
        const writtenEnv = (0, node_fs_1.readFileSync)(envPath, "utf8");
        strict_1.default.match(writtenEnv, /POSTAL_FROM="Postal <admin@uhlhosting\.ch>"/);
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_API_KEY=${newApiKeyValue}`));
        strict_1.default.match(writtenEnv, new RegExp(`POSTAL_WEBHOOK_TOKEN=${newWebhookTokenValue}`));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings preserves unrelated env entries when persisting updates", async () => {
    const originalCwd = (0, node_process_1.cwd)();
    const tempRoot = (0, node_fs_1.mkdtempSync)(node_path_1.default.join((0, node_os_1.tmpdir)(), "postal-settings-preserve-"));
    const backendDir = node_path_1.default.join(tempRoot, "apps", "backend");
    (0, node_fs_1.mkdirSync)(backendDir, { recursive: true });
    const envPath = node_path_1.default.join(backendDir, ".env");
    (0, node_fs_1.writeFileSync)(envPath, [
        "POSTAL_AUTH_TYPE=smtp-api",
        "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
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
            from: "Postal <ops@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: "updated-key",
            test_to: "test@uhlhosting.ch",
            webhook_token: "updated-token",
        });
        const writtenEnv = (0, node_fs_1.readFileSync)(envPath, "utf8");
        strict_1.default.match(writtenEnv, /OTHER_SETTING=keep-me/);
        strict_1.default.match(writtenEnv, /POSTAL_API_KEY=updated-key/);
        strict_1.default.match(writtenEnv, /POSTAL_WEBHOOK_TOKEN=updated-token/);
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
        "POSTAL_FROM=Malformed Postal <malformed@uhlhosting.ch>",
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
        strict_1.default.equal(snapshot.from, "Malformed Postal <malformed@uhlhosting.ch>");
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
        "POSTAL_FROM=Backend Postal <backend@uhlhosting.ch>",
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
        strict_1.default.equal(snapshot.from, "Backend Postal <backend@uhlhosting.ch>");
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
        "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
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
            from: "Postal <ops@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: "",
            test_to: "ops@example.com",
        });
        strict_1.default.equal(persisted.from, "Postal <ops@uhlhosting.ch>");
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
    process.env.POSTAL_FROM = "Process Env <env@uhlhosting.ch>";
    process.env.POSTAL_BASE_URL = "https://postal.process.example.test";
    process.env.POSTAL_API_KEY = "process-key";
    process.env.POSTAL_WEBHOOK_TOKEN = "process-token";
    (0, node_process_1.chdir)(tempRoot);
    try {
        const moduleUrl = (0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "settings.js"));
        const settings = await import(`${moduleUrl.href}?case=process-env`);
        const snapshot = await settings.getPostalSettings(undefined);
        strict_1.default.equal(snapshot.from, "Process Env <env@uhlhosting.ch>");
        strict_1.default.equal(snapshot.base_url, "https://postal.process.example.test");
        strict_1.default.equal(snapshot.api_key, "process-key");
        strict_1.default.equal(snapshot.webhook_token, "process-token");
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
        "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
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
            from: "Postal <ops@uhlhosting.ch>",
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
        "POSTAL_FROM=Postal <ops@uhlhosting.ch>",
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
            from: "Postal <new@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: "new-key",
            test_to: "ops@example.com",
            webhook_token: "new-token",
        });
        strict_1.default.equal(persisted.from, "Postal <new@uhlhosting.ch>");
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
        "POSTAL_FROM=Fallback Postal <fallback@uhlhosting.ch>",
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
        strict_1.default.equal(snapshot.from, "Fallback Postal <fallback@uhlhosting.ch>");
        strict_1.default.equal(snapshot.api_key, "fallback-key");
        strict_1.default.equal(snapshot.webhook_token, "fallback-token");
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)("postal settings can persist when the env file does not exist yet", async () => {
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
            from: "Postal <ops@uhlhosting.ch>",
            base_url: "https://postal.example.test",
            api_key: "created-key",
            test_to: "ops@example.com",
            webhook_token: "created-token",
        });
        strict_1.default.equal(persisted.api_key, "created-key");
        strict_1.default.equal(persisted.webhook_token, "created-token");
        strict_1.default.ok((0, node_fs_1.readFileSync)(node_path_1.default.join(backendDir, ".env"), "utf8").includes("POSTAL_FROM"));
    }
    finally {
        (0, node_process_1.chdir)(originalCwd);
        (0, node_fs_1.rmSync)(tempRoot, { recursive: true, force: true });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtZW52LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvc2V0dGluZ3MtZW52LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLDZDQUF3QztBQUN4QywrQ0FBeUM7QUFDekMscUNBQXFGO0FBQ3JGLDBEQUE0QjtBQUM1QixxQ0FBZ0M7QUFDaEMsdUNBQXdDO0FBRXhDLElBQUEsbUJBQUksRUFBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtJQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLHdCQUFVLEdBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDckUsTUFBTSxjQUFjLEdBQUcsSUFBQSx3QkFBVSxHQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ2xFLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSx3QkFBVSxHQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3hFLE1BQU0sV0FBVyxHQUFHLElBQUEsa0JBQUcsR0FBRSxDQUFBO0lBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUEscUJBQVcsRUFBQyxtQkFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFNLEdBQUUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENB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
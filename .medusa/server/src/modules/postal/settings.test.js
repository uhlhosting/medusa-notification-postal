"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const settings_1 = require("./settings");
// In-memory fake of the generated module service methods used by settings.ts.
const createFakeService = (seed) => {
    const rows = new Map();
    if (seed) {
        rows.set(settings_1.POSTAL_SETTINGS_ID, {
            id: settings_1.POSTAL_SETTINGS_ID,
            auth_type: "smtp-api",
            from_address: "",
            base_url: "",
            test_to: "",
            pending_restart: false,
            ...seed,
        });
    }
    const service = {
        rows,
        listPostalSettings: async (filter) => {
            const id = filter?.id ?? settings_1.POSTAL_SETTINGS_ID;
            const row = rows.get(id);
            return row ? [row] : [];
        },
        createPostalSettings: async (data) => {
            const record = { ...data };
            rows.set(record.id, record);
            return record;
        },
        updatePostalSettings: async (data) => {
            const record = data;
            const existing = rows.get(record.id);
            const merged = { ...existing, ...record };
            rows.set(record.id, merged);
            return merged;
        },
    };
    return service;
};
const withEnv = async (overrides, run) => {
    const previous = {};
    for (const key of Object.keys(overrides)) {
        previous[key] = process.env[key];
        if (overrides[key] === undefined) {
            delete process.env[key];
        }
        else {
            process.env[key] = overrides[key];
        }
    }
    try {
        await run();
    }
    finally {
        for (const key of Object.keys(previous)) {
            if (previous[key] === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = previous[key];
            }
        }
    }
};
(0, node_test_1.default)("getPostalSettings sources secrets from env and non-secret from the record", async () => {
    await withEnv({
        POSTAL_API_KEY: "secret-key",
        POSTAL_WEBHOOK_TOKEN: "whtoken1234",
        POSTAL_FROM: "env@example.com",
        POSTAL_BASE_URL: "https://env.example.com",
        POSTAL_TEST_TO: "env-test@example.com",
    }, async () => {
        const service = createFakeService({
            from_address: "db@example.com",
            base_url: "https://db.example.com",
            test_to: "db-test@example.com",
        });
        const settings = await (0, settings_1.getPostalSettings)(service);
        // DB overrides env for non-secret fields.
        strict_1.default.equal(settings.from, "db@example.com");
        strict_1.default.equal(settings.base_url, "https://db.example.com");
        strict_1.default.equal(settings.test_to, "db-test@example.com");
        // Secrets come from env only.
        strict_1.default.equal(settings.api_key, "secret-key");
        strict_1.default.equal(settings.webhook_token, "whtoken1234");
        strict_1.default.equal(settings.configured.api_key, true);
        strict_1.default.equal(settings.configured.webhook_token, true);
        strict_1.default.equal(settings.secret_hints.api_key_masked?.endsWith("-key"), true);
    });
});
(0, node_test_1.default)("getPostalSettings falls back to env when there is no record or service", async () => {
    await withEnv({
        POSTAL_API_KEY: "",
        POSTAL_WEBHOOK_TOKEN: "",
        POSTAL_FROM: "env@example.com",
        POSTAL_BASE_URL: "https://env.example.com",
        POSTAL_TEST_TO: undefined,
    }, async () => {
        const settings = await (0, settings_1.getPostalSettings)(null);
        strict_1.default.equal(settings.from, "env@example.com");
        strict_1.default.equal(settings.base_url, "https://env.example.com");
        strict_1.default.equal(settings.api_key, "");
        strict_1.default.equal(settings.configured.api_key, false);
        strict_1.default.equal(settings.secret_hints.api_key_masked, null);
        strict_1.default.equal(settings.test_to, null);
    });
});
(0, node_test_1.default)("persistPostalSettings creates a row, ignores secret fields, and flags restart", async () => {
    await withEnv({
        POSTAL_API_KEY: "env-key",
        POSTAL_WEBHOOK_TOKEN: "env-token",
        POSTAL_FROM: undefined,
        POSTAL_BASE_URL: undefined,
        POSTAL_TEST_TO: undefined,
    }, async () => {
        const service = createFakeService();
        const result = await (0, settings_1.persistPostalSettings)(service, {
            from: "  new@example.com  ",
            base_url: "https://new.example.com",
            test_to: "qa@example.com",
            // Secret fields must be ignored.
            api_key: "attacker-supplied",
            webhook_token: "attacker-token",
        });
        const stored = service.rows.get(settings_1.POSTAL_SETTINGS_ID);
        strict_1.default.ok(stored);
        strict_1.default.equal(stored?.from_address, "new@example.com");
        strict_1.default.equal(stored?.base_url, "https://new.example.com");
        strict_1.default.equal(stored?.test_to, "qa@example.com");
        strict_1.default.equal(stored?.pending_restart, true);
        // Secret fields never touch the persisted row.
        strict_1.default.equal("api_key" in stored, false);
        // Returned snapshot reflects saved non-secret values + env secrets.
        strict_1.default.equal(result.from, "new@example.com");
        strict_1.default.equal(result.api_key, "env-key");
        strict_1.default.equal(result.webhook_token, "env-token");
    });
});
(0, node_test_1.default)("persistPostalSettings updates an existing row and preserves prior values", async () => {
    await withEnv({ POSTAL_FROM: undefined, POSTAL_BASE_URL: undefined, POSTAL_TEST_TO: undefined }, async () => {
        const service = createFakeService({
            from_address: "old@example.com",
            base_url: "https://old.example.com",
            test_to: "old-test@example.com",
        });
        await (0, settings_1.persistPostalSettings)(service, { from: "changed@example.com" });
        const stored = service.rows.get(settings_1.POSTAL_SETTINGS_ID);
        strict_1.default.equal(stored?.from_address, "changed@example.com");
        // Untouched fields fall back to the current values.
        strict_1.default.equal(stored?.base_url, "https://old.example.com");
        strict_1.default.equal(stored?.test_to, "old-test@example.com");
        strict_1.default.equal(service.rows.size, 1);
    });
});
(0, node_test_1.default)("toPublicPostalSettings strips secret values", async () => {
    await withEnv({ POSTAL_API_KEY: "secret-key", POSTAL_WEBHOOK_TOKEN: "whtoken1234" }, async () => {
        const settings = await (0, settings_1.getPostalSettings)(createFakeService());
        const publicView = (0, settings_1.toPublicPostalSettings)(settings);
        strict_1.default.equal(publicView.api_key, "");
        strict_1.default.equal(publicView.webhook_token, "");
        // Masked hints remain for display.
        strict_1.default.ok(publicView.secret_hints.api_key_masked);
    });
});
(0, node_test_1.default)("validateModeRequirements enforces from, base_url, and api_key", async () => {
    await withEnv({ POSTAL_API_KEY: "", POSTAL_FROM: undefined, POSTAL_BASE_URL: undefined }, async () => {
        strict_1.default.equal((0, settings_1.validateModeRequirements)(await (0, settings_1.getPostalSettings)(createFakeService())), "POSTAL_FROM is required");
        strict_1.default.equal((0, settings_1.validateModeRequirements)(await (0, settings_1.getPostalSettings)(createFakeService({ from_address: "a@b.com" }))), "POSTAL_BASE_URL is required for API mode");
        strict_1.default.equal((0, settings_1.validateModeRequirements)(await (0, settings_1.getPostalSettings)(createFakeService({ from_address: "a@b.com", base_url: "https://p" }))), "POSTAL_API_KEY is required for API mode");
    });
    await withEnv({ POSTAL_API_KEY: "k" }, async () => {
        strict_1.default.equal((0, settings_1.validateModeRequirements)(await (0, settings_1.getPostalSettings)(createFakeService({ from_address: "a@b.com", base_url: "https://p" }))), null);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC9zZXR0aW5ncy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyx5Q0FRbUI7QUFFbkIsOEVBQThFO0FBQzlFLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxJQUFtQyxFQUFFLEVBQUU7SUFDaEUsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUE7SUFDbkQsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNULElBQUksQ0FBQyxHQUFHLENBQUMsNkJBQWtCLEVBQUU7WUFDM0IsRUFBRSxFQUFFLDZCQUFrQjtZQUN0QixTQUFTLEVBQUUsVUFBVTtZQUNyQixZQUFZLEVBQUUsRUFBRTtZQUNoQixRQUFRLEVBQUUsRUFBRTtZQUNaLE9BQU8sRUFBRSxFQUFFO1lBQ1gsZUFBZSxFQUFFLEtBQUs7WUFDdEIsR0FBRyxJQUFJO1NBQ1IsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sT0FBTyxHQUVUO1FBQ0YsSUFBSTtRQUNKLGtCQUFrQixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLEVBQUUsR0FBSSxNQUFNLEVBQUUsRUFBYSxJQUFJLDZCQUFrQixDQUFBO1lBQ3ZELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDeEIsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtRQUN6QixDQUFDO1FBQ0Qsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ25DLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBSSxJQUE0QixFQUFFLENBQUE7WUFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENB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
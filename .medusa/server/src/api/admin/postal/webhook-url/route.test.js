"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const utils_1 = require("@medusajs/framework/utils");
const route_1 = require("./route");
// The webhook token is sourced from POSTAL_WEBHOOK_TOKEN (env only). The module
// service is resolved but not used for the token, so a null resolve is fine.
const invokeGet = async (options) => {
    const envKeys = [
        "POSTAL_WEBHOOK_TOKEN",
        "MEDUSA_BACKEND_URL",
        "VITE_BACKEND_URL",
        ...Object.keys(options.env ?? {}),
    ];
    const previous = {};
    for (const key of envKeys) {
        previous[key] = process.env[key];
    }
    // Reset the origin-related env unless the test overrides them.
    delete process.env.MEDUSA_BACKEND_URL;
    delete process.env.VITE_BACKEND_URL;
    if (options.token === undefined) {
        delete process.env.POSTAL_WEBHOOK_TOKEN;
    }
    else {
        process.env.POSTAL_WEBHOOK_TOKEN = options.token;
    }
    for (const [key, value] of Object.entries(options.env ?? {})) {
        if (value === undefined) {
            delete process.env[key];
        }
        else {
            process.env[key] = value;
        }
    }
    const req = {
        headers: options.headers ?? {},
        scope: { resolve: () => null },
    };
    const responseBody = {};
    const res = {
        status(code) {
            responseBody.status = code;
            return {
                json(payload) {
                    responseBody.payload = payload;
                    return payload;
                },
            };
        },
    };
    try {
        await (0, route_1.GET)(req, res);
        return responseBody;
    }
    finally {
        for (const key of envKeys) {
            if (previous[key] === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = previous[key];
            }
        }
    }
};
(0, node_test_1.default)("admin webhook url route returns tokenized callback details", async () => {
    const body = await invokeGet({
        token: "token_123",
        headers: { host: "api.example.com", "x-forwarded-proto": "https" },
    });
    strict_1.default.equal(body.status, 200);
    strict_1.default.equal(body.payload.token, "token_123");
    strict_1.default.equal(body.payload.path, "/postal/webhooks/token_123");
    strict_1.default.equal(body.payload.callback_url, "https://api.example.com/postal/webhooks/token_123");
});
(0, node_test_1.default)("admin webhook url route prefers the origin header when present", async () => {
    const body = await invokeGet({
        token: "token_origin",
        headers: { origin: "https://origin.example.com/app" },
    });
    strict_1.default.equal(body.payload.callback_url, "https://origin.example.com/postal/webhooks/token_origin");
});
(0, node_test_1.default)("admin webhook url route falls back to backend env origin", async () => {
    const body = await invokeGet({
        token: "token_456",
        headers: {},
        env: { MEDUSA_BACKEND_URL: "https://env.example.com" },
    });
    strict_1.default.equal(body.status, 200);
    strict_1.default.equal(body.payload.callback_url, "https://env.example.com/postal/webhooks/token_456");
});
(0, node_test_1.default)("admin webhook url route returns null callback_url when no origin exists", async () => {
    const body = await invokeGet({ token: "token_789", headers: {} });
    strict_1.default.equal(body.status, 200);
    strict_1.default.equal(body.payload.token, "token_789");
    strict_1.default.equal(body.payload.callback_url, null);
});
(0, node_test_1.default)("admin webhook url route ignores invalid absolute origins and falls back to env", async () => {
    const body = await invokeGet({
        token: "token_invalid",
        headers: { origin: "not-a-valid-url", "x-forwarded-host": "bad host" },
        env: { MEDUSA_BACKEND_URL: "https://env.invalid-origin.example.test" },
    });
    strict_1.default.equal(body.payload.callback_url, "https://env.invalid-origin.example.test/postal/webhooks/token_invalid");
});
(0, node_test_1.default)("admin webhook url route falls back to VITE backend origin when MEDUSA backend origin is invalid", async () => {
    const body = await invokeGet({
        token: "token_vite",
        headers: { host: "" },
        env: {
            MEDUSA_BACKEND_URL: "not-a-valid-url",
            VITE_BACKEND_URL: "https://vite.example.com",
        },
    });
    strict_1.default.equal(body.payload.callback_url, "https://vite.example.com/postal/webhooks/token_vite");
});
(0, node_test_1.default)("admin webhook url route falls back to VITE backend origin when forwarded host origin is invalid", async () => {
    const body = await invokeGet({
        token: "token_vite_forwarded",
        headers: { host: "bad host" },
        env: {
            MEDUSA_BACKEND_URL: "not-a-valid-url",
            VITE_BACKEND_URL: "https://vite-forwarded.example.com",
        },
    });
    strict_1.default.equal(body.payload.callback_url, "https://vite-forwarded.example.com/postal/webhooks/token_vite_forwarded");
});
(0, node_test_1.default)("admin webhook url route fails when the token is missing", async () => {
    const req = {
        headers: {},
        scope: { resolve: () => null },
    };
    const res = {
        status: () => ({ json: () => undefined }),
    };
    const previous = process.env.POSTAL_WEBHOOK_TOKEN;
    delete process.env.POSTAL_WEBHOOK_TOKEN;
    try {
        await strict_1.default.rejects(() => (0, route_1.GET)(req, res), utils_1.MedusaError);
    }
    finally {
        if (previous === undefined) {
            delete process.env.POSTAL_WEBHOOK_TOKEN;
        }
        else {
            process.env.POSTAL_WEBHOOK_TOKEN = previous;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vcG9zdGFsL3dlYmhvb2stdXJsL3JvdXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLHFEQUF1RDtBQUN2RCxtQ0FBNkI7QUFFN0IsZ0ZBQWdGO0FBQ2hGLDZFQUE2RTtBQUM3RSxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsT0FJeEIsRUFBRSxFQUFFO0lBQ0gsTUFBTSxPQUFPLEdBQUc7UUFDZCxzQkFBc0I7UUFDdEIsb0JBQW9CO1FBQ3BCLGtCQUFrQjtRQUNsQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUM7S0FDbEMsQ0FBQTtJQUNELE1BQU0sUUFBUSxHQUF1QyxFQUFFLENBQUE7SUFDdkQsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUMxQixRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBRUQsK0RBQStEO0lBQy9ELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQTtJQUNyQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUE7SUFDbkMsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2hDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQTtJQUN6QyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQTtJQUNsRCxDQUFDO0lBQ0QsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFP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
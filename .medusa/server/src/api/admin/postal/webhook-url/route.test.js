"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const utils_1 = require("@medusajs/framework/utils");
const route_1 = require("./route");
(0, node_test_1.default)("admin webhook url route returns tokenized callback details", async () => {
    const pgConnection = {
        raw: async (sql, params) => {
            strict_1.default.match(sql, /SELECT value FROM admin_plugin_settings/);
            strict_1.default.deepEqual(params, ["postal"]);
            return {
                rows: [
                    {
                        value: {
                            POSTAL_WEBHOOK_TOKEN: "token_123",
                        },
                    },
                ],
            };
        },
    };
    const req = {
        headers: {
            host: "api.uhlhosting.ch",
            "x-forwarded-proto": "https",
        },
        scope: {
            resolve: (name) => {
                strict_1.default.equal(name, "pgConnection");
                return pgConnection;
            },
        },
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
    await (0, route_1.GET)(req, res);
    strict_1.default.equal(responseBody.status, 200);
    strict_1.default.equal(responseBody.payload.token, "token_123");
    strict_1.default.equal(responseBody.payload.path, "/postal/webhooks/token_123");
    strict_1.default.equal(responseBody.payload.callback_url, "https://api.uhlhosting.ch/postal/webhooks/token_123");
});
(0, node_test_1.default)("admin webhook url route prefers the origin header when present", async () => {
    const pgConnection = {
        raw: async () => ({
            rows: [
                {
                    value: {
                        POSTAL_WEBHOOK_TOKEN: "token_origin",
                    },
                },
            ],
        }),
    };
    const req = {
        headers: {
            origin: "https://origin.uhlhosting.ch/app",
        },
        scope: {
            resolve: () => pgConnection,
        },
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
    await (0, route_1.GET)(req, res);
    strict_1.default.equal(responseBody.payload.callback_url, "https://origin.uhlhosting.ch/postal/webhooks/token_origin");
});
(0, node_test_1.default)("admin webhook url route falls back to backend env origin", async () => {
    const previousBackendUrl = process.env.MEDUSA_BACKEND_URL;
    process.env.MEDUSA_BACKEND_URL = "https://env.uhlhosting.ch";
    try {
        const pgConnection = {
            raw: async (sql, params) => {
                strict_1.default.match(sql, /SELECT value FROM admin_plugin_settings/);
                strict_1.default.deepEqual(params, ["postal"]);
                return {
                    rows: [
                        {
                            value: {
                                POSTAL_WEBHOOK_TOKEN: "token_456",
                            },
                        },
                    ],
                };
            },
        };
        const req = {
            headers: {},
            scope: {
                resolve: (name) => {
                    strict_1.default.equal(name, "pgConnection");
                    return pgConnection;
                },
            },
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
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.status, 200);
        strict_1.default.equal(responseBody.payload.callback_url, "https://env.uhlhosting.ch/postal/webhooks/token_456");
    }
    finally {
        if (previousBackendUrl === undefined) {
            delete process.env.MEDUSA_BACKEND_URL;
        }
        else {
            process.env.MEDUSA_BACKEND_URL = previousBackendUrl;
        }
    }
});
(0, node_test_1.default)("admin webhook url route returns null callback_url when no origin exists", async () => {
    const previousBackendUrl = process.env.MEDUSA_BACKEND_URL;
    const previousViteBackendUrl = process.env.VITE_BACKEND_URL;
    delete process.env.MEDUSA_BACKEND_URL;
    delete process.env.VITE_BACKEND_URL;
    try {
        const pgConnection = {
            raw: async () => ({
                rows: [
                    {
                        value: {
                            POSTAL_WEBHOOK_TOKEN: "token_789",
                        },
                    },
                ],
            }),
        };
        const req = {
            headers: {},
            scope: {
                resolve: () => pgConnection,
            },
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
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.status, 200);
        strict_1.default.equal(responseBody.payload.token, "token_789");
        strict_1.default.equal(responseBody.payload.callback_url, null);
    }
    finally {
        if (previousBackendUrl === undefined) {
            delete process.env.MEDUSA_BACKEND_URL;
        }
        else {
            process.env.MEDUSA_BACKEND_URL = previousBackendUrl;
        }
        if (previousViteBackendUrl === undefined) {
            delete process.env.VITE_BACKEND_URL;
        }
        else {
            process.env.VITE_BACKEND_URL = previousViteBackendUrl;
        }
    }
});
(0, node_test_1.default)("admin webhook url route ignores invalid absolute origins and falls back to env", async () => {
    const previousBackendUrl = process.env.MEDUSA_BACKEND_URL;
    process.env.MEDUSA_BACKEND_URL = "https://env.invalid-origin.example.test";
    try {
        const pgConnection = {
            raw: async () => ({
                rows: [
                    {
                        value: {
                            POSTAL_WEBHOOK_TOKEN: "token_invalid",
                        },
                    },
                ],
            }),
        };
        const req = {
            headers: {
                origin: "not-a-valid-url",
                "x-forwarded-host": "bad host",
            },
            scope: {
                resolve: () => pgConnection,
            },
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
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.payload.callback_url, "https://env.invalid-origin.example.test/postal/webhooks/token_invalid");
    }
    finally {
        if (previousBackendUrl === undefined) {
            delete process.env.MEDUSA_BACKEND_URL;
        }
        else {
            process.env.MEDUSA_BACKEND_URL = previousBackendUrl;
        }
    }
});
(0, node_test_1.default)("admin webhook url route falls back to VITE backend origin when MEDUSA backend origin is invalid", async () => {
    const previousBackendUrl = process.env.MEDUSA_BACKEND_URL;
    const previousViteBackendUrl = process.env.VITE_BACKEND_URL;
    process.env.MEDUSA_BACKEND_URL = "not-a-valid-url";
    process.env.VITE_BACKEND_URL = "https://vite.uhlhosting.ch";
    try {
        const pgConnection = {
            raw: async () => ({
                rows: [
                    {
                        value: {
                            POSTAL_WEBHOOK_TOKEN: "token_vite",
                        },
                    },
                ],
            }),
        };
        const req = {
            headers: {
                host: "",
            },
            scope: {
                resolve: () => pgConnection,
            },
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
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.payload.callback_url, "https://vite.uhlhosting.ch/postal/webhooks/token_vite");
    }
    finally {
        if (previousBackendUrl === undefined) {
            delete process.env.MEDUSA_BACKEND_URL;
        }
        else {
            process.env.MEDUSA_BACKEND_URL = previousBackendUrl;
        }
        if (previousViteBackendUrl === undefined) {
            delete process.env.VITE_BACKEND_URL;
        }
        else {
            process.env.VITE_BACKEND_URL = previousViteBackendUrl;
        }
    }
});
(0, node_test_1.default)("admin webhook url route falls back to VITE backend origin when forwarded host origin is invalid", async () => {
    const previousBackendUrl = process.env.MEDUSA_BACKEND_URL;
    const previousViteBackendUrl = process.env.VITE_BACKEND_URL;
    process.env.MEDUSA_BACKEND_URL = "not-a-valid-url";
    process.env.VITE_BACKEND_URL = "https://vite-forwarded.uhlhosting.ch";
    try {
        const pgConnection = {
            raw: async () => ({
                rows: [
                    {
                        value: {
                            POSTAL_WEBHOOK_TOKEN: "token_vite_forwarded",
                        },
                    },
                ],
            }),
        };
        const req = {
            headers: {
                host: "bad host",
            },
            scope: {
                resolve: () => pgConnection,
            },
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
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.payload.callback_url, "https://vite-forwarded.uhlhosting.ch/postal/webhooks/token_vite_forwarded");
    }
    finally {
        if (previousBackendUrl === undefined) {
            delete process.env.MEDUSA_BACKEND_URL;
        }
        else {
            process.env.MEDUSA_BACKEND_URL = previousBackendUrl;
        }
        if (previousViteBackendUrl === undefined) {
            delete process.env.VITE_BACKEND_URL;
        }
        else {
            process.env.VITE_BACKEND_URL = previousViteBackendUrl;
        }
    }
});
(0, node_test_1.default)("admin webhook url route fails when the token is missing", async () => {
    const pgConnection = {
        raw: async () => ({
            rows: [
                {
                    value: {},
                },
            ],
        }),
    };
    const req = {
        headers: {},
        scope: {
            resolve: () => pgConnection,
        },
    };
    const res = {
        status: () => ({
            json: () => undefined,
        }),
    };
    await strict_1.default.rejects(() => (0, route_1.GET)(req, res), utils_1.MedusaError);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vcG9zdGFsL3dlYmhvb2stdXJsL3JvdXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsZ0VBQXVDO0FBQ3ZDLHFEQUF1RDtBQUN2RCxtQ0FBNkI7QUFFN0IsSUFBQSxtQkFBSSxFQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQzVFLE1BQU0sWUFBWSxHQUFHO1FBQ25CLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBVyxFQUFFLE1BQWtCLEVBQUUsRUFBRTtZQUM3QyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUseUNBQXlDLENBQUMsQ0FBQTtZQUM1RCxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBQ3BDLE9BQU87Z0JBQ0wsSUFBSSxFQUFFO29CQUNKO3dCQUNFLEtBQUssRUFBRTs0QkFDTCxvQkFBb0IsRUFBRSxXQUFXO3lCQUNsQztxQkFDRjtpQkFDRjthQUNGLENBQUE7UUFDSCxDQUFDO0tBQ0YsQ0FBQTtJQUVELE1BQU0sR0FBRyxHQUFHO1FBQ1YsT0FBTyxFQUFFO1lBQ1AsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixtQkFBbUIsRUFBRSxPQUFPO1NBQzdCO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQ3hCLGdCQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQTtnQkFDbEMsT0FBTyxZQUFZLENBQUE7WUFDckIsQ0FBQztTQUNGO0tBQ0ssQ0FBQTtJQUVSLE1BQU0sWUFBWSxHQUFRLEVBQUUsQ0FBQTtJQUM1QixNQUFNLEdBQUcsR0FBRztRQUNWLE1BQU0sQ0FBQyxJQUFZO1lBQ2pCLFlBQVksQ0FBQyxNQUFN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
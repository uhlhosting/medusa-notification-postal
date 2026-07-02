"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const route_1 = require("./route");
(0, node_test_1.default)("postal settings GET returns public settings without secrets", async () => {
    const previousEnv = {
        POSTAL_AUTH_TYPE: process.env.POSTAL_AUTH_TYPE,
        POSTAL_FROM: process.env.POSTAL_FROM,
        POSTAL_BASE_URL: process.env.POSTAL_BASE_URL,
        POSTAL_API_KEY: process.env.POSTAL_API_KEY,
        POSTAL_TEST_TO: process.env.POSTAL_TEST_TO,
        POSTAL_WEBHOOK_TOKEN: process.env.POSTAL_WEBHOOK_TOKEN,
    };
    process.env.POSTAL_AUTH_TYPE = "smtp-api";
    process.env.POSTAL_FROM = "noreply@uhlhosting.ch";
    process.env.POSTAL_BASE_URL = "https://post.uhlhosting.ch";
    process.env.POSTAL_API_KEY = "postal-secret-api-key";
    process.env.POSTAL_TEST_TO = "customer@highacid.com";
    process.env.POSTAL_WEBHOOK_TOKEN = "postal-secret-webhook-token";
    try {
        const responseBody = {};
        const req = {
            scope: {
                resolve: () => null,
            },
        };
        const res = {
            json(payload) {
                responseBody.payload = payload;
                return payload;
            },
        };
        await (0, route_1.GET)(req, res);
        strict_1.default.equal(responseBody.payload.provider_id, "postal");
        strict_1.default.equal(responseBody.payload.auth_type, "smtp-api");
        strict_1.default.equal(responseBody.payload.from, "noreply@uhlhosting.ch");
        strict_1.default.equal(responseBody.payload.base_url, "https://post.uhlhosting.ch");
        strict_1.default.equal(responseBody.payload.test_to, "customer@highacid.com");
        strict_1.default.equal(responseBody.payload.api_key, "");
        strict_1.default.equal(responseBody.payload.webhook_token, "");
        strict_1.default.equal(responseBody.payload.configured.api_key, true);
        strict_1.default.equal(responseBody.payload.configured.webhook_token, true);
        strict_1.default.match(responseBody.payload.secret_hints.api_key_masked, /\*+-key$/);
        strict_1.default.match(responseBody.payload.secret_hints.webhook_token_masked, /\*+oken$/);
        strict_1.default.equal(responseBody.payload.diagnostics.settings_source, "db_over_env");
    }
    finally {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vcGx1Z2luLXNldHRpbmdzL3Bvc3RhbC9yb3V0ZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2QyxtQ0FBNkI7QUFFN0IsSUFBQSxtQkFBSSxFQUFDLDZEQUE2RCxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQzdFLE1BQU0sV0FBVyxHQUFHO1FBQ2xCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCO1FBQzlDLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVc7UUFDcEMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZTtRQUM1QyxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjO1FBQzFDLGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7UUFDMUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7S0FDdkQsQ0FBQTtJQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFBO0lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLHVCQUF1QixDQUFBO0lBQ2pELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxHQUFHLDRCQUE0QixDQUFBO0lBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxHQUFHLHVCQUF1QixDQUFBO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxHQUFHLHVCQUF1QixDQUFBO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEdBQUcsNkJBQTZCLENBQUE7SUFFaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxZQUFZLEdBQVEsRUFBRSxDQUFBO1FBQzVCLE1BQU0sR0FBRyxHQUFHO1lBQ1YsS0FBSyxFQUFFO2dCQUNMLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJO2FBQ3BCO1NBQ0ssQ0FBQTtRQUNSLE1BQU0sR0FBRyxHQUFHO1lBQ1YsSUFBSSxDQUFDLE9BQVk7Z0JBQ2YsWUFBWSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7Z0JBQzlCLE9BQU8sT0FBTyxDQUFBO1lBQ2hCLENBQUM7U0FDSyxDQUFBO1FBRVIsTUFBTSxJQUFBLFdBQUcsRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFbkIsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDeEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDeEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtRQUNoRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFBO1FBQ3pFLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHVCQUF1QixDQUFDLENBQUE7UUFDbkUsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDOUMsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDcEQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQzNELGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUNqRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDMUUsZ0JBQU0sQ0FBQyxLQUFLLENBQ1YsWUFBWSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQ3RELFVBQVUsQ0FDWCxDQUFBO1FBQ0QsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBQy9FLENBQUM7WUFBUyxDQUFDO1FBQ1QsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUN2RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3pCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtZQUMxQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQSJ9
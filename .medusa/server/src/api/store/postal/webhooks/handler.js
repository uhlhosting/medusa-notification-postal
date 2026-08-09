"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePostalWebhookPost = void 0;
const record_postal_webhook_1 = require("../../../../workflows/record-postal-webhook");
const handlePostalWebhookPost = async (input) => {
    const { scope, body, validatedBody, runWebhookWorkflow, } = input;
    const payload = (validatedBody || body || {});
    const { result } = runWebhookWorkflow
        ? await runWebhookWorkflow(payload)
        : await (0, record_postal_webhook_1.recordPostalWebhookWorkflow)(scope).run({
            input: payload,
        });
    if (!result) {
        return {
            status: 202,
            body: {
                ok: true,
                ignored: true,
            },
        };
    }
    return {
        status: 202,
        body: {
            ok: true,
            id: result.id,
            event_type: result.event_type,
            status: result.status,
        },
    };
};
exports.handlePostalWebhookPost = handlePostalWebhookPost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvc3RvcmUvcG9zdGFsL3dlYmhvb2tzL2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUZBQXlGO0FBZ0JsRixNQUFNLHVCQUF1QixHQUFHLEtBQUssRUFDMUMsS0FBb0MsRUFDcEMsRUFBRTtJQUNGLE1BQU0sRUFDSixLQUFLLEVBQ0wsSUFBSSxFQUNKLGFBQWEsRUFDYixrQkFBa0IsR0FDbkIsR0FBRyxLQUFLLENBQUE7SUFDVCxNQUFNLE9BQU8sR0FBRyxDQUFDLGFBQWEsSUFBSSxJQUFJLElBQUksRUFBRSxDQUE0QixDQUFBO0lBRXhFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxrQkFBa0I7UUFDbkMsQ0FBQyxDQUFDLE1BQU0sa0JBQWtCLENBQUMsT0FBTyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxNQUFNLElBQUEsbURBQTJCLEVBQUMsS0FBd0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUM5RCxLQUFLLEVBQUUsT0FBTztTQUNmLENBQUMsQ0FBQTtJQUVOLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRTtnQkFDSixFQUFFLEVBQUUsSUFBSTtnQkFDUixPQUFPLEVBQUUsSUFBSTthQUNkO1NBQ0YsQ0FBQTtJQUNILENBQUM7SUFFRCxPQUFPO1FBQ0wsTUFBTSxFQUFFLEdBQUc7UUFDWCxJQUFJLEVBQUU7WUFDSixFQUFFLEVBQUUsSUFBSTtZQUNSLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNiLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtZQUM3QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07U0FDdEI7S0FDRixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBcENZLFFBQUEsdUJBQXVCLDJCQW9DbkMifQ==
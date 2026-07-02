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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvc3RvcmUvcG9zdGFsL3dlYmhvb2tzL2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUZBQXlGO0FBZWxGLE1BQU0sdUJBQXVCLEdBQUcsS0FBSyxFQUMxQyxLQUFvQyxFQUNwQyxFQUFFO0lBQ0YsTUFBTSxFQUNKLEtBQUssRUFDTCxJQUFJLEVBQ0osYUFBYSxFQUNiLGtCQUFrQixHQUNuQixHQUFHLEtBQUssQ0FBQTtJQUNULE1BQU0sT0FBTyxHQUFHLENBQUMsYUFBYSxJQUFJLElBQUksSUFBSSxFQUFFLENBQTRCLENBQUE7SUFFeEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLGtCQUFrQjtRQUNuQyxDQUFDLENBQUMsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7UUFDbkMsQ0FBQyxDQUFDLE1BQU0sSUFBQSxtREFBMkIsRUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDM0MsS0FBSyxFQUFFLE9BQU87U0FDZixDQUFDLENBQUE7SUFFTixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUU7Z0JBQ0osRUFBRSxFQUFFLElBQUk7Z0JBQ1IsT0FBTyxFQUFFLElBQUk7YUFDZDtTQUNGLENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxHQUFHO1FBQ1gsSUFBSSxFQUFFO1lBQ0osRUFBRSxFQUFFLElBQUk7WUFDUixFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDYixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7WUFDN0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1NBQ3RCO0tBQ0YsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQXBDWSxRQUFBLHVCQUF1QiwyQkFvQ25DIn0=
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPostalWebhookEventStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../../modules/postal/constants");
const webhooks_1 = require("../../modules/postal/webhooks");
const resolvePostalWebhookEventService = (container) => {
    try {
        return container.resolve(constants_1.POSTAL_PLUGIN_MODULE);
    }
    catch {
        return null;
    }
};
exports.recordPostalWebhookEventStep = (0, workflows_sdk_1.createStep)("record-postal-webhook-event", async (payload, { container }) => {
    const service = resolvePostalWebhookEventService(container);
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(service, payload);
    if (event) {
        // Emit a delivery event so subscribers can react (e.g. postal.bounced).
        // The event bus is optional — recording has already succeeded.
        try {
            const eventBus = container.resolve(utils_1.Modules.EVENT_BUS);
            await eventBus.emit({
                name: `postal.${event.status}`,
                data: {
                    id: event.id,
                    event_type: event.event_type,
                    status: event.status,
                    message_id: event.message_id,
                    recipient: event.recipient,
                    occurred_at: event.occurred_at,
                },
            });
        }
        catch {
            // Ignore: event emission is best-effort.
        }
    }
    return new workflows_sdk_1.StepResponse(event);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLXBvc3RhbC13ZWJob29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy9yZWNvcmQtcG9zdGFsLXdlYmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQTRFO0FBQzVFLHFEQUFtRDtBQUNuRCw4REFBcUU7QUFDckUsNERBR3NDO0FBSXRDLE1BQU0sZ0NBQWdDLEdBQUcsQ0FBQyxTQUV6QyxFQUFvQyxFQUFFO0lBQ3JDLElBQUksQ0FBQztRQUNILE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQ0FBb0IsQ0FBOEIsQ0FBQTtJQUM3RSxDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBRVksUUFBQSw0QkFBNEIsR0FBRyxJQUFBLDBCQUFVLEVBQ3BELDZCQUE2QixFQUM3QixLQUFLLEVBQUUsT0FBcUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDN0QsTUFBTSxPQUFPLEdBQUcsZ0NBQWdDLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDM0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLG1DQUF3QixFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUU5RCxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1Ysd0VBQXdFO1FBQ3hFLCtEQUErRDtRQUMvRCxJQUFJLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxTQUFTLENBRW5ELENBQUE7WUFDRCxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xCLElBQUksRUFBRSxVQUFVLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLElBQUksRUFBRTtvQkFDSixFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUU7b0JBQ1osVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO29CQUM1QixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07b0JBQ3BCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtvQkFDNUIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO29CQUMxQixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7aUJBQy9CO2FBQ0YsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLHlDQUF5QztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sSUFBSSw0QkFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2hDLENBQUMsQ0FBQyxDQUFBIn0=
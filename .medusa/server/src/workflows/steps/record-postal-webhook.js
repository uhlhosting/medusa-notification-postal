"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPostalWebhookEventStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const db_1 = require("../../modules/postal/db");
const webhooks_1 = require("../../modules/postal/webhooks");
exports.recordPostalWebhookEventStep = (0, workflows_sdk_1.createStep)("record-postal-webhook-event", async (payload, { container }) => {
    const pgConnection = (0, db_1.resolveOptionalPgConnection)(container);
    const event = await (0, webhooks_1.recordPostalWebhookEvent)(pgConnection, payload);
    return new workflows_sdk_1.StepResponse(event);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLXBvc3RhbC13ZWJob29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy9yZWNvcmQtcG9zdGFsLXdlYmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQTRFO0FBQzVFLGdEQUFxRTtBQUNyRSw0REFBd0U7QUFJM0QsUUFBQSw0QkFBNEIsR0FBRyxJQUFBLDBCQUFVLEVBQ3BELDZCQUE2QixFQUM3QixLQUFLLEVBQUUsT0FBcUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDN0QsTUFBTSxZQUFZLEdBQUcsSUFBQSxnQ0FBMkIsRUFBQyxTQUFTLENBQUMsQ0FBQTtJQUMzRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsbUNBQXdCLEVBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBRW5FLE9BQU8sSUFBSSw0QkFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2hDLENBQUMsQ0FBQyxDQUFBIn0=
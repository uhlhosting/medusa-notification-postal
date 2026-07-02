"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPostalWebhookWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const record_postal_webhook_1 = require("./steps/record-postal-webhook");
exports.recordPostalWebhookWorkflow = (0, workflows_sdk_1.createWorkflow)("record-postal-webhook", function (payload) {
    const event = (0, record_postal_webhook_1.recordPostalWebhookEventStep)(payload);
    return new workflows_sdk_1.WorkflowResponse(event);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLXBvc3RhbC13ZWJob29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9yZWNvcmQtcG9zdGFsLXdlYmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBSTBDO0FBQzFDLHlFQUE0RTtBQUsvRCxRQUFBLDJCQUEyQixHQUlwQyxJQUFBLDhCQUFjLEVBQ2hCLHVCQUF1QixFQUN2QixVQUFVLE9BQXlDO0lBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUEsb0RBQTRCLEVBQUMsT0FBTyxDQUFDLENBQUE7SUFFbkQsT0FBTyxJQUFJLGdDQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3BDLENBQUMsQ0FBQyxDQUFBIn0=
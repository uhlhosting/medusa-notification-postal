"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostalEmailWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const send_postal_email_1 = require("./steps/send-postal-email");
exports.sendPostalEmailWorkflow = (0, workflows_sdk_1.createWorkflow)("send-postal-email", function (input) {
    const delivery = (0, send_postal_email_1.sendPostalEmailStep)(input);
    return new workflows_sdk_1.WorkflowResponse({
        success: true,
        delivery,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUFvRjtBQUNwRixpRUFBK0Q7QUFrQmxELFFBQUEsdUJBQXVCLEdBQUcsSUFBQSw4QkFBYyxFQUNuRCxtQkFBbUIsRUFDbkIsVUFBVSxLQUFtQztJQUMzQyxNQUFNLFFBQVEsR0FBRyxJQUFBLHVDQUFtQixFQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTNDLE9BQU8sSUFBSSxnQ0FBZ0IsQ0FBQztRQUMxQixPQUFPLEVBQUUsSUFBSTtRQUNiLFFBQVE7S0FDVCxDQUFDLENBQUE7QUFDSixDQUFDLENBQ0YsQ0FBQSJ9
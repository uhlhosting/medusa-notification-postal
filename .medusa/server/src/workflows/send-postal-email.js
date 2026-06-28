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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUFvRztBQUNwRyxpRUFBK0Q7QUEwQmxELFFBQUEsdUJBQXVCLEdBSWhDLElBQUEsOEJBQWMsRUFDaEIsbUJBQW1CLEVBQ25CLFVBQVUsS0FBbUM7SUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBQSx1Q0FBbUIsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUUzQyxPQUFPLElBQUksZ0NBQWdCLENBQUM7UUFDMUIsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRO0tBQ1QsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUNGLENBQUEifQ==
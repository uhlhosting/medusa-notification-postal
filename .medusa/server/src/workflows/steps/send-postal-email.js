"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostalEmailStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
exports.sendPostalEmailStep = (0, workflows_sdk_1.createStep)("send-postal-email", async (input, { container }) => {
    const postalService = container.resolve("notification-postal");
    const result = await postalService.send(input);
    return new workflows_sdk_1.StepResponse({
        id: result?.id || null,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.provider_data?.subject || "",
        delivered_at: new Date().toISOString(),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQXNCL0QsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLDBCQUFVLEVBQzNDLG1CQUFtQixFQUNuQixLQUFLLEVBQUUsS0FBK0IsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDdkQsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDckMscUJBQXFCLENBQ1EsQ0FBQTtJQUMvQixNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFOUMsT0FBTyxJQUFJLDRCQUFZLENBQUM7UUFDdEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksSUFBSTtRQUN0QixFQUFFLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUNuRCxPQUFPLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxPQUFPLElBQUksRUFBRTtRQUMzQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDdkMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUNGLENBQUEifQ==
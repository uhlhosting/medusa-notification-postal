"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostalEmailStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
exports.sendPostalEmailStep = (0, workflows_sdk_1.createStep)("send-postal-email", async (input, { container }) => {
    const notificationModuleService = container.resolve(utils_1.Modules.NOTIFICATION);
    const to = Array.isArray(input.to) ? input.to.join(",") : input.to;
    const result = await notificationModuleService.createNotifications({
        to,
        channel: "email",
        template: input.template || "default",
        content: {
            subject: input.provider_data.subject,
            html: input.provider_data.html,
            text: input.provider_data.text,
        },
        provider_data: {
            cc: input.provider_data.cc,
            bcc: input.provider_data.bcc,
            headers: input.provider_data.headers,
            workflow_event: input.provider_data.workflow_event,
            workflow_run_id: input.provider_data.workflow_run_id,
        },
    });
    return new workflows_sdk_1.StepResponse({
        id: Array.isArray(result) ? result[0]?.id : result?.id || null,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.provider_data?.subject || "",
        delivered_at: new Date().toISOString(),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBbUQ7QUFtQnRDLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwwQkFBVSxFQUMzQyxtQkFBbUIsRUFDbkIsS0FBSyxFQUFFLEtBQStCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDakQsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUVELE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtJQUVsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLHlCQUF5QixDQUFDLG1CQUFtQixDQUFDO1FBQ2pFLEVBQUU7UUFDRixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsSUFBSSxTQUFTO1FBQ3JDLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDcEMsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJO1NBQy9CO1FBQ0QsYUFBYSxFQUFFO1lBQ2IsRUFBRSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUMxQixHQUFHLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHO1lBQzVCLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDcEMsY0FBYyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsY0FBYztZQUNsRCxlQUFlLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxlQUFlO1NBQ3JEO0tBQ0YsQ0FBQyxDQUFBO0lBRUYsT0FBTyxJQUFJLDRCQUFZLENBQUM7UUFDdEIsRUFBRSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksSUFBSTtRQUM5RCxFQUFFLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUNuRCxPQUFPLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxPQUFPLElBQUksRUFBRTtRQUMzQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDdkMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUNGLENBQUEifQ==
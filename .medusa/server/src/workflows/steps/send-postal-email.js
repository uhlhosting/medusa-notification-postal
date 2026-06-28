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
            from: input.provider_data.from || input.from,
            from_name: input.provider_data.from_name || input.from_name,
            reply_to: input.provider_data.reply_to || input.reply_to,
            cc: input.provider_data.cc,
            bcc: input.provider_data.bcc,
            headers: input.provider_data.headers,
            custom_args: input.provider_data.custom_args,
            metadata: input.provider_data.metadata,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBbUQ7QUEyQnRDLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwwQkFBVSxFQUMzQyxtQkFBbUIsRUFDbkIsS0FBSyxFQUFFLEtBQStCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDakQsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUVELE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtJQUVsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLHlCQUF5QixDQUFDLG1CQUFtQixDQUFDO1FBQ2pFLEVBQUU7UUFDRixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsSUFBSSxTQUFTO1FBQ3JDLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDcEMsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJO1NBQy9CO1FBQ0QsYUFBYSxFQUFFO1lBQ2IsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQzVDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsU0FBUztZQUMzRCxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVE7WUFDeEQsRUFBRSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUMxQixHQUFHLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHO1lBQzVCLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDcEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVztZQUM1QyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRO1lBQ3RDLGNBQWMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLGNBQWM7WUFDbEQsZUFBZSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsZUFBZTtTQUNyRDtLQUNGLENBQUMsQ0FBQTtJQUVGLE9BQU8sSUFBSSw0QkFBWSxDQUFDO1FBQ3RCLEVBQUUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLElBQUk7UUFDOUQsRUFBRSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkQsT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsT0FBTyxJQUFJLEVBQUU7UUFDM0MsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0tBQ3ZDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FDRixDQUFBIn0=
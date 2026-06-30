"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostalEmailStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
exports.sendPostalEmailStep = (0, workflows_sdk_1.createStep)("send-postal-email", async (input, { container }) => {
    const notificationModuleService = container.resolve(utils_1.Modules.NOTIFICATION);
    const recipients = normalizeRecipients(input.to);
    if (!recipients.length) {
        throw new Error("Postal notification requires at least one recipient");
    }
    const template = input.template || "default";
    const providerData = buildProviderData(input);
    const deliveries = await Promise.all(recipients.map(async (to) => {
        const result = (await notificationModuleService.createNotifications({
            to,
            channel: "email",
            template,
            content: {
                subject: input.provider_data.subject,
                html: input.provider_data.html,
                text: input.provider_data.text,
            },
            provider_data: providerData,
        }));
        return Array.isArray(result) ? result[0] || null : result || null;
    }));
    return new workflows_sdk_1.StepResponse({
        id: deliveries[0]?.id || null,
        to: recipients,
        subject: input.provider_data?.subject || "",
        delivered_at: new Date().toISOString(),
        deliveries,
    });
});
const normalizeRecipients = (value) => {
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry) => entry.trim()).filter(Boolean);
};
const buildProviderData = (input) => ({
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBbUQ7QUErQnRDLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwwQkFBVSxFQUMzQyxtQkFBbUIsRUFDbkIsS0FBSyxFQUFFLEtBQStCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDakQsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUVELE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQTtJQUN4RSxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUE7SUFDNUMsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFN0MsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUNsQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUMxQixNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0seUJBQXlCLENBQUMsbUJBQW1CLENBQUM7WUFDbEUsRUFBRTtZQUNGLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFFBQVE7WUFDUixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTztnQkFDcEMsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSTtnQkFDOUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSTthQUMvQjtZQUNELGFBQWEsRUFBRSxZQUFZO1NBQzVCLENBQUMsQ0FBOEMsQ0FBQTtRQUVoRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUE7SUFDbkUsQ0FBQyxDQUFDLENBQ0gsQ0FBQTtJQUVELE9BQU8sSUFBSSw0QkFBWSxDQUFDO1FBQ3RCLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUk7UUFDN0IsRUFBRSxFQUFFLFVBQVU7UUFDZCxPQUFPLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxPQUFPLElBQUksRUFBRTtRQUMzQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7UUFDdEMsVUFBVTtLQUNYLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FDRixDQUFBO0FBRUQsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLEtBQXdCLEVBQUUsRUFBRTtJQUN2RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDbkQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDMUQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQStCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUQsSUFBSSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO0lBQzVDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsU0FBUztJQUMzRCxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVE7SUFDeEQsRUFBRSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUMxQixHQUFHLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHO0lBQzVCLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87SUFDcEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVztJQUM1QyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRO0lBQ3RDLGNBQWMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLGNBQWM7SUFDbEQsZUFBZSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsZUFBZTtDQUNyRCxDQUFDLENBQUEifQ==
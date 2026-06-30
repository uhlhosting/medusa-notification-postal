"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostalEmailStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
exports.sendPostalEmailStep = (0, workflows_sdk_1.createStep)("send-postal-email", async (input, { container }) => {
    const notificationModuleService = container.resolve(utils_1.Modules.NOTIFICATION);
    const recipients = normalizeRecipients(input.to);
    if (!recipients.length) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires at least one recipient");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBZ0U7QUErQm5ELFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwwQkFBVSxFQUMzQyxtQkFBbUIsRUFDbkIsS0FBSyxFQUFFLEtBQStCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDakQsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUVELE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHFEQUFxRCxDQUN0RCxDQUFBO0lBQ0gsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLElBQUksU0FBUyxDQUFBO0lBQzVDLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDbEMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUU7UUFDMUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLHlCQUF5QixDQUFDLG1CQUFtQixDQUFDO1lBQ2xFLEVBQUU7WUFDRixPQUFPLEVBQUUsT0FBTztZQUNoQixRQUFRO1lBQ1IsT0FBTyxFQUFFO2dCQUNQLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU87Z0JBQ3BDLElBQUksRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUk7Z0JBQzlCLElBQUksRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUk7YUFDL0I7WUFDRCxhQUFhLEVBQUUsWUFBWTtTQUM1QixDQUFDLENBQThDLENBQUE7UUFFaEQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFBO0lBQ25FLENBQUMsQ0FBQyxDQUNILENBQUE7SUFFRCxPQUFPLElBQUksNEJBQVksQ0FBQztRQUN0QixFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJO1FBQzdCLEVBQUUsRUFBRSxVQUFVO1FBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsT0FBTyxJQUFJLEVBQUU7UUFDM0MsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQ3RDLFVBQVU7S0FDWCxDQUFDLENBQUE7QUFDSixDQUFDLENBQ0YsQ0FBQTtBQUVELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUF3QixFQUFFLEVBQUU7SUFDdkQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ25ELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQzFELENBQUMsQ0FBQTtBQUVELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxLQUErQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlELElBQUksRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSTtJQUM1QyxTQUFTLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFNBQVM7SUFDM0QsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRO0lBQ3hELEVBQUUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUU7SUFDMUIsR0FBRyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRztJQUM1QixPQUFPLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPO0lBQ3BDLFdBQVcsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVc7SUFDNUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUTtJQUN0QyxjQUFjLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxjQUFjO0lBQ2xELGVBQWUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLGVBQWU7Q0FDckQsQ0FBQyxDQUFBIn0=
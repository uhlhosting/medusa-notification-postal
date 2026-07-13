"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPostalNotificationInput = exports.sendPostalEmailStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const POSTAL_PROVIDER_ID = "postal";
exports.sendPostalEmailStep = (0, workflows_sdk_1.createStep)("send-postal-email", async (input, { container }) => {
    const notificationModuleService = container.resolve(utils_1.Modules.NOTIFICATION);
    if (!notificationModuleService) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, "Notification module is not loaded. Ensure Medusa notification is configured and the backend has been restarted.");
    }
    const recipients = normalizeRecipients(input.to);
    if (!recipients.length) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal notification requires at least one recipient");
    }
    const template = input.template || "default";
    const providerData = buildProviderData(input);
    const deliveries = await Promise.all(recipients.map(async (to) => {
        const result = await notificationModuleService.createNotifications((0, exports.buildPostalNotificationInput)(input, to, template, providerData));
        return { id: result?.id || null };
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
const buildPostalNotificationInput = (input, to, template, providerData) => {
    // Guard against duplicate sends on workflow retry: when a workflow run id is
    // present, the same run + recipient dedupes at the notification module.
    const workflowRunId = input.provider_data.workflow_run_id;
    const idempotencyKey = workflowRunId
        ? `postal:${workflowRunId}:${template}:${to}`
        : undefined;
    return {
        to,
        from: input.from,
        channel: "email",
        provider_id: POSTAL_PROVIDER_ID,
        template,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        content: {
            subject: input.provider_data.subject,
            html: input.provider_data.html,
            text: input.provider_data.text,
        },
        data: providerData,
        provider_data: providerData,
    };
};
exports.buildPostalNotificationInput = buildPostalNotificationInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZC1wb3N0YWwtZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NlbmQtcG9zdGFsLWVtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBZ0U7QUFJaEUsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUE7QUF5QnRCLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwwQkFBVSxFQUMzQyxtQkFBbUIsRUFDbkIsS0FBSyxFQUFFLEtBQStCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FDakQsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUVELElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1FBQy9CLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQzNCLGlIQUFpSCxDQUNsSCxDQUFBO0lBQ0gsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHFEQUFxRCxDQUN0RCxDQUFBO0lBQ0gsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLElBQUksU0FBUyxDQUFBO0lBQzVDLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDbEMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUU7UUFDMUIsTUFBTSxNQUFNLEdBQUcs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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPostalAdminTestProviderData = void 0;
const templates_1 = require("../../../../providers/postal/templates");
const normalizeEmailList = (value) => {
    if (Array.isArray(value)) {
        return value.map((entry) => entry.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.trim() || undefined;
    }
    return undefined;
};
const normalizeString = (value) => value?.trim() || undefined;
const mergeHeaders = (base, override) => ({
    ...base,
    ...(override || {}),
});
const mergeRecord = (base, override) => ({
    ...base,
    ...(override || {}),
});
const buildPostalAdminTestProviderData = (settings, body, runId) => {
    const templateName = normalizeString(body.template) || "postal-admin-test";
    const example = (0, templates_1.getPostalTemplateExample)(templateName);
    return {
        template: templateName,
        subject: normalizeString(body.subject) || example.subject,
        text: normalizeString(body.text) || example.text,
        html: normalizeString(body.html) || example.html,
        from: normalizeString(body.from) || normalizeString(settings.from),
        from_name: normalizeString(body.from_name),
        reply_to: normalizeString(body.reply_to),
        cc: normalizeEmailList(body.cc),
        bcc: normalizeEmailList(body.bcc),
        headers: mergeHeaders({}, body.headers),
        custom_args: mergeRecord({}, body.custom_args),
        metadata: mergeRecord({}, body.metadata),
        workflow_event: "postal.admin.test_send",
        workflow_run_id: runId,
    };
};
exports.buildPostalAdminTestProviderData = buildPostalAdminTestProviderData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1wYXlsb2FkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FwaS9hZG1pbi9wbHVnaW4tc2V0dGluZ3MvcG9zdGFsL3Rlc3QtcGF5bG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzRUFHK0M7QUF5Qy9DLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUF5QixFQUFFLEVBQUU7SUFDdkQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDekIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDM0QsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksU0FBUyxDQUFBO0lBQ2xDLENBQUM7SUFFRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQXFCLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxTQUFTLENBQUE7QUFFN0UsTUFBTSxZQUFZLEdBQUcsQ0FDbkIsSUFBNEIsRUFDNUIsUUFBaUMsRUFDakMsRUFBRSxDQUFDLENBQUM7SUFDSixHQUFHLElBQUk7SUFDUCxHQUFHLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztDQUNwQixDQUFDLENBQUE7QUFFRixNQUFNLFdBQVcsR0FBRyxDQUNsQixJQUFPLEVBQ1AsUUFBa0MsRUFDbEMsRUFBRSxDQUFDLENBQUM7SUFDSixHQUFHLElBQUk7SUFDUCxHQUFHLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztDQUNwQixDQUFNLENBQUE7QUFFQSxNQUFNLGdDQUFnQyxHQUFHLENBQzlDLFFBQWlDLEVBQ2pDLElBQXlCLEVBQ3pCLEtBQWEsRUFDZ0IsRUFBRTtJQUMvQixNQUFNLFlBQVksR0FDaEIsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxtQkFBbUIsQ0FBQTtJQUN2RCxNQUFNLE9BQU8sR0FBRyxJQUFBLG9DQUF3QixFQUN0QyxZQUFrQyxDQUNuQyxDQUFBO0lBRUQsT0FBTztRQUNMLFFBQVEsRUFBRSxZQUFZO1FBQ3RCLE9BQU8sRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO1FBQ3pELElBQUksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJO1FBQ2hELElBQUksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJO1FBQ2hELElBQUksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ2xFLFNBQVMsRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUMxQyxRQUFRLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDeEMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDL0IsR0FBRyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakMsT0FBTyxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN2QyxXQUFXLEVBQUUsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQzlDLFFBQVEsRUFBRSxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDeEMsY0FBYyxFQUFFLHdCQUF3QjtRQUN4QyxlQUFlLEVBQUUsS0FBSztLQUN2QixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBM0JZLFFBQUEsZ0NBQWdDLG9DQTJCNUMifQ==
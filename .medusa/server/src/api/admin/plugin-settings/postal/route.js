"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const send_postal_email_1 = require("../../../../workflows/send-postal-email");
const save_postal_settings_1 = require("../../../../workflows/save-postal-settings");
const constants_1 = require("../../../../modules/postal/constants");
const settings_1 = require("../../../../modules/postal/settings");
const test_payload_1 = require("./test-payload");
const trimString = (value) => typeof value === "string" ? value.trim() : "";
const resolvePostalSettingService = (scope) => {
    try {
        return scope.resolve(constants_1.POSTAL_PLUGIN_MODULE);
    }
    catch {
        return null;
    }
};
async function GET(req, res) {
    const service = resolvePostalSettingService(req.scope);
    const settings = await (0, settings_1.getPostalSettings)(service);
    res.json({
        ...(0, settings_1.toPublicPostalSettings)(settings),
        diagnostics: {
            settings_source: "db_over_env",
        },
    });
}
async function POST(req, res) {
    const service = resolvePostalSettingService(req.scope);
    const body = req.validatedBody || req.body || {};
    const action = body.action;
    if (action === "save") {
        const { result: settings, errors } = await (0, save_postal_settings_1.savePostalSettingsWorkflow)(req.scope).run({
            input: body.settings || {},
            throwOnError: false,
        });
        if (errors?.length) {
            throw errors[0].error;
        }
        const validationError = (0, settings_1.validateModeRequirements)(settings);
        return res.json({
            ok: true,
            action: "save",
            code: "postal_settings_saved",
            type: "postal_settings_result",
            status: 200,
            settings: (0, settings_1.toPublicPostalSettings)(settings),
            requires_restart: true,
            ready_for_test: !validationError,
            validation_error: validationError,
        });
    }
    if (action !== "test") {
        return res.status(400).json({
            code: "postal_action_invalid",
            type: "postal_validation_error",
            status: 400,
            message: "Invalid action. Use `save` or `test`.",
        });
    }
    if (body.settings) {
        const { errors } = await (0, save_postal_settings_1.savePostalSettingsWorkflow)(req.scope).run({
            input: body.settings,
            throwOnError: false,
        });
        if (errors?.length) {
            throw errors[0].error;
        }
    }
    const currentSettings = await (0, settings_1.getPostalSettings)(service);
    const validationError = (0, settings_1.validateModeRequirements)(currentSettings);
    if (validationError) {
        return res.status(400).json({
            ok: false,
            action: "test",
            code: "postal_settings_invalid_for_test",
            type: "postal_validation_error",
            status: 400,
            message: validationError,
            settings: (0, settings_1.toPublicPostalSettings)(currentSettings),
            requires_restart: true,
        });
    }
    const to = trimString(body.to) ||
        currentSettings.test_to ||
        currentSettings.from;
    if (!to) {
        return res.status(400).json({
            code: "postal_recipient_missing",
            type: "postal_validation_error",
            status: 400,
            message: "Missing recipient. Provide `to` or set POSTAL_TEST_TO/POSTAL_FROM.",
        });
    }
    const runId = `admin_${Date.now()}`;
    const providerData = (0, test_payload_1.buildPostalAdminTestProviderData)({
        from: currentSettings.from || undefined,
        test_to: currentSettings.test_to || undefined,
        auth_type: currentSettings.auth_type,
    }, body, runId);
    const { result, errors } = await (0, send_postal_email_1.sendPostalEmailWorkflow)(req.scope).run({
        input: {
            to,
            from: currentSettings.from || undefined,
            template: providerData.template,
            provider_data: {
                ...providerData,
                from: currentSettings.from || undefined,
            },
        },
        throwOnError: false,
    });
    if (errors?.length) {
        const message = String(errors[0].error?.message || "");
        if (message.includes("Could not find a notification provider") ||
            message.includes("not loaded")) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal provider is not loaded. Save settings and restart backend.");
        }
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, message || "Postal test send failed");
    }
    return res.json({
        ok: true,
        action: "test",
        code: "postal_test_queued",
        type: "postal_test_result",
        status: 200,
        provider_id: "postal",
        to,
        workflow_run_id: runId,
        result,
        settings: (0, settings_1.toPublicPostalSettings)(currentSettings),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3BsdWdpbi1zZXR0aW5ncy9wb3N0YWwvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFtQ0Esa0JBYUM7QUFFRCxvQkF1SUM7QUF4TEQscURBQXVEO0FBQ3ZELCtFQUFpRjtBQUNqRixxRkFBdUY7QUFDdkYsb0VBQTJFO0FBQzNFLGtFQU00QztBQUM1QyxpREFHdUI7QUFPdkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUNwQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBRS9DLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxLQUVwQyxFQUErQixFQUFFO0lBQ2hDLElBQUksQ0FBQztRQUNILE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQ0FBb0IsQ0FBeUIsQ0FBQTtJQUNwRSxDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FDdkIsR0FBK0IsRUFDL0IsR0FBbUI7SUFFbkIsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSw0QkFBaUIsRUFBQyxPQUFPLENBQUMsQ0FBQTtJQUVqRCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsR0FBRyxJQUFBLGlDQUFzQixFQUFDLFFBQVEsQ0FBQztRQUNuQyxXQUFXLEVBQUU7WUFDWCxlQUFlLEVBQUUsYUFBYTtTQUMvQjtLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUN4QixHQUErQyxFQUMvQyxHQUFtQjtJQUVu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
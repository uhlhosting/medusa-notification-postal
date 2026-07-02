"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const send_postal_email_1 = require("../../../../workflows/send-postal-email");
const save_postal_settings_1 = require("../../../../workflows/save-postal-settings");
const db_1 = require("../../../../modules/postal/db");
const settings_1 = require("../../../../modules/postal/settings");
const test_payload_1 = require("./test-payload");
const trimString = (value) => typeof value === "string" ? value.trim() : "";
async function GET(req, res) {
    const pgConnection = (0, db_1.resolveOptionalPgConnection)(req.scope);
    const settings = await (0, settings_1.getPostalSettings)(pgConnection);
    res.json({
        ...(0, settings_1.toPublicPostalSettings)(settings),
        diagnostics: {
            settings_source: "db_over_env",
        },
    });
}
async function POST(req, res) {
    const pgConnection = (0, db_1.resolveOptionalPgConnection)(req.scope);
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
    const currentSettings = await (0, settings_1.getPostalSettings)(pgConnection);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3BsdWdpbi1zZXR0aW5ncy9wb3N0YWwvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF3QkEsa0JBYUM7QUFFRCxvQkF1SUM7QUE3S0QscURBQXVEO0FBQ3ZELCtFQUFpRjtBQUNqRixxRkFBdUY7QUFDdkYsc0RBQTJFO0FBQzNFLGtFQUs0QztBQUM1QyxpREFHdUI7QUFPdkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUNwQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBRXhDLEtBQUssVUFBVSxHQUFHLENBQ3ZCLEdBQStCLEVBQy9CLEdBQW1CO0lBRW5CLE1BQU0sWUFBWSxHQUFHLElBQUEsZ0NBQTJCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzNELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSw0QkFBaUIsRUFBQyxZQUFZLENBQUMsQ0FBQTtJQUV0RCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsR0FBRyxJQUFBLGlDQUFzQixFQUFDLFFBQVEsQ0FBQztRQUNuQyxXQUFXLEVBQUU7WUFDWCxlQUFlLEVBQUUsYUFBYTtTQUMvQjtLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUN4QixHQUErQyxFQUMvQyxHQUFtQjtJQUVuQixNQUFNLFlBQVksR0FBRyxJQUFBLGdDQUEyQixFQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUMzRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFBO0lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7SUFF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
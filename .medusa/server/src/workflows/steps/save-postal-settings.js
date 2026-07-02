"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePostalSettingsStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const db_1 = require("../../modules/postal/db");
const settings_1 = require("../../modules/postal/settings");
exports.savePostalSettingsStep = (0, workflows_sdk_1.createStep)("save-postal-settings", async (payload, { container }) => {
    const pgConnection = (0, db_1.resolveOptionalPgConnection)(container);
    const settings = await (0, settings_1.persistPostalSettings)(pgConnection, payload);
    return new workflows_sdk_1.StepResponse(settings);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZS1wb3N0YWwtc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NhdmUtcG9zdGFsLXNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxnREFBcUU7QUFFckUsNERBQXFFO0FBRXhELFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwwQkFBVSxFQUM5QyxzQkFBc0IsRUFDdEIsS0FBSyxFQUFFLE9BQTRCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ3BELE1BQU0sWUFBWSxHQUFHLElBQUEsZ0NBQTJCLEVBQUMsU0FBUyxDQUFDLENBQUE7SUFDM0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGdDQUFxQixFQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUVuRSxPQUFPLElBQUksNEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNuQyxDQUFDLENBQ0YsQ0FBQSJ9
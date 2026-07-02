"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePostalSettingsWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const save_postal_settings_1 = require("./steps/save-postal-settings");
exports.savePostalSettingsWorkflow = (0, workflows_sdk_1.createWorkflow)("save-postal-settings", (payload) => {
    return new workflows_sdk_1.WorkflowResponse((0, save_postal_settings_1.savePostalSettingsStep)(payload));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZS1wb3N0YWwtc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3NhdmUtcG9zdGFsLXNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUkwQztBQUsxQyx1RUFBcUU7QUFJeEQsUUFBQSwwQkFBMEIsR0FJbkMsSUFBQSw4QkFBYyxFQUNoQixzQkFBc0IsRUFDdEIsQ0FBQyxPQUF3QyxFQUFFLEVBQUU7SUFDM0MsT0FBTyxJQUFJLGdDQUFnQixDQUFDLElBQUEsNkNBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtBQUM5RCxDQUFDLENBQ0YsQ0FBQSJ9
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePostalSettingsStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const constants_1 = require("../../modules/postal/constants");
const settings_1 = require("../../modules/postal/settings");
const resolvePostalSettingService = (container) => {
    try {
        return container.resolve(constants_1.POSTAL_PLUGIN_MODULE);
    }
    catch {
        return null;
    }
};
exports.savePostalSettingsStep = (0, workflows_sdk_1.createStep)("save-postal-settings", async (payload, { container }) => {
    const service = resolvePostalSettingService(container);
    const settings = await (0, settings_1.persistPostalSettings)(service, payload);
    return new workflows_sdk_1.StepResponse(settings);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZS1wb3N0YWwtc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3NhdmUtcG9zdGFsLXNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSw4REFBcUU7QUFLckUsNERBQXFFO0FBRXJFLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxTQUVwQyxFQUErQixFQUFFO0lBQ2hDLElBQUksQ0FBQztRQUNILE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQ0FBb0IsQ0FBeUIsQ0FBQTtJQUN4RSxDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBRVksUUFBQSxzQkFBc0IsR0FBRyxJQUFBLDBCQUFVLEVBQzlDLHNCQUFzQixFQUN0QixLQUFLLEVBQUUsT0FBNEIsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDcEQsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDdEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGdDQUFxQixFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUU5RCxPQUFPLElBQUksNEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNuQyxDQUFDLENBQ0YsQ0FBQSJ9
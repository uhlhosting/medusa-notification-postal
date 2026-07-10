"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalSetting = void 0;
const utils_1 = require("@medusajs/framework/utils");
// Non-secret Postal configuration persisted in the plugin module.
// Secrets (POSTAL_API_KEY, POSTAL_WEBHOOK_TOKEN) are intentionally NOT stored
// here — they are sourced from provider options / environment at boot only.
exports.PostalSetting = utils_1.model.define("postal_setting", {
    id: utils_1.model.text().primaryKey(),
    auth_type: utils_1.model.text().default("smtp-api"),
    from_address: utils_1.model.text().default(""),
    base_url: utils_1.model.text().default(""),
    test_to: utils_1.model.text().default(""),
    pending_restart: utils_1.model.boolean().default(false),
});
exports.default = exports.PostalSetting;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLXNldHRpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvbW9kZWxzL3Bvc3RhbC1zZXR0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUFpRDtBQUVqRCxrRUFBa0U7QUFDbEUsOEVBQThFO0FBQzlFLDRFQUE0RTtBQUMvRCxRQUFBLGFBQWEsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFO0lBQzFELEVBQUUsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBQzdCLFNBQVMsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUMzQyxZQUFZLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7SUFDdEMsUUFBUSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0lBQ2xDLE9BQU8sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUNqQyxlQUFlLEVBQUUsYUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Q0FDaEQsQ0FBQyxDQUFBO0FBRUYsa0JBQWUscUJBQWEsQ0FBQSJ9
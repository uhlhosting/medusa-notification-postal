"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const postal_setting_1 = __importDefault(require("./models/postal-setting"));
class PostalPluginModuleService extends (0, utils_1.MedusaService)({
    PostalSetting: postal_setting_1.default,
}) {
}
exports.default = PostalPluginModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC9zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEscURBQXlEO0FBQ3pELDZFQUFtRDtBQUVuRCxNQUFNLHlCQUEwQixTQUFRLElBQUEscUJBQWEsRUFBQztJQUNwRCxhQUFhLEVBQWIsd0JBQWE7Q0FDZCxDQUFDO0NBQUc7QUFFTCxrQkFBZSx5QkFBeUIsQ0FBQSJ9
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSTAL_PLUGIN_MODULE = void 0;
const utils_1 = require("@medusajs/framework/utils");
const service_1 = __importDefault(require("./service"));
exports.POSTAL_PLUGIN_MODULE = "postalPlugin";
exports.default = (0, utils_1.Module)(exports.POSTAL_PLUGIN_MODULE, {
    service: service_1.default,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEscURBQWtEO0FBQ2xELHdEQUFpRDtBQUVwQyxRQUFBLG9CQUFvQixHQUFHLGNBQWMsQ0FBQTtBQUVsRCxrQkFBZSxJQUFBLGNBQU0sRUFBQyw0QkFBb0IsRUFBRTtJQUMxQyxPQUFPLEVBQUUsaUJBQXlCO0NBQ25DLENBQUMsQ0FBQSJ9
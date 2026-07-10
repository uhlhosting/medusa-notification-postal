"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSTAL_PLUGIN_MODULE = void 0;
const utils_1 = require("@medusajs/framework/utils");
const service_1 = __importDefault(require("./service"));
const sync_postal_settings_1 = __importDefault(require("./loaders/sync-postal-settings"));
var constants_1 = require("./constants");
Object.defineProperty(exports, "POSTAL_PLUGIN_MODULE", { enumerable: true, get: function () { return constants_1.POSTAL_PLUGIN_MODULE; } });
const constants_2 = require("./constants");
exports.default = (0, utils_1.Module)(constants_2.POSTAL_PLUGIN_MODULE, {
    service: service_1.default,
    loaders: [sync_postal_settings_1.default],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEscURBQWtEO0FBQ2xELHdEQUFpRDtBQUNqRCwwRkFBcUU7QUFFckUseUNBQWtEO0FBQXpDLGlIQUFBLG9CQUFvQixPQUFBO0FBRTdCLDJDQUFrRDtBQUVsRCxrQkFBZSxJQUFBLGNBQU0sRUFBQyxnQ0FBb0IsRUFBRTtJQUMxQyxPQUFPLEVBQUUsaUJBQXlCO0lBQ2xDLE9BQU8sRUFBRSxDQUFDLDhCQUF3QixDQUFDO0NBQ3BDLENBQUMsQ0FBQSJ9
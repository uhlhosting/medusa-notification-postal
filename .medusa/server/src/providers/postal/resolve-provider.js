"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePostalProvider = exports.POSTAL_PROVIDER_ID = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.POSTAL_PROVIDER_ID = "postal";
const resolvePostalProvider = (scope) => {
    const notificationModule = scope.resolve(utils_1.Modules.NOTIFICATION);
    const service = notificationModule.notificationProviderService_
        ?.retrieveProviderRegistration(exports.POSTAL_PROVIDER_ID);
    if (!service) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, "Postal notification provider is not loaded");
    }
    return service;
};
exports.resolvePostalProvider = resolvePostalProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9wcm92aWRlcnMvcG9zdGFsL3Jlc29sdmUtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWdFO0FBR25ELFFBQUEsa0JBQWtCLEdBQUcsUUFBUSxDQUFBO0FBWW5DLE1BQU0scUJBQXFCLEdBQUcsQ0FDbkMsS0FBb0IsRUFDTyxFQUFFO0lBQzdCLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FDdEMsZUFBTyxDQUFDLFlBQVksQ0FDcUIsQ0FBQTtJQUMzQyxNQUFNLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyw0QkFBNEI7UUFDN0QsRUFBRSw0QkFBNEIsQ0FBQywwQkFBa0IsQ0FBQyxDQUFBO0lBRXBELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFDbEMsNENBQTRDLENBQzdDLENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTyxPQUFvQyxDQUFBO0FBQzdDLENBQUMsQ0FBQTtBQWpCWSxRQUFBLHFCQUFxQix5QkFpQmpDIn0=
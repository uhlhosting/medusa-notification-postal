"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePostalProvider = exports.POSTAL_PROVIDER_CONTAINER_KEY = void 0;
const utils_1 = require("@medusajs/framework/utils");
// Notification providers are registered by Medusa as `np_<provider id>`.
// The consuming application configures this provider with the stable id
// `postal`, so routes must resolve the generated container key rather than the
// provider class identifier (`notification-postal`).
exports.POSTAL_PROVIDER_CONTAINER_KEY = "np_postal";
const resolvePostalProvider = (scope) => {
    const service = scope.resolve(exports.POSTAL_PROVIDER_CONTAINER_KEY);
    if (!service) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, "Postal notification provider is not loaded");
    }
    return service;
};
exports.resolvePostalProvider = resolvePostalProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9wcm92aWRlcnMvcG9zdGFsL3Jlc29sdmUtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXVEO0FBR3ZELHlFQUF5RTtBQUN6RSx3RUFBd0U7QUFDeEUsK0VBQStFO0FBQy9FLHFEQUFxRDtBQUN4QyxRQUFBLDZCQUE2QixHQUFHLFdBQVcsQ0FBQTtBQU1qRCxNQUFNLHFCQUFxQixHQUFHLENBQ25DLEtBQW9CLEVBQ08sRUFBRTtJQUM3QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLHFDQUE2QixDQUFDLENBQUE7SUFFNUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUNsQyw0Q0FBNEMsQ0FDN0MsQ0FBQTtJQUNILENBQUM7SUFFRCxPQUFPLE9BQW9DLENBQUE7QUFDN0MsQ0FBQyxDQUFBO0FBYlksUUFBQSxxQkFBcUIseUJBYWpDIn0=
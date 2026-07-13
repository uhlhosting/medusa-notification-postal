"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const resolve_provider_1 = require("../../../../../providers/postal/resolve-provider");
const GET = async (req, res) => {
    const id = String(req.params.id || "").trim();
    const numericId = Number.parseInt(id, 10);
    if (!id || !Number.isFinite(numericId) || String(numericId) !== id) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal message lookup requires a numeric message id");
    }
    // Delegate to the resolved provider service instead of re-implementing the
    // Postal HTTP client and reading process.env directly. This keeps credential
    // and transport logic in one place (module -> provider -> route layering).
    const service = (0, resolve_provider_1.resolvePostalProvider)(req.scope);
    const [message, deliveries] = await Promise.all([
        service.getMessageDetails(numericId),
        service.getMessageDeliveries(numericId),
    ]);
    return res.status(200).json({
        id: numericId,
        message,
        deliveries,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9tZXNzYWdlcy9baWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUlBLHFEQUF1RDtBQUN2RCx1RkFBd0Y7QUFFakYsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUErQixFQUMvQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzdDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBRXpDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUNuRSxNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5QixxREFBcUQsQ0FDdEQsQ0FBQTtJQUNILENBQUM7SUFFRCwyRUFBMkU7SUFDM0UsNkVBQTZFO0lBQzdFLDJFQUEyRTtJQUMzRSxNQUFNLE9BQU8sR0FBRyxJQUFBLHdDQUFxQixFQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUVoRCxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUM5QyxPQUFPLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUM7S0FDeEMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMxQixFQUFFLEVBQUUsU0FBUztRQUNiLE9BQU87UUFDUCxVQUFVO0tBQ1gsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBN0JZLFFBQUEsR0FBRyxPQTZCZiJ9
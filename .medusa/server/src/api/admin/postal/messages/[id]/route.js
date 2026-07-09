"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    const id = String(req.params.id || "").trim();
    const numericId = Number.parseInt(id, 10);
    if (!id || !Number.isFinite(numericId) || String(numericId) !== id) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal message lookup requires a numeric message id");
    }
    // Delegate to the resolved provider service instead of re-implementing the
    // Postal HTTP client and reading process.env directly. This keeps credential
    // and transport logic in one place (module -> provider -> route layering).
    const service = req.scope.resolve("notification-postal");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9tZXNzYWdlcy9baWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUlBLHFEQUF1RDtBQUdoRCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQ3RCLEdBQStCLEVBQy9CLEdBQW1CLEVBQ25CLEVBQUU7SUFDRixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDN0MsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFekMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1FBQ25FLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLHFEQUFxRCxDQUN0RCxDQUFBO0lBQ0gsQ0FBQztJQUVELDJFQUEyRTtJQUMzRSw2RUFBNkU7SUFDN0UsMkVBQTJFO0lBQzNFLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUMvQixxQkFBcUIsQ0FDTyxDQUFBO0lBRTlCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQzlDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7UUFDcEMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQztLQUN4QyxDQUFDLENBQUE7SUFFRixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLEVBQUUsRUFBRSxTQUFTO1FBQ2IsT0FBTztRQUNQLFVBQVU7S0FDWCxDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUEvQlksUUFBQSxHQUFHLE9BK0JmIn0=
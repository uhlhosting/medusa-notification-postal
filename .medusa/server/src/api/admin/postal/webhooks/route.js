"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const db_1 = require("../../../../modules/postal/db");
const webhooks_1 = require("../../../../modules/postal/webhooks");
const GET = async (req, res) => {
    const pgConnection = (0, db_1.resolveOptionalPgConnection)(req.scope);
    const limit = Number.parseInt(String(req.query.limit || "25"), 10);
    const events = await (0, webhooks_1.listPostalWebhookEvents)(pgConnection, limit);
    return res.status(200).json({
        events,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC93ZWJob29rcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSxzREFBMkU7QUFDM0Usa0VBQTZFO0FBRXRFLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUErQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNoRixNQUFNLFlBQVksR0FBRyxJQUFBLGdDQUEyQixFQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUMzRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUNsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsa0NBQXVCLEVBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBRWpFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUIsTUFBTTtLQUNQLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQVJZLFFBQUEsR0FBRyxPQVFmIn0=
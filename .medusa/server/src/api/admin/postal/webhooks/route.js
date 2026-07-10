"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const constants_1 = require("../../../../modules/postal/constants");
const webhooks_1 = require("../../../../modules/postal/webhooks");
const GET = async (req, res) => {
    let service = null;
    try {
        service = req.scope.resolve(constants_1.POSTAL_PLUGIN_MODULE);
    }
    catch {
        service = null;
    }
    const limit = Number.parseInt(String(req.query.limit || "25"), 10);
    const events = await (0, webhooks_1.listPostalWebhookEvents)(service, limit);
    return res.status(200).json({
        events,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC93ZWJob29rcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSxvRUFBMkU7QUFDM0Usa0VBRzRDO0FBRXJDLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUErQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNoRixJQUFJLE9BQU8sR0FBcUMsSUFBSSxDQUFBO0lBQ3BELElBQUksQ0FBQztRQUNILE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQ0FBb0IsQ0FBOEIsQ0FBQTtJQUNoRixDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxHQUFHLElBQUksQ0FBQTtJQUNoQixDQUFDO0lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGtDQUF1QixFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUU1RCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLE1BQU07S0FDUCxDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUFkWSxRQUFBLEdBQUcsT0FjZiJ9
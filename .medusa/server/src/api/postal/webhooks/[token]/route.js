"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const utils_1 = require("@medusajs/framework/utils");
const node_crypto_1 = require("node:crypto");
const record_postal_webhook_1 = require("../../../../workflows/record-postal-webhook");
const normalizeToken = (value) => typeof value === "string" ? value.trim() : "";
const tokenMatches = (provided, expected) => {
    if (!provided || !expected || provided.length !== expected.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(Buffer.from(provided), Buffer.from(expected));
};
const POST = async (req, res) => {
    const providedToken = normalizeToken(req.params.token);
    const expectedToken = normalizeToken(process.env.POSTAL_WEBHOOK_TOKEN);
    if (!providedToken || !expectedToken || !tokenMatches(providedToken, expectedToken)) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_ALLOWED, "Invalid Postal webhook token");
    }
    const payload = (req.validatedBody || req.body || {});
    const { result } = await (0, record_postal_webhook_1.recordPostalWebhookWorkflow)(req.scope).run({
        input: payload,
    });
    if (!result) {
        return res.status(202).json({
            ok: true,
            ignored: true,
        });
    }
    return res.status(202).json({
        ok: true,
        id: result.id,
        event_type: result.event_type,
        status: result.status,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Bvc3RhbC93ZWJob29rcy9bdG9rZW5dL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFEQUF1RDtBQUN2RCw2Q0FBNkM7QUFDN0MsdUZBQXlGO0FBRXpGLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FDeEMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUUvQyxNQUFNLFlBQVksR0FBRyxDQUFDLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQzFELElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEUsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsT0FBTyxJQUFBLDZCQUFlLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7QUFDdEUsQ0FBQyxDQUFBO0FBRU0sTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUE7SUFFdEUsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNwRixNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUM3Qiw4QkFBOEIsQ0FDL0IsQ0FBQTtJQUNILENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQTRCLENBQUE7SUFFaEYsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBQSxtREFBMkIsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ2xFLEtBQUssRUFBRSxPQUFPO0tBQ2YsQ0FBQyxDQUFBO0lBRUYsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixFQUFFLEVBQUUsSUFBSTtZQUNSLE9BQU8sRUFBRSxJQUFJO1NBQ2QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUIsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7UUFDYixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7UUFDN0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO0tBQ3RCLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQTlCWSxRQUFBLElBQUksUUE4QmhCIn0=
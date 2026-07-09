"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../../../../modules/postal/constants");
const settings_1 = require("../../../../modules/postal/settings");
const toAbsoluteOrigin = (value) => {
    const candidate = String(value || "").trim();
    if (!candidate) {
        return null;
    }
    try {
        return new URL(candidate).origin.replace(/\/+$/, "");
    }
    catch {
        return null;
    }
};
const getRequestOrigin = (req) => {
    const headers = req.headers || {};
    const originHeader = toAbsoluteOrigin(headers.origin || headers["origin"]);
    if (originHeader) {
        return originHeader;
    }
    const forwardedProto = String(headers["x-forwarded-proto"] || headers["x-forwarded-protocol"] || "")
        .split(",")[0]
        .trim();
    const forwardedHost = String(headers["x-forwarded-host"] || headers.host || "")
        .split(",")[0]
        .trim();
    if (!forwardedHost) {
        return (toAbsoluteOrigin(process.env.MEDUSA_BACKEND_URL) ||
            toAbsoluteOrigin(process.env.VITE_BACKEND_URL));
    }
    const isLocalHost = /^localhost(?::\d+)?$/i.test(forwardedHost) ||
        /^127\.0\.0\.1(?::\d+)?$/i.test(forwardedHost) ||
        /^\[::1\](?::\d+)?$/i.test(forwardedHost) ||
        /\.local(?::\d+)?$/i.test(forwardedHost);
    const protocol = forwardedProto || (isLocalHost ? "http" : "https");
    return (toAbsoluteOrigin(`${protocol}://${forwardedHost}`) ||
        toAbsoluteOrigin(process.env.MEDUSA_BACKEND_URL) ||
        toAbsoluteOrigin(process.env.VITE_BACKEND_URL));
};
const resolvePostalSettingService = (scope) => {
    try {
        return scope.resolve(constants_1.POSTAL_PLUGIN_MODULE);
    }
    catch {
        return null;
    }
};
const GET = async (req, res) => {
    const service = resolvePostalSettingService(req.scope);
    const settings = await (0, settings_1.getPostalSettings)(service);
    const token = String(settings.webhook_token || "").trim();
    const origin = getRequestOrigin(req);
    if (!token) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Postal webhook token is not configured. Set POSTAL_WEBHOOK_TOKEN in the backend environment.");
    }
    return res.status(200).json({
        token,
        path: `/postal/webhooks/${token}`,
        callback_url: origin
            ? new URL(`/postal/webhooks/${token}`, origin).toString()
            : null,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC93ZWJob29rLXVybC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSxxREFBdUQ7QUFDdkQsb0VBQTJFO0FBQzNFLGtFQUc0QztBQUU1QyxNQUFNLGdCQUFnQixHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUU7SUFDMUMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUM1QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDZixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCxPQUFPLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3RELENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBK0IsRUFBRSxFQUFFO0lBQzNELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFBO0lBQ2pDLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7SUFDMUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNqQixPQUFPLFlBQVksQ0FBQTtJQUNyQixDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUMzQixPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxPQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLENBQ3RFO1NBQ0UsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMs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
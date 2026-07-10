"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalWebhookEvent = void 0;
const utils_1 = require("@medusajs/framework/utils");
// Persisted Postal delivery/webhook events. Maps to the existing
// "postal_webhook_events" table (the model name is the table name).
exports.PostalWebhookEvent = utils_1.model.define("postal_webhook_events", {
    id: utils_1.model.text().primaryKey(),
    event_type: utils_1.model.text(),
    status: utils_1.model.text(),
    message_id: utils_1.model.text().nullable(),
    recipient: utils_1.model.text().nullable(),
    occurred_at: utils_1.model.dateTime().nullable(),
    payload: utils_1.model.json(),
});
exports.default = exports.PostalWebhookEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGFsLXdlYmhvb2stZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvbW9kZWxzL3Bvc3RhbC13ZWJob29rLWV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUFpRDtBQUVqRCxpRUFBaUU7QUFDakUsb0VBQW9FO0FBQ3ZELFFBQUEsa0JBQWtCLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRTtJQUN0RSxFQUFFLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUM3QixVQUFVLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUN4QixNQUFNLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUNwQixVQUFVLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNuQyxTQUFTLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNsQyxXQUFXLEVBQUUsYUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN4QyxPQUFPLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtDQUN0QixDQUFDLENBQUE7QUFFRixrQkFBZSwwQkFBa0IsQ0FBQSJ9
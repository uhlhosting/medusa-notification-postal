import { model } from "@medusajs/framework/utils"

// Persisted Postal delivery/webhook events. Maps to the existing
// "postal_webhook_events" table (the model name is the table name).
export const PostalWebhookEvent = model.define("postal_webhook_events", {
  id: model.text().primaryKey(),
  event_type: model.text(),
  status: model.text(),
  message_id: model.text().nullable(),
  recipient: model.text().nullable(),
  occurred_at: model.dateTime().nullable(),
  payload: model.json(),
})

export default PostalWebhookEvent

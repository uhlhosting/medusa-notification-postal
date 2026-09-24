import { model } from "@medusajs/framework/utils"

// Persisted Postal delivery/webhook events. Maps to the existing
// "postal_webhook_events" table (the model name is the table name).
// Idempotency comes from the primary key: the id is derived from the Postal
// delivery uuid. There is deliberately no unique (message_id, event_type)
// index — Postal repeats MessageLoaded/MessageLinkClicked/MessageDelayed for
// one message, and each of those is a distinct event.
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

import { model } from "@medusajs/framework/utils"

// Persisted Postal delivery/webhook events. Maps to the existing
// "postal_webhook_events" table (the model name is the table name).
export const PostalWebhookEvent = model.define("postal_webhook_events", {
  id: model.text().primaryKey(),
  event_type: model.text(),
  status: model.text(),
  message_id: model.text().nullable(),
  // Retained for database compatibility with pre-0.7.2 installations. New
  // events always write NULL and the forward migration redacts historic rows.
  recipient: model.text().nullable(),
  occurred_at: model.dateTime().nullable(),
  // New events store an empty object only. The column remains until a future
  // major migration can remove it without breaking older installations.
  payload: model.json(),
})
// No unique (message_id, event_type) index: Postal repeats MessageLoaded,
// MessageLinkClicked and MessageDelayed for one message, and each is a
// distinct event. Idempotency comes from the primary key, which is derived
// from the Postal delivery uuid (see recordPostalWebhookEventOutcome).

export default PostalWebhookEvent

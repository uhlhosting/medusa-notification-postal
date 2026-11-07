import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Drops the unique (message_id, event_type) index added by
 * Migration20260904010000. Postal sends MessageLoaded, MessageLinkClicked and
 * MessageDelayed more than once for one message, and its to/cc/bcc copies
 * share the RFC Message-ID, so that index rejected distinct events with a
 * 400. Recording is now idempotent per Postal delivery through the primary
 * key, which is derived from the envelope uuid.
 *
 * Rows that migration soft-deleted are not restored: their payloads were
 * already redacted. The webhook retention purge hard-deletes them once they
 * pass `webhook_event_retention_days`.
 */
export class Migration20261107090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_postal_webhook_message_event_unique";`
    )
  }

  override async down(): Promise<void> {
    // Recreating the unique index would fail once repeated events exist, so
    // the reverse step adds a plain lookup index instead.
    this.addSql(
      `create index if not exists "IDX_postal_webhook_message_event" on "postal_webhook_events" ("message_id", "event_type") where "deleted_at" is null;`
    )
  }
}

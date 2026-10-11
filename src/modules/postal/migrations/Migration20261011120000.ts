import { MedusaError } from "@medusajs/framework/utils"
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261011120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "postal_webhook_events" add column if not exists "replay_key" text null;`)
    this.addSql(`alter table "postal_webhook_events" add column if not exists "published_at" timestamptz null, add column if not exists "publication_owner" text null, add column if not exists "publication_expires_at" timestamptz null;`)
    // Historical callbacks were already best-effort published; do not replay them.
    this.addSql(`update "postal_webhook_events" set published_at = created_at where replay_key is null and published_at is null;`)
    this.addSql(`drop index if exists "IDX_postal_webhook_message_event_unique";`)
    this.addSql(`create unique index if not exists "IDX_postal_webhook_replay_unique" on "postal_webhook_events" ("replay_key") where "deleted_at" is null;`)
  }
  override async down(): Promise<void> {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Postal replay/publication migration cannot be reverted automatically; preserve durable receipts and use an operator-reviewed rollback plan")
  }
}

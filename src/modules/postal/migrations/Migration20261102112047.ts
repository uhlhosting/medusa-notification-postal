import { MedusaError } from "@medusajs/framework/utils"
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Callback replay keys and publication leases (1.0.0). Shipped as
 * `Migration20261011120000`, a name `@uhlhosting/medusa-plugin-marketing-mautic`
 * 2.0.0 also uses. Medusa records every module's migrations by name alone in
 * the shared `mikro_orm_migrations` table, so whichever plugin migrated second
 * was marked done without running.
 *
 * Under this name it runs everywhere, including databases where the old name
 * did apply it, so every statement must be safe to repeat. The DDL is
 * idempotent. Marking historical callbacks as published runs only while
 * `replay_key` is still absent: run again, it would mark current unpublished
 * receipts as published and they would never be replayed.
 */
export class Migration20261102112047 extends Migration {
  override async up(): Promise<void> {
    // Historical callbacks were already best-effort published; do not replay them.
    this.addSql(`do $$ begin if to_regclass('postal_webhook_events') is not null and not exists (select 1 from pg_attribute where attrelid = to_regclass('postal_webhook_events') and attname = 'replay_key' and not attisdropped) then execute 'alter table "postal_webhook_events" add column if not exists "replay_key" text null, add column if not exists "published_at" timestamptz null'; execute 'update "postal_webhook_events" set published_at = created_at where replay_key is null and published_at is null'; end if; end $$;`)
    this.addSql(`alter table "postal_webhook_events" add column if not exists "replay_key" text null;`)
    this.addSql(`alter table "postal_webhook_events" add column if not exists "published_at" timestamptz null, add column if not exists "publication_owner" text null, add column if not exists "publication_expires_at" timestamptz null;`)
    this.addSql(`drop index if exists "IDX_postal_webhook_message_event_unique";`)
    this.addSql(`create unique index if not exists "IDX_postal_webhook_replay_unique" on "postal_webhook_events" ("replay_key") where "deleted_at" is null;`)
  }
  override async down(): Promise<void> {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Postal replay/publication migration cannot be reverted automatically; preserve durable receipts and use an operator-reviewed rollback plan")
  }
}

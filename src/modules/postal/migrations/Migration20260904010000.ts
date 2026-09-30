import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260904010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `with ranked as (select "id", row_number() over (partition by "message_id", "event_type" order by "created_at" asc, "id" asc) as row_number from "postal_webhook_events" where "deleted_at" is null and "message_id" is not null) update "postal_webhook_events" as event set "deleted_at" = now(), "updated_at" = now() from ranked where event."id" = ranked."id" and ranked.row_number > 1;`
    )
    this.addSql(
      `create unique index if not exists "IDX_postal_webhook_message_event_unique" on "postal_webhook_events" ("message_id", "event_type") where "deleted_at" is null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_postal_webhook_message_event_unique";`
    )
  }
}

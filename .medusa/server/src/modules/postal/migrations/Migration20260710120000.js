"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260710120000 = void 0;
const migrations_1 = require("@medusajs/framework/mikro-orm/migrations");
class Migration20260710120000 extends migrations_1.Migration {
    async up() {
        this.addSql(`create table if not exists "postal_setting" ("id" text not null, "auth_type" text not null default 'smtp-api', "from_address" text not null default '', "base_url" text not null default '', "test_to" text not null default '', "pending_restart" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "postal_setting_pkey" primary key ("id"));`);
        // The webhook events table is now backed by a DML model. Ensure it exists
        // with the full DML column set (fresh installs) and backfill the DML
        // bookkeeping columns on tables created by the plugin's original migration.
        this.addSql(`create table if not exists "postal_webhook_events" ("id" text not null, "event_type" text not null, "status" text not null, "message_id" text, "recipient" text, "occurred_at" timestamptz, "payload" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "postal_webhook_events_pkey" primary key ("id"));`);
        this.addSql(`alter table "postal_webhook_events" add column if not exists "updated_at" timestamptz not null default now();`);
        this.addSql(`alter table "postal_webhook_events" add column if not exists "deleted_at" timestamptz null;`);
        // The generic, cross-plugin "admin_plugin_settings" key/value table is no
        // longer used — non-secret settings now live in "postal_setting".
        this.addSql(`drop table if exists "admin_plugin_settings" cascade;`);
    }
    async down() {
        this.addSql(`drop table if exists "postal_setting" cascade;`);
        this.addSql(`create table if not exists "admin_plugin_settings" ("key" text not null, "value" jsonb not null, "updated_at" timestamptz not null default now(), constraint "admin_plugin_settings_pkey" primary key ("key"));`);
    }
}
exports.Migration20260710120000 = Migration20260710120000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjA3MTAxMjAwMDAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvbWlncmF0aW9ucy9NaWdyYXRpb24yMDI2MDcxMDEyMDAwMC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5RUFBb0U7QUFFcEUsTUFBYSx1QkFBd0IsU0FBUSxzQkFBUztJQUMzQyxLQUFLLENBQUMsRUFBRTtRQUNmLElBQUksQ0FBQyxNQUFNLENBQ1QsMmNBQTJjLENBQzVjLENBQUE7UUFFRCwwRUFBMEU7UUFDMUUscUVBQXFFO1FBQ3JFLDRFQUE0RTtRQUM1RSxJQUFJLENBQUMsTUFBTSxDQUNULHFaQUFxWixDQUN0WixDQUFBO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FDVCwrR0FBK0csQ0FDaEgsQ0FBQTtRQUNELElBQUksQ0FBQyxNQUFNLENBQ1QsNkZBQTZGLENBQzlGLENBQUE7UUFFRCwwRUFBMEU7UUFDMUUsa0VBQWtFO1FBQ2xFLElBQUksQ0FBQyxNQUFNLENBQUMsdURBQXVELENBQUMsQ0FBQTtJQUN0RSxDQUFDO0lBRVEsS0FBSyxDQUFDLElBQUk7UUFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1FBRTdELElBQUksQ0FBQyxNQUFNLENBQ1QsaU5BQWlOLENBQ2xOLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUEvQkQsMERBK0JDIn0=
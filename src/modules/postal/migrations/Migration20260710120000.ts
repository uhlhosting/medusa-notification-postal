import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260710120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "postal_setting" ("id" text not null, "auth_type" text not null default 'smtp-api', "from_address" text not null default '', "base_url" text not null default '', "test_to" text not null default '', "pending_restart" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "postal_setting_pkey" primary key ("id"));`
    )

    // Ensure the webhook events table exists even if this module's migrations
    // supersede the plugin's original top-level migration (idempotent).
    this.addSql(
      `create table if not exists "postal_webhook_events" ("id" text not null, "event_type" text not null, "status" text not null, "message_id" text, "recipient" text, "occurred_at" timestamptz, "payload" jsonb not null, "created_at" timestamptz not null default now(), constraint "postal_webhook_events_pkey" primary key ("id"));`
    )

    // The generic, cross-plugin "admin_plugin_settings" key/value table is no
    // longer used — non-secret settings now live in "postal_setting".
    this.addSql(`drop table if exists "admin_plugin_settings" cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "postal_setting" cascade;`)

    this.addSql(
      `create table if not exists "admin_plugin_settings" ("key" text not null, "value" jsonb not null, "updated_at" timestamptz not null default now(), constraint "admin_plugin_settings_pkey" primary key ("key"));`
    )
  }
}

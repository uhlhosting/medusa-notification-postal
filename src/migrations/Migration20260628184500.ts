import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260628184500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_plugin_settings" (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "postal_webhook_events" (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        message_id TEXT,
        recipient TEXT,
        occurred_at TIMESTAMPTZ,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "postal_webhook_events"`)
    this.addSql(`DROP TABLE IF EXISTS "admin_plugin_settings"`)
  }
}

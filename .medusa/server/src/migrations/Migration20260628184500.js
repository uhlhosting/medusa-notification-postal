"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260628184500 = void 0;
const migrations_1 = require("@medusajs/framework/mikro-orm/migrations");
class Migration20260628184500 extends migrations_1.Migration {
    async up() {
        this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_plugin_settings" (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
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
    `);
    }
    async down() {
        this.addSql(`DROP TABLE IF EXISTS "postal_webhook_events"`);
        this.addSql(`DROP TABLE IF EXISTS "admin_plugin_settings"`);
    }
}
exports.Migration20260628184500 = Migration20260628184500;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjA2MjgxODQ1MDAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbWlncmF0aW9ucy9NaWdyYXRpb24yMDI2MDYyODE4NDUwMC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5RUFBb0U7QUFFcEUsTUFBYSx1QkFBd0IsU0FBUSxzQkFBUztJQUMzQyxLQUFLLENBQUMsRUFBRTtRQUNmLElBQUksQ0FBQyxNQUFNLENBQUM7Ozs7OztLQU1YLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLENBQUM7Ozs7Ozs7Ozs7O0tBV1gsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVRLEtBQUssQ0FBQyxJQUFJO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsOENBQThDLENBQUMsQ0FBQTtRQUMzRCxJQUFJLENBQUMsTUFBTSxDQUFDLDhDQUE4QyxDQUFDLENBQUE7SUFDN0QsQ0FBQztDQUNGO0FBNUJELDBEQTRCQyJ9
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Delivery activity is operational metadata, not a mail archive. Existing
 * webhook rows may contain recipients, message content, URLs, and headers, so
 * scrub them when the redacted activity contract is adopted. This migration is
 * intentionally irreversible: restoring personal data from a migration would
 * violate the retention policy.
 */
export class Migration20261007090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `update "postal_webhook_events" set "recipient" = null, "payload" = '{}'::jsonb, "updated_at" = now() where "recipient" is not null or "payload" <> '{}'::jsonb;`
    )
  }

  override async down(): Promise<void> {
    // Redaction is deliberately irreversible.
  }
}

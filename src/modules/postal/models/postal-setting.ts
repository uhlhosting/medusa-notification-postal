import { model } from "@medusajs/framework/utils"

// Non-secret Postal configuration persisted in the plugin module.
// Secrets (POSTAL_API_KEY, POSTAL_WEBHOOK_TOKEN) are intentionally NOT stored
// here — they are sourced from provider options / environment at boot only.
export const PostalSetting = model.define("postal_setting", {
  id: model.text().primaryKey(),
  auth_type: model.text().default("smtp-api"),
  from_address: model.text().default(""),
  base_url: model.text().default(""),
  test_to: model.text().default(""),
  pending_restart: model.boolean().default(false),
})

export default PostalSetting

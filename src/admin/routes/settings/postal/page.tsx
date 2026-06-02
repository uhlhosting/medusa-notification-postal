import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Envelope } from "@medusajs/icons"

import { PostalSettingsPage } from "../../plugin-settings/postal/page"

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope,
})

export default PostalSettingsPage

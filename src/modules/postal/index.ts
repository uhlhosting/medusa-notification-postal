import { Module } from "@medusajs/framework/utils"
import PostalPluginModuleService from "./service"
import syncPostalSettingsLoader from "./loaders/sync-postal-settings"

export { POSTAL_PLUGIN_MODULE } from "./constants"

import { POSTAL_PLUGIN_MODULE } from "./constants"

export default Module(POSTAL_PLUGIN_MODULE, {
  service: PostalPluginModuleService,
  loaders: [syncPostalSettingsLoader],
})

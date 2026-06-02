import { Module } from "@medusajs/framework/utils"
import PostalPluginModuleService from "./service"

export const POSTAL_PLUGIN_MODULE = "postalPlugin"

export default Module(POSTAL_PLUGIN_MODULE, {
  service: PostalPluginModuleService,
})

import { MedusaService } from "@medusajs/framework/utils"
import PostalSetting from "./models/postal-setting"
import PostalWebhookEvent from "./models/postal-webhook-event"
import {
  resolvePostalPluginOptions,
  type ResolvedPostalPluginOptions,
} from "./options"

class PostalPluginModuleService extends MedusaService({
  PostalSetting,
  PostalWebhookEvent,
}) {
  protected readonly pluginOptions_: ResolvedPostalPluginOptions

  // Medusa constructs a module service as (cradle, moduleOptions,
  // moduleDeclaration); for a plugin module the options are the plugin's own.
  constructor(...args: any[]) {
    super(...args)
    this.pluginOptions_ = resolvePostalPluginOptions(args[1])
  }

  getPluginOptions(): ResolvedPostalPluginOptions {
    return this.pluginOptions_
  }
}

export default PostalPluginModuleService

import { MedusaService } from "@medusajs/framework/utils"
import PostalSetting from "./models/postal-setting"
import PostalWebhookEvent from "./models/postal-webhook-event"

class PostalPluginModuleService extends MedusaService({
  PostalSetting,
  PostalWebhookEvent,
}) {}

export default PostalPluginModuleService

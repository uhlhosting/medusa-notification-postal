import { MedusaService } from "@medusajs/framework/utils"
import PostalSetting from "./models/postal-setting"

class PostalPluginModuleService extends MedusaService({
  PostalSetting,
}) {}

export default PostalPluginModuleService

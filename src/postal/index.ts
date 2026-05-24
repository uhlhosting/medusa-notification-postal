import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { PostalNotificationService } from "./services/postal"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [PostalNotificationService],
})

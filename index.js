const { ModuleProvider, Modules } = require("@medusajs/framework/utils")
const { PostalNotificationService } = require("./services/postal")

const services = [PostalNotificationService]

module.exports = ModuleProvider(Modules.NOTIFICATION, {
  services,
})

import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { PostalNotificationService } from "./services/postal"

export const POSTAL_PROVIDER_ID = "postal"

type ProviderScope = {
  resolve: (key: string) => unknown
}

type NotificationModuleWithProviderRegistry = {
  notificationProviderService_?: {
    retrieveProviderRegistration: (providerId: string) => unknown
  }
}

export const resolvePostalProvider = (
  scope: ProviderScope
): PostalNotificationService => {
  const notificationModule = scope.resolve(
    Modules.NOTIFICATION
  ) as NotificationModuleWithProviderRegistry
  const service = notificationModule.notificationProviderService_
    ?.retrieveProviderRegistration(POSTAL_PROVIDER_ID)

  if (!service) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Postal notification provider is not loaded"
    )
  }

  return service as PostalNotificationService
}

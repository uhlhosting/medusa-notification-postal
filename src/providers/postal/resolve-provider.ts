import { MedusaError } from "@medusajs/framework/utils"
import type { PostalNotificationService } from "./services/postal"

// Notification providers are registered by Medusa as `np_<provider id>`.
// The consuming application configures this provider with the stable id
// `postal`, so routes must resolve the generated container key rather than the
// provider class identifier (`notification-postal`).
export const POSTAL_PROVIDER_CONTAINER_KEY = "np_postal"

type ProviderScope = {
  resolve: (key: string) => unknown
}

export const resolvePostalProvider = (
  scope: ProviderScope
): PostalNotificationService => {
  const service = scope.resolve(POSTAL_PROVIDER_CONTAINER_KEY)

  if (!service) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Postal notification provider is not loaded"
    )
  }

  return service as PostalNotificationService
}

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { POSTAL_PLUGIN_MODULE } from "../../modules/postal/constants"
import type {
  PostalSettingsInput,
  PostalSettingService,
} from "../../modules/postal/settings"
import { persistPostalSettings } from "../../modules/postal/settings"

const resolvePostalSettingService = (container: {
  resolve: (key: string) => unknown
}): PostalSettingService | null => {
  try {
    return container.resolve(POSTAL_PLUGIN_MODULE) as PostalSettingService
  } catch {
    return null
  }
}

export const savePostalSettingsStep = createStep(
  "save-postal-settings",
  async (payload: PostalSettingsInput, { container }) => {
    const service = resolvePostalSettingService(container)
    const settings = await persistPostalSettings(service, payload)

    return new StepResponse(settings)
  }
)

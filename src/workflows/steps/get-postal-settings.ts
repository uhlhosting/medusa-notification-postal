import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import type { PostalSettingService } from "../../modules/postal/settings"
import { getPostalSettings } from "../../modules/postal/settings"

export const getPostalSettingsStep = createStep(
  "get-postal-settings",
  async (_, { container }) => {
    const service = resolvePostalModule<PostalSettingService>(container)
    const settings = await getPostalSettings(service)

    return new StepResponse(settings)
  }
)

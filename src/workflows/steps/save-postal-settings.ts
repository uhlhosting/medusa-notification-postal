import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import type {
  PostalSettingsInput,
  PostalSettingService,
} from "../../modules/postal/settings"
import { persistPostalSettings } from "../../modules/postal/settings"

export const savePostalSettingsStep = createStep(
  "save-postal-settings",
  async (payload: PostalSettingsInput, { container }) => {
    const service = resolvePostalModule<PostalSettingService>(container)
    const settings = await persistPostalSettings(service, payload)

    return new StepResponse(settings)
  }
)

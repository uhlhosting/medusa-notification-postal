import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import {
  getPostalSettings,
  toPublicPostalSettings,
  type PostalSettingService,
} from "../../modules/postal/settings"

export const getPostalSettingsStep = createStep(
  "get-postal-settings",
  async (_, { container }) => {
    const service = resolvePostalModule<PostalSettingService>(container)
    const settings = await getPostalSettings(service)

    // Step output is persisted by the workflow engine, so it must never
    // carry POSTAL_API_KEY / POSTAL_WEBHOOK_TOKEN — only the public DTO.
    return new StepResponse(toPublicPostalSettings(settings))
  }
)

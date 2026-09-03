import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolvePostalModule } from "../../modules/postal/constants"
import type {
  PostalSettingsInput,
  PostalSettingService,
  PostalSettingsSnapshot,
} from "../../modules/postal/settings"
import { persistPostalSettings, getPostalSettings } from "../../modules/postal/settings"

export const savePostalSettingsStep = createStep(
  "save-postal-settings",
  async (payload: PostalSettingsInput, { container }) => {
    const service = resolvePostalModule<PostalSettingService>(container)
    
    const existing = await getPostalSettings(service)
    const settings = await persistPostalSettings(service, payload)

    return new StepResponse(settings, existing)
  },
  async (existing: PostalSettingsSnapshot | undefined, { container }) => {
    if (existing) {
      const service = resolvePostalModule<PostalSettingService>(container)
      await persistPostalSettings(service, {
        auth_type: existing.auth_type,
        from: existing.from || undefined,
        base_url: existing.base_url || undefined,
        test_to: existing.test_to || undefined,
      })
    }
  }
)

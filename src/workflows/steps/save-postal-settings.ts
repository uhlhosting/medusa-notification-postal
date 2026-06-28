import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolveOptionalPgConnection } from "../../modules/postal/db"
import type { PostalSettingsInput } from "../../modules/postal/settings"
import { persistPostalSettings } from "../../modules/postal/settings"

export const savePostalSettingsStep = createStep(
  "save-postal-settings",
  async (payload: PostalSettingsInput, { container }) => {
    const pgConnection = resolveOptionalPgConnection(container)
    const settings = await persistPostalSettings(pgConnection, payload)

    return new StepResponse(settings)
  }
)

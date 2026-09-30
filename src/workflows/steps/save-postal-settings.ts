import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import {
  POSTAL_SETTINGS_ID,
  resolvePostalModule,
} from "../../modules/postal/constants"
import type {
  PostalSettingsInput,
  PostalSettingService,
  PostalSettingRecord,
} from "../../modules/postal/settings"
import {
  persistPostalSettings,
  retrievePostalSettingRecord,
} from "../../modules/postal/settings"

type SavePostalSettingsCompensation = {
  existing: PostalSettingRecord | null
}

export const restorePostalSettings = async (
  service: PostalSettingService,
  compensation: SavePostalSettingsCompensation
) => {
  if (compensation.existing) {
    const existing = compensation.existing
    await service.updatePostalSettings({
      id: existing.id,
      auth_type: existing.auth_type,
      from_address: existing.from_address,
      base_url: existing.base_url,
      test_to: existing.test_to,
      pending_restart: existing.pending_restart,
    })
    return
  }

  if (!service.deletePostalSettings) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Postal module does not support settings rollback"
    )
  }

  await service.deletePostalSettings(POSTAL_SETTINGS_ID)
}

type MutablePostalSettingService = PostalSettingService & {
  deletePostalSettings: NonNullable<PostalSettingService["deletePostalSettings"]>
}

const requirePostalService = (
  service: PostalSettingService | null
): MutablePostalSettingService => {
  if (
    !service?.listPostalSettings ||
    !service.createPostalSettings ||
    !service.updatePostalSettings ||
    !service.deletePostalSettings
  ) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Postal module is unavailable"
    )
  }

  return service as MutablePostalSettingService
}

export const savePostalSettingsStep = createStep(
  "save-postal-settings",
  async (payload: PostalSettingsInput, { container }) => {
    const service = requirePostalService(
      resolvePostalModule<PostalSettingService>(container)
    )
    const existing = await retrievePostalSettingRecord(service) || null
    const settings = await persistPostalSettings(service, payload, existing)

    return new StepResponse(settings, { existing })
  },
  async (
    compensation: SavePostalSettingsCompensation | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }

    const service = requirePostalService(
      resolvePostalModule<PostalSettingService>(container)
    )

    await restorePostalSettings(service, compensation)
  }
)

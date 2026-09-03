import {
  createWorkflow,
  ReturnWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import type {
  PostalSettingsSnapshot,
  PostalSettingsInput,
} from "../modules/postal/settings"
import { validateModeRequirements } from "../modules/postal/settings"
import { savePostalSettingsStep } from "./steps/save-postal-settings"

export type SavePostalSettingsWorkflowInput = PostalSettingsInput

export type SavePostalSettingsWorkflowResult = {
  settings: PostalSettingsSnapshot
  ready_for_test: boolean
  validation_error: string | null
}

export const savePostalSettingsWorkflow: ReturnWorkflow<
  SavePostalSettingsWorkflowInput,
  SavePostalSettingsWorkflowResult,
  []
> = createWorkflow(
  "save-postal-settings",
  function (payload: SavePostalSettingsWorkflowInput) {
    const settings = savePostalSettingsStep(payload)
    
    const readiness = transform({ settings }, (data) => {
      const error = validateModeRequirements(data.settings)
      return {
        ready_for_test: !error,
        validation_error: error,
      }
    })

    return new WorkflowResponse({
      settings,
      ready_for_test: readiness.ready_for_test,
      validation_error: readiness.validation_error,
    })
  }
)

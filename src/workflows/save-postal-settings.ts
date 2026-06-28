import {
  createWorkflow,
  ReturnWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type {
  PostalSettingsSnapshot,
  PostalSettingsInput,
} from "../modules/postal/settings"
import { savePostalSettingsStep } from "./steps/save-postal-settings"

export type SavePostalSettingsWorkflowInput = PostalSettingsInput

export const savePostalSettingsWorkflow: ReturnWorkflow<
  SavePostalSettingsWorkflowInput,
  PostalSettingsSnapshot,
  []
> = createWorkflow(
  "save-postal-settings",
  (payload: SavePostalSettingsWorkflowInput) => {
    return new WorkflowResponse(savePostalSettingsStep(payload))
  }
)

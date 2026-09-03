import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendPostalTestWorkflow } from "../../../../workflows/send-postal-test"
import { savePostalSettingsWorkflow } from "../../../../workflows/save-postal-settings"
import {
  POSTAL_SETTINGS_ID,
  getEffectivePostalSettings,
  toPublicPostalSettings,
  type PostalSettingRecord
} from "../../../../modules/postal/settings"
import { type PostalSettingsBody } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: settingsRows } = await query.graph({
    entity: "postal_setting",
    fields: [
      "id",
      "auth_type",
      "from_address",
      "base_url",
      "test_to",
      "pending_restart",
    ],
    filters: {
      id: POSTAL_SETTINGS_ID,
    },
  })

  const settings = getEffectivePostalSettings(settingsRows[0] as PostalSettingRecord | undefined)

  res.json({
    ...toPublicPostalSettings(settings),
    diagnostics: {
      settings_source: "db_over_env",
    },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostalSettingsBody>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  const action = body.action

  if (action === "save") {
    const { result, errors } = await savePostalSettingsWorkflow(req.scope).run({
      input: body.settings || {},
      throwOnError: false,
    })

    if (errors?.length) {
      throw errors[0].error
    }

    return res.json({
      ok: true,
      action: "save",
      code: "postal_settings_saved",
      type: "postal_settings_result",
      status: 200,
      settings: toPublicPostalSettings(result.settings),
      requires_restart: true,
      ready_for_test: result.ready_for_test,
      validation_error: result.validation_error,
    })
  }

  if (action === "test") {
    const runId = `admin_${Date.now()}`

    const { result, errors } = await sendPostalTestWorkflow(req.scope).run({
      input: {
        to: body.to,
        settings: body.settings,
        run_id: runId
      },
      throwOnError: false,
    })

    if (errors?.length) {
      throw errors[0].error
    }

    return res.json({
      ok: true,
      action: "test",
      code: "postal_test_queued",
      type: "postal_test_result",
      status: 200,
      provider_id: "postal",
      to: result.to,
      workflow_run_id: runId,
      result: result.delivery,
      settings: toPublicPostalSettings(result.settings),
    })
  }
}

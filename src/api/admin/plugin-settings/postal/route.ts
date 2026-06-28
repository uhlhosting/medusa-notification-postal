import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { sendPostalEmailWorkflow } from "../../../../workflows/send-postal-email"
import { savePostalSettingsWorkflow } from "../../../../workflows/save-postal-settings"
import { resolveOptionalPgConnection } from "../../../../modules/postal/db"
import {
  getPostalSettings,
  toPublicPostalSettings,
  validateModeRequirements,
  type PostalSettingsInput,
} from "../../../../modules/postal/settings"
import {
  buildPostalAdminTestProviderData,
  type PostalAdminTestBody,
} from "./test-payload"

type PostalPostBody = PostalAdminTestBody & {
  action?: "save" | "test"
  settings?: PostalSettingsInput
}

const trimString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const pgConnection = resolveOptionalPgConnection(req.scope)
  const settings = await getPostalSettings(pgConnection)

  res.json({
    ...toPublicPostalSettings(settings),
    diagnostics: {
      settings_source: "db_over_env",
    },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostalPostBody>,
  res: MedusaResponse
) {
  const pgConnection = resolveOptionalPgConnection(req.scope)
  const body = req.validatedBody || req.body || {}
  const action = body.action

  if (action === "save") {
    const { result: settings, errors } = await savePostalSettingsWorkflow(req.scope).run({
      input: body.settings || {},
      throwOnError: false,
    })

    if (errors?.length) {
      throw errors[0].error
    }

    const validationError = validateModeRequirements(settings)

    return res.json({
      ok: true,
      action: "save",
      code: "postal_settings_saved",
      type: "postal_settings_result",
      status: 200,
      settings: toPublicPostalSettings(settings),
      requires_restart: true,
      ready_for_test: !validationError,
      validation_error: validationError,
    })
  }

  if (action !== "test") {
    return res.status(400).json({
      code: "postal_action_invalid",
      type: "postal_validation_error",
      status: 400,
      message: "Invalid action. Use `save` or `test`.",
    })
  }

  if (body.settings) {
    const { errors } = await savePostalSettingsWorkflow(req.scope).run({
      input: body.settings,
      throwOnError: false,
    })
    if (errors?.length) {
      throw errors[0].error
    }
  }

  const currentSettings = await getPostalSettings(pgConnection)
  const validationError = validateModeRequirements(currentSettings)
  if (validationError) {
    return res.status(400).json({
      ok: false,
      action: "test",
      code: "postal_settings_invalid_for_test",
      type: "postal_validation_error",
      status: 400,
      message: validationError,
      settings: toPublicPostalSettings(currentSettings),
      requires_restart: true,
    })
  }

  const to =
    trimString(body.to) ||
    currentSettings.test_to ||
    currentSettings.from

  if (!to) {
    return res.status(400).json({
      code: "postal_recipient_missing",
      type: "postal_validation_error",
      status: 400,
      message: "Missing recipient. Provide `to` or set POSTAL_TEST_TO/POSTAL_FROM.",
    })
  }

  const runId = `admin_${Date.now()}`
  const providerData = buildPostalAdminTestProviderData(
    {
      from: currentSettings.from || undefined,
      test_to: currentSettings.test_to || undefined,
      auth_type: currentSettings.auth_type,
    },
    body as PostalAdminTestBody,
    runId
  )

  const { result, errors } = await sendPostalEmailWorkflow(req.scope).run({
    input: {
      to,
      from: currentSettings.from || undefined,
      template: providerData.template,
      provider_data: {
        ...providerData,
        from: currentSettings.from || undefined,
      },
    },
    throwOnError: false,
  })

  if (errors?.length) {
    const message = String(errors[0].error?.message || "")
    if (
      message.includes("Could not find a notification provider") ||
      message.includes("not loaded")
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Postal provider is not loaded. Save settings and restart backend."
      )
    }

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      message || "Postal test send failed"
    )
  }

  return res.json({
    ok: true,
    action: "test",
    code: "postal_test_queued",
    type: "postal_test_result",
    status: 200,
    provider_id: "postal",
    to,
    workflow_run_id: runId,
    result,
    settings: toPublicPostalSettings(currentSettings),
  })
}

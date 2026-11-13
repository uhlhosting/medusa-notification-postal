import { recordPostalWebhookWorkflow } from "../../../../workflows/record-postal-webhook"
import type { MedusaContainer } from "@medusajs/framework/types"
import { preparePostalWebhook, type PreparedPostalWebhook } from "../../../../modules/postal/webhooks"

export type PostalWebhookPostHandlerInput = {
  scope: { resolve: (key: string) => unknown }
  validatedBody: Record<string, unknown>
  runWebhookWorkflow?: (payload: PreparedPostalWebhook) => Promise<{
    result: {
      id: string | null
      event_type: string
      status: string
    } | null
  }>
}

export const handlePostalWebhookPost = async (
  input: PostalWebhookPostHandlerInput
) => {
  const {
    scope,
    validatedBody,
    runWebhookWorkflow,
  } = input
  const payload = preparePostalWebhook(validatedBody)

  const { result } = runWebhookWorkflow
    ? await runWebhookWorkflow(payload)
    : await recordPostalWebhookWorkflow(scope as MedusaContainer).run({
        input: payload,
      })

  if (!result) {
    return {
      status: 202,
      body: {
        ok: true,
        ignored: true,
      },
    }
  }

  return {
    status: 202,
    body: {
      ok: true,
      id: result.id,
      event_type: result.event_type,
      status: result.status,
    },
  }
}

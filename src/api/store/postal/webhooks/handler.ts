import { recordPostalWebhookWorkflow } from "../../../../workflows/record-postal-webhook"
import type { MedusaContainer } from "@medusajs/framework/types"

export type PostalWebhookPostHandlerInput = {
  scope: { resolve: (key: string) => unknown }
  validatedBody?: Record<string, unknown>
  runWebhookWorkflow?: (payload: Record<string, unknown>) => Promise<{
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
  const payload = (validatedBody || {}) as Record<string, unknown>

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

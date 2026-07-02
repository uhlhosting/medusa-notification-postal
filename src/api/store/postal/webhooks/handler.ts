import { recordPostalWebhookWorkflow } from "../../../../workflows/record-postal-webhook"

export type PostalWebhookPostHandlerInput = {
  scope: any
  body?: Record<string, unknown>
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
    body,
    validatedBody,
    runWebhookWorkflow,
  } = input
  const payload = (validatedBody || body || {}) as Record<string, unknown>

  const { result } = runWebhookWorkflow
    ? await runWebhookWorkflow(payload)
    : await recordPostalWebhookWorkflow(scope).run({
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

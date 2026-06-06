import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { sendPostalEmailWorkflow } from "../../../../workflows/send-postal-email"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const body = (req.validatedBody || req.body || {}) as {
    to?: string | string[]
    from?: string
    template?: string
    subject?: string
    html?: string
    text?: string
    cc?: string | string[]
    bcc?: string | string[]
    headers?: Record<string, string>
  }

  const subject = String(body.subject || "").trim()
  if (!body.to || !subject) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal test send requires `to` and `subject`."
    )
  }

  const runId = `postal-test-${Date.now()}`

  const { result } = await sendPostalEmailWorkflow(req.scope).run({
    input: {
      to: body.to,
      from: body.from,
      template: body.template || "postal-test",
      provider_data: {
        subject,
        html: body.html || "",
        text: body.text || "",
        cc: body.cc,
        bcc: body.bcc,
        headers: body.headers || {},
        workflow_event: "postal.admin.test_send",
        workflow_run_id: runId,
      },
    },
  })

  return res.status(200).json({
    success: true,
    workflow_run_id: runId,
    delivery: result.delivery,
  })
}

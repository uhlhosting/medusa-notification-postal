import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPostalTestWorkflow } from "../../../../workflows/send-postal-test"
import type { PostalSendTestBody } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<PostalSendTestBody>,
  res: MedusaResponse
) => {
  const body = req.validatedBody
  const runId = `postal-test-${Date.now()}`

  const { result, errors } = await sendPostalTestWorkflow(req.scope).run({
    input: {
      ...body,
      run_id: runId
    },
    throwOnError: false,
  })

  if (errors?.length) {
    throw errors[0].error
  }

  return res.status(200).json({
    success: true,
    workflow_run_id: runId,
    delivery: result.delivery,
  })
}

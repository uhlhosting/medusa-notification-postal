import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import PostalPluginModuleService from "../modules/postal/service"
import { publishPostalWebhookEvent } from "./steps/record-postal-webhook"
const publishPostalWebhookStep = createStep("publish-postal-webhook", async (id: string, { container }) => {
  const service = container.resolve<PostalPluginModuleService>("postalPlugin")
  const event = await service.retrievePostalWebhookEvent(id)
  await publishPostalWebhookEvent(service as any, event as any, container)
  return new StepResponse({ id })
})
export const publishPostalWebhookWorkflow = createWorkflow("publish-postal-webhook", function (id: string) {
  return new WorkflowResponse(publishPostalWebhookStep(id))
})

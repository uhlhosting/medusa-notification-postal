import test from "node:test"
import assert from "node:assert/strict"
import { asValue } from "@medusajs/framework/awilix"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { POSTAL_PLUGIN_MODULE } from "../modules/postal/constants"
import { sendPostalTestWorkflow } from "./send-postal-test"

const createContainer = () => {
  const sent: Array<Record<string, any>> = []
  const settingsService = {
    listPostalSettings: async () => [
      {
        id: "postal",
        auth_type: "smtp-api",
        from_address: "shop@example.com",
        base_url: "https://postal.example.com",
        test_to: "",
        pending_restart: false,
      },
    ],
    createPostalSettings: async (data: unknown) => data,
    updatePostalSettings: async (data: unknown) => data,
  }
  const notificationService = {
    createNotifications: async (data: Array<Record<string, any>>) => {
      sent.push(...data)
      return data.map((_, index) => ({ id: `noti_${index + 1}` }))
    },
  }
  const container = createMedusaContainer()
  container.register({
    [POSTAL_PLUGIN_MODULE]: asValue(settingsService),
    [Modules.NOTIFICATION]: asValue(notificationService),
  })
  return { container, sent }
}

const withApiKey = async (run: () => Promise<void>) => {
  const previous = process.env.POSTAL_API_KEY
  process.env.POSTAL_API_KEY = "test-api-key"
  try {
    await run()
  } finally {
    if (previous === undefined) {
      delete process.env.POSTAL_API_KEY
    } else {
      process.env.POSTAL_API_KEY = previous
    }
  }
}

test("sendPostalTestWorkflow reports the sent subject and sends cc/bcc once", async () => {
  await withApiKey(async () => {
    const { container, sent } = createContainer()

    const { result } = await sendPostalTestWorkflow(container as never).run({
      input: {
        to: ["a@example.com", "b@example.com"],
        cc: "boss@example.com",
        bcc: ["audit@example.com"],
        subject: "Postal smoke test",
        template: "My-Custom-Template",
        run_id: "postal-test-1",
      },
    })

    assert.equal(result.delivery.subject, "Postal smoke test")
    assert.deepEqual(result.delivery.to, ["a@example.com", "b@example.com"])
    assert.deepEqual(
      result.delivery.deliveries.map((delivery) => delivery.id),
      ["noti_1", "noti_2"]
    )

    // One send per `to` recipient; the copies ride on the first send only.
    assert.equal(sent.length, 2)
    assert.equal(sent[0]!.provider_data.cc, "boss@example.com")
    assert.deepEqual(sent[0]!.provider_data.bcc, ["audit@example.com"])
    assert.equal(sent[1]!.provider_data.cc, undefined)
    assert.equal(sent[1]!.provider_data.bcc, undefined)

    // Custom template names are kept for the Postal tag, not rejected.
    assert.equal(sent[0]!.template, "My-Custom-Template")
    assert.equal(sent[0]!.content.subject, "Postal smoke test")
    assert.equal(sent[0]!.provider_data.workflow_run_id, "postal-test-1")
  })
})

import { asValue, createContainer } from "@medusajs/framework/awilix"
import { POST } from "./route"
import { Modules } from "@medusajs/framework/utils"
import test from "node:test"
import assert from "node:assert/strict"

test("POST triggers send-postal-email workflow to send a test message", async () => {
  const container = createContainer()
  let capturedInput: any = null

  container.register(Modules.NOTIFICATION, asValue({
    createNotifications: async (input: any) => {
      capturedInput = input
      return { id: "test-notification-id" }
    }
  }))

  const req = {
    validatedBody: {
      to: "test@example.com",
      subject: "Test subject",
      template: "my-template",
      from: "sender@example.com",
      html: "<p>test</p>",
      text: "test",
      cc: "cc@example.com",
      bcc: ["bcc@example.com"],
      reply_to: "reply@example.com",
      from_name: "Test Sender",
      headers: { "X-Test": "test" },
      custom_args: { arg1: "val1" },
      metadata: { meta1: "val1" },
    },
    scope: container,
  } as any

  const resBody: any = {}
  const res = {
    status(status: number) {
      resBody.status = status
      return res
    },
    json(payload: any) {
      resBody.payload = payload
      return payload
    },
  } as any

  await POST(req, res)

  assert.equal(resBody.status, 200)
  assert.equal(resBody.payload.success, true)
  assert.equal(resBody.payload.delivery.id, "test-notification-id")
  assert.match(resBody.payload.workflow_run_id, /^postal-test-/)

  assert.equal(capturedInput.to, "test@example.com")
  assert.equal(capturedInput.template, "my-template")
  assert.equal(capturedInput.content.subject, "Test subject")
  assert.equal(capturedInput.content.html, "<p>test</p>")
  assert.equal(capturedInput.content.text, "test")

  const providerData = capturedInput.provider_data
  assert.equal(providerData.from, "sender@example.com")
  assert.equal(providerData.from_name, "Test Sender")
  assert.equal(providerData.reply_to, "reply@example.com")
  assert.equal(providerData.cc, "cc@example.com")
  assert.deepEqual(providerData.bcc, ["bcc@example.com"])
  assert.deepEqual(providerData.headers, { "X-Test": "test" })
  assert.deepEqual(providerData.custom_args, { arg1: "val1" })
  assert.deepEqual(providerData.metadata, { meta1: "val1" })
  assert.equal(providerData.workflow_event, "postal.admin.test_send")
  assert.equal(providerData.workflow_run_id, resBody.payload.workflow_run_id)
})

test("POST falls back to default template when not provided", async () => {
  const container = createContainer()
  let capturedInput: any = null

  container.register(Modules.NOTIFICATION, asValue({
    createNotifications: async (input: any) => {
      capturedInput = input
      return { id: "test-notification-id" }
    }
  }))

  const req = {
    validatedBody: {
      to: "test@example.com",
      subject: "Test subject",
    },
    scope: container,
  } as any

  const resBody: any = {}
  const res = {
    status(status: number) {
      resBody.status = status
      return res
    },
    json(payload: any) {
      resBody.payload = payload
      return payload
    },
  } as any

  await POST(req, res)

  assert.equal(resBody.status, 200)
  assert.equal(capturedInput.template, "postal-test")
})

test("POST throws MedusaError when notification module is not loaded", async () => {
  const container = createContainer()
  container.register(Modules.NOTIFICATION, asValue(undefined))

  const req = {
    validatedBody: {
      to: "test@example.com",
      subject: "Test subject",
    },
    scope: container,
  } as any

  const res = {} as any

  try {
    await POST(req, res)
    assert.fail("Should have thrown an error")
  } catch (error: any) {
    assert.match(error.message, /Notification module is not loaded/)
  }
})

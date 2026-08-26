import test from "node:test"
import assert from "node:assert/strict"

// Mock the workflow using require cache manipulation
const mockWorkflow = {
  runCount: 0,
  lastInput: null,
  returnDelivery: null as any
}

// Intercept module loading
import Module from "node:module"
const originalRequire = Module.prototype.require
Module.prototype.require = function (id: string) {
  if (id.includes("workflows/send-postal-email")) {
    return {
      sendPostalEmailWorkflow: () => ({
        run: async (args: any) => {
          mockWorkflow.runCount++
          mockWorkflow.lastInput = args.input
          return {
            result: {
              delivery: mockWorkflow.returnDelivery
            }
          }
        }
      })
    }
  }
  return originalRequire.apply(this, arguments as any)
}

// Now import the route which will use the mocked module
let POST: any;
try {
  POST = require("./route").POST
} finally {
  // Restore original require
  Module.prototype.require = originalRequire
}

const createResponse = () => {
  const output: { status?: number; payload?: Record<string, unknown> } = {}
  const response = {
    status(status: number) {
      output.status = status
      return response
    },
    json(payload: Record<string, unknown>) {
      output.payload = payload
      return payload
    },
  }

  return { output, response }
}

test("send test route calls workflow and returns success", async () => {
  mockWorkflow.runCount = 0
  mockWorkflow.lastInput = null
  mockWorkflow.returnDelivery = { id: 1, message: "Message sent" }

  const req = {
    scope: {},
    validatedBody: {
      to: "test@example.com",
      from: "from@example.com",
      from_name: "Test From",
      reply_to: "reply@example.com",
      template: "custom-template",
      subject: "Test Subject",
      html: "<p>html</p>",
      text: "text",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      headers: { "X-Test": "test" },
      custom_args: { "arg": "value" },
      metadata: { "meta": "data" }
    }
  } as any

  const { output, response } = createResponse()

  await POST(req, response as any)

  assert.equal(mockWorkflow.runCount, 1)
  assert.equal(output.status, 200)
  assert.equal(output.payload?.success, true)
  assert.ok((output.payload?.workflow_run_id as string).startsWith("postal-test-"))
  assert.deepEqual(output.payload?.delivery, { id: 1, message: "Message sent" })

  assert.deepEqual(mockWorkflow.lastInput, {
    to: "test@example.com",
    from: "from@example.com",
    from_name: "Test From",
    reply_to: "reply@example.com",
    template: "custom-template",
    provider_data: {
      from: "from@example.com",
      from_name: "Test From",
      reply_to: "reply@example.com",
      subject: "Test Subject",
      html: "<p>html</p>",
      text: "text",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      headers: { "X-Test": "test" },
      custom_args: { "arg": "value" },
      metadata: { "meta": "data" },
      workflow_event: "postal.admin.test_send",
      workflow_run_id: output.payload?.workflow_run_id
    }
  })
})

test("send test route uses fallback values for optional fields", async () => {
  mockWorkflow.runCount = 0
  mockWorkflow.lastInput = null
  mockWorkflow.returnDelivery = { id: 2, message: "Message sent fallback" }

  const req = {
    scope: {},
    validatedBody: {
      to: "test2@example.com",
      subject: "Test Subject 2",
    }
  } as any

  const { output, response } = createResponse()

  await POST(req, response as any)

  assert.equal(mockWorkflow.runCount, 1)
  assert.equal(output.status, 200)

  assert.equal(mockWorkflow.lastInput.template, "postal-test")
  assert.equal(mockWorkflow.lastInput.provider_data.html, "")
  assert.equal(mockWorkflow.lastInput.provider_data.text, "")
  assert.deepEqual(mockWorkflow.lastInput.provider_data.headers, {})
  assert.deepEqual(mockWorkflow.lastInput.provider_data.custom_args, {})
  assert.deepEqual(mockWorkflow.lastInput.provider_data.metadata, {})
  assert.equal(mockWorkflow.lastInput.provider_data.workflow_event, "postal.admin.test_send")
})

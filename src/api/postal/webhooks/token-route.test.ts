import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"

const handlerCalls: Array<Record<string, unknown>> = []
const originalRequire = Module.prototype.require

Module.prototype.require = function (id: string) {
  if (id.includes("store/postal/webhooks/handler")) {
    return {
      handlePostalWebhookPost: async (input: Record<string, unknown>) => {
        handlerCalls.push(input)
        return {
          status: 202,
          body: {
            ok: true,
            id: "postal_webhook_test",
            event_type: "message.sent",
            status: "sent",
          },
        }
      },
    }
  }
  return Reflect.apply(originalRequire, this, arguments)
}

let POST: typeof import("./[token]/route").POST
try {
  POST = require("./[token]/route").POST
} finally {
  Module.prototype.require = originalRequire
}

test("tokenized Postal webhook route delegates only the validated body", async () => {
  handlerCalls.length = 0
  const validatedBody = {
    event_type: "MessageSent",
    status: "Sent",
    message: {
      message_id: "msg_test",
      tag: "uhlhosting.medusa-notification-postal:postal-test",
    },
  }
  const scope = { resolve: () => null }
  const output: Record<string, unknown> = {}
  const response = {
    status(code: number) {
      output.status = code
      return response
    },
    json(body: Record<string, unknown>) {
      output.body = body
      return body
    },
  }

  await POST(
    {
      scope,
      validatedBody,
      body: { unvalidated: true },
      params: { token: "authentication-is-tested-in-middleware" },
    } as never,
    response as never
  )

  assert.equal(handlerCalls.length, 1)
  assert.equal(handlerCalls[0]?.scope, scope)
  assert.deepEqual(handlerCalls[0]?.validatedBody, validatedBody)
  assert.equal(output.status, 202)
  assert.deepEqual(output.body, {
    ok: true,
    id: "postal_webhook_test",
    event_type: "message.sent",
    status: "sent",
  })
})

import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "./[id]/route"

test("message route resolves the Postal provider and returns message details", async () => {
  let resolvedKey = ""
  const req = {
    params: { id: "42" },
    scope: {
      resolve: (key: string) => {
        resolvedKey = key
        return {
          notificationProviderService_: {
            retrieveProviderRegistration: () => ({
              getMessageDetails: async (id: number) => ({ id, subject: "Test" }),
              getMessageDeliveries: async (id: number) => [{ id, status: "sent" }],
            }),
          },
        }
      },
    },
  } as any
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

  await GET(req, response as any)

  assert.equal(resolvedKey, "notification")
  assert.equal(output.status, 200)
  assert.equal(output.payload?.id, 42)
  assert.deepEqual(output.payload?.message, { id: 42, subject: "Test" })
  assert.deepEqual(output.payload?.deliveries, [{ id: 42, status: "sent" }])
})

test("message route rejects a non-numeric Postal message id", async () => {
  const req = {
    params: { id: "message-42" },
    scope: { resolve: () => undefined },
  } as any

  await assert.rejects(
    () => GET(req, {} as any),
    /Postal message lookup requires a numeric message id/
  )
})

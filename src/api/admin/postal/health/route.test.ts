import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "./route"

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

test("health route reports the resolved Postal provider as active", async () => {
  let resolvedKey = ""
  const req = {
    scope: {
      resolve: (key: string) => {
        resolvedKey = key
        return {
          notificationProviderService_: {
            retrieveProviderRegistration: () => ({
              getHealthSnapshot: () => ({ auth_type: "smtp-api", mode: "api" }),
            }),
          },
        }
      },
    },
  } as any
  const { output, response } = createResponse()

  await GET(req, response as any)

  assert.equal(resolvedKey, "notification")
  assert.equal(output.status, 200)
  assert.equal(output.payload?.status, "ok")
  assert.equal(output.payload?.auth_type, "smtp-api")
  assert.equal(output.payload?.mode, "api")
})

test("health route reports a missing provider as unavailable", async () => {
  const req = {
    scope: {
      resolve: () => {
        throw new Error("registration not found")
      },
    },
  } as any
  const { output, response } = createResponse()

  await GET(req, response as any)

  assert.equal(output.status, 503)
  assert.equal(output.payload?.status, "error")
  assert.equal(output.payload?.code, "postal_provider_unavailable")
})

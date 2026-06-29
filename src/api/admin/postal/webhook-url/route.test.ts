import test from "node:test"
import assert from "node:assert/strict"
import { GET } from "./route"

test("admin webhook url route returns tokenized callback details", async () => {
  const pgConnection = {
    raw: async (sql: string, params?: unknown[]) => {
      assert.match(sql, /SELECT value FROM admin_plugin_settings/)
      assert.deepEqual(params, ["postal"])
      return {
        rows: [
          {
            value: {
              POSTAL_WEBHOOK_TOKEN: "token_123",
            },
          },
        ],
      }
    },
  }

  const req = {
    headers: {
      host: "api.uhlhosting.ch",
      "x-forwarded-proto": "https",
    },
    scope: {
      resolve: (name: string) => {
        assert.equal(name, "pgConnection")
        return pgConnection
      },
    },
  } as any

  const responseBody: any = {}
  const res = {
    status(code: number) {
      responseBody.status = code
      return {
        json(payload: any) {
          responseBody.payload = payload
          return payload
        },
      }
    },
  } as any

  await GET(req, res)

  assert.equal(responseBody.status, 200)
  assert.equal(responseBody.payload.token, "token_123")
  assert.equal(
    responseBody.payload.path,
    "/postal/webhooks/token_123"
  )
  assert.equal(
    responseBody.payload.callback_url,
    "https://api.uhlhosting.ch/postal/webhooks/token_123"
  )
})

test("admin webhook url route falls back to backend env origin", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  process.env.MEDUSA_BACKEND_URL = "https://env.uhlhosting.ch"

  try {
    const pgConnection = {
      raw: async (sql: string, params?: unknown[]) => {
        assert.match(sql, /SELECT value FROM admin_plugin_settings/)
        assert.deepEqual(params, ["postal"])
        return {
          rows: [
            {
              value: {
                POSTAL_WEBHOOK_TOKEN: "token_456",
              },
            },
          ],
        }
      },
    }

    const req = {
      headers: {},
      scope: {
        resolve: (name: string) => {
          assert.equal(name, "pgConnection")
          return pgConnection
        },
      },
    } as any

    const responseBody: any = {}
    const res = {
      status(code: number) {
        responseBody.status = code
        return {
          json(payload: any) {
            responseBody.payload = payload
            return payload
          },
        }
      },
    } as any

    await GET(req, res)

    assert.equal(responseBody.status, 200)
    assert.equal(
      responseBody.payload.callback_url,
      "https://env.uhlhosting.ch/postal/webhooks/token_456"
    )
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }
  }
})

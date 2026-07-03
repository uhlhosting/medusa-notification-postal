import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
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
      host: "api.example.com",
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
    "https://api.example.com/postal/webhooks/token_123"
  )
})

test("admin webhook url route prefers the origin header when present", async () => {
  const pgConnection = {
    raw: async () => ({
      rows: [
        {
          value: {
            POSTAL_WEBHOOK_TOKEN: "token_origin",
          },
        },
      ],
    }),
  }

  const req = {
    headers: {
      origin: "https://origin.example.com/app",
    },
    scope: {
      resolve: () => pgConnection,
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

  assert.equal(responseBody.payload.callback_url, "https://origin.example.com/postal/webhooks/token_origin")
})

test("admin webhook url route falls back to backend env origin", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  process.env.MEDUSA_BACKEND_URL = "https://env.example.com"

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
      "https://env.example.com/postal/webhooks/token_456"
    )
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }
  }
})

test("admin webhook url route returns null callback_url when no origin exists", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  const previousViteBackendUrl = process.env.VITE_BACKEND_URL
  delete process.env.MEDUSA_BACKEND_URL
  delete process.env.VITE_BACKEND_URL

  try {
    const pgConnection = {
      raw: async () => ({
        rows: [
          {
            value: {
              POSTAL_WEBHOOK_TOKEN: "token_789",
            },
          },
        ],
      }),
    }

    const req = {
      headers: {},
      scope: {
        resolve: () => pgConnection,
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
    assert.equal(responseBody.payload.token, "token_789")
    assert.equal(responseBody.payload.callback_url, null)
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }

    if (previousViteBackendUrl === undefined) {
      delete process.env.VITE_BACKEND_URL
    } else {
      process.env.VITE_BACKEND_URL = previousViteBackendUrl
    }
  }
})

test("admin webhook url route ignores invalid absolute origins and falls back to env", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  process.env.MEDUSA_BACKEND_URL = "https://env.invalid-origin.example.test"

  try {
    const pgConnection = {
      raw: async () => ({
        rows: [
          {
            value: {
              POSTAL_WEBHOOK_TOKEN: "token_invalid",
            },
          },
        ],
      }),
    }

    const req = {
      headers: {
        origin: "not-a-valid-url",
        "x-forwarded-host": "bad host",
      },
      scope: {
        resolve: () => pgConnection,
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

    assert.equal(
      responseBody.payload.callback_url,
      "https://env.invalid-origin.example.test/postal/webhooks/token_invalid"
    )
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }
  }
})

test("admin webhook url route falls back to VITE backend origin when MEDUSA backend origin is invalid", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  const previousViteBackendUrl = process.env.VITE_BACKEND_URL
  process.env.MEDUSA_BACKEND_URL = "not-a-valid-url"
  process.env.VITE_BACKEND_URL = "https://vite.example.com"

  try {
    const pgConnection = {
      raw: async () => ({
        rows: [
          {
            value: {
              POSTAL_WEBHOOK_TOKEN: "token_vite",
            },
          },
        ],
      }),
    }

    const req = {
      headers: {
        host: "",
      },
      scope: {
        resolve: () => pgConnection,
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

    assert.equal(
      responseBody.payload.callback_url,
      "https://vite.example.com/postal/webhooks/token_vite"
    )
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }

    if (previousViteBackendUrl === undefined) {
      delete process.env.VITE_BACKEND_URL
    } else {
      process.env.VITE_BACKEND_URL = previousViteBackendUrl
    }
  }
})

test("admin webhook url route falls back to VITE backend origin when forwarded host origin is invalid", async () => {
  const previousBackendUrl = process.env.MEDUSA_BACKEND_URL
  const previousViteBackendUrl = process.env.VITE_BACKEND_URL
  process.env.MEDUSA_BACKEND_URL = "not-a-valid-url"
  process.env.VITE_BACKEND_URL = "https://vite-forwarded.example.com"

  try {
    const pgConnection = {
      raw: async () => ({
        rows: [
          {
            value: {
              POSTAL_WEBHOOK_TOKEN: "token_vite_forwarded",
            },
          },
        ],
      }),
    }

    const req = {
      headers: {
        host: "bad host",
      },
      scope: {
        resolve: () => pgConnection,
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

    assert.equal(
      responseBody.payload.callback_url,
      "https://vite-forwarded.example.com/postal/webhooks/token_vite_forwarded"
    )
  } finally {
    if (previousBackendUrl === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackendUrl
    }

    if (previousViteBackendUrl === undefined) {
      delete process.env.VITE_BACKEND_URL
    } else {
      process.env.VITE_BACKEND_URL = previousViteBackendUrl
    }
  }
})

test("admin webhook url route fails when the token is missing", async () => {
  const pgConnection = {
    raw: async () => ({
      rows: [
        {
          value: {},
        },
      ],
    }),
  }

  const req = {
    headers: {},
    scope: {
      resolve: () => pgConnection,
    },
  } as any

  const res = {
    status: () => ({
      json: () => undefined,
    }),
  } as any

  await assert.rejects(() => GET(req, res), MedusaError)
})

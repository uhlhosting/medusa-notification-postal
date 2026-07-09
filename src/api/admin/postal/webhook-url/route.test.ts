import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
import { GET } from "./route"

// The webhook token is sourced from POSTAL_WEBHOOK_TOKEN (env only). The module
// service is resolved but not used for the token, so a null resolve is fine.
const invokeGet = async (options: {
  token?: string
  headers?: Record<string, unknown>
  env?: Record<string, string | undefined>
}) => {
  const envKeys = [
    "POSTAL_WEBHOOK_TOKEN",
    "MEDUSA_BACKEND_URL",
    "VITE_BACKEND_URL",
    ...Object.keys(options.env ?? {}),
  ]
  const previous: Record<string, string | undefined> = {}
  for (const key of envKeys) {
    previous[key] = process.env[key]
  }

  // Reset the origin-related env unless the test overrides them.
  delete process.env.MEDUSA_BACKEND_URL
  delete process.env.VITE_BACKEND_URL
  if (options.token === undefined) {
    delete process.env.POSTAL_WEBHOOK_TOKEN
  } else {
    process.env.POSTAL_WEBHOOK_TOKEN = options.token
  }
  for (const [key, value] of Object.entries(options.env ?? {})) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  const req = {
    headers: options.headers ?? {},
    scope: { resolve: () => null },
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

  try {
    await GET(req, res)
    return responseBody
  } finally {
    for (const key of envKeys) {
      if (previous[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previous[key]
      }
    }
  }
}

test("admin webhook url route returns tokenized callback details", async () => {
  const body = await invokeGet({
    token: "token_123",
    headers: { host: "api.example.com", "x-forwarded-proto": "https" },
  })

  assert.equal(body.status, 200)
  assert.equal(body.payload.token, "token_123")
  assert.equal(body.payload.path, "/postal/webhooks/token_123")
  assert.equal(
    body.payload.callback_url,
    "https://api.example.com/postal/webhooks/token_123"
  )
})

test("admin webhook url route prefers the origin header when present", async () => {
  const body = await invokeGet({
    token: "token_origin",
    headers: { origin: "https://origin.example.com/app" },
  })

  assert.equal(
    body.payload.callback_url,
    "https://origin.example.com/postal/webhooks/token_origin"
  )
})

test("admin webhook url route falls back to backend env origin", async () => {
  const body = await invokeGet({
    token: "token_456",
    headers: {},
    env: { MEDUSA_BACKEND_URL: "https://env.example.com" },
  })

  assert.equal(body.status, 200)
  assert.equal(
    body.payload.callback_url,
    "https://env.example.com/postal/webhooks/token_456"
  )
})

test("admin webhook url route returns null callback_url when no origin exists", async () => {
  const body = await invokeGet({ token: "token_789", headers: {} })

  assert.equal(body.status, 200)
  assert.equal(body.payload.token, "token_789")
  assert.equal(body.payload.callback_url, null)
})

test("admin webhook url route ignores invalid absolute origins and falls back to env", async () => {
  const body = await invokeGet({
    token: "token_invalid",
    headers: { origin: "not-a-valid-url", "x-forwarded-host": "bad host" },
    env: { MEDUSA_BACKEND_URL: "https://env.invalid-origin.example.test" },
  })

  assert.equal(
    body.payload.callback_url,
    "https://env.invalid-origin.example.test/postal/webhooks/token_invalid"
  )
})

test("admin webhook url route falls back to VITE backend origin when MEDUSA backend origin is invalid", async () => {
  const body = await invokeGet({
    token: "token_vite",
    headers: { host: "" },
    env: {
      MEDUSA_BACKEND_URL: "not-a-valid-url",
      VITE_BACKEND_URL: "https://vite.example.com",
    },
  })

  assert.equal(
    body.payload.callback_url,
    "https://vite.example.com/postal/webhooks/token_vite"
  )
})

test("admin webhook url route falls back to VITE backend origin when forwarded host origin is invalid", async () => {
  const body = await invokeGet({
    token: "token_vite_forwarded",
    headers: { host: "bad host" },
    env: {
      MEDUSA_BACKEND_URL: "not-a-valid-url",
      VITE_BACKEND_URL: "https://vite-forwarded.example.com",
    },
  })

  assert.equal(
    body.payload.callback_url,
    "https://vite-forwarded.example.com/postal/webhooks/token_vite_forwarded"
  )
})

test("admin webhook url route fails when the token is missing", async () => {
  const req = {
    headers: {},
    scope: { resolve: () => null },
  } as any
  const res = {
    status: () => ({ json: () => undefined }),
  } as any

  const previous = process.env.POSTAL_WEBHOOK_TOKEN
  delete process.env.POSTAL_WEBHOOK_TOKEN
  try {
    await assert.rejects(() => GET(req, res), MedusaError)
  } finally {
    if (previous === undefined) {
      delete process.env.POSTAL_WEBHOOK_TOKEN
    } else {
      process.env.POSTAL_WEBHOOK_TOKEN = previous
    }
  }
})

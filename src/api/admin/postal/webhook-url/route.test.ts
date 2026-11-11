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
    env: { MEDUSA_BACKEND_URL: "https://api.example.com" },
  })

  assert.equal(body.status, 200)
  assert.equal(body.payload.token, "token_123")
  assert.equal(body.payload.path, "/postal/webhooks/token_123")
  assert.equal(
    body.payload.callback_url,
    "https://api.example.com/postal/webhooks/token_123"
  )
})

test("admin webhook url route ignores request headers for the callback origin", async () => {
  // Origin, Host and forwarded headers are caller-controlled: a forged admin
  // request must never steer the displayed tokenized URL to another host.
  const body = await invokeGet({
    token: "token_origin",
    headers: {
      origin: "https://attacker.example.com/app",
      host: "attacker.example.com",
      "x-forwarded-host": "attacker.example.com",
      "x-forwarded-proto": "https",
    },
    env: { MEDUSA_BACKEND_URL: "https://api.example.com" },
  })

  assert.equal(
    body.payload.callback_url,
    "https://api.example.com/postal/webhooks/token_origin"
  )
})

test("admin webhook url route never builds a callback URL from headers alone", async () => {
  const body = await invokeGet({
    token: "token_headers_only",
    headers: { host: "api.example.com", "x-forwarded-proto": "https" },
  })

  assert.equal(body.status, 200)
  assert.equal(body.payload.callback_url, null)
})

test("admin webhook url route falls back to VITE backend origin", async () => {
  const body = await invokeGet({
    token: "token_456",
    env: { VITE_BACKEND_URL: "https://env.example.com" },
  })

  assert.equal(body.status, 200)
  assert.equal(
    body.payload.callback_url,
    "https://env.example.com/postal/webhooks/token_456"
  )
})

test("admin webhook url route prefers MEDUSA backend origin over VITE", async () => {
  const body = await invokeGet({
    token: "token_both",
    env: {
      MEDUSA_BACKEND_URL: "https://medusa.example.com",
      VITE_BACKEND_URL: "https://vite.example.com",
    },
  })

  assert.equal(
    body.payload.callback_url,
    "https://medusa.example.com/postal/webhooks/token_both"
  )
})

test("admin webhook url route returns null callback_url when no origin exists", async () => {
  const body = await invokeGet({ token: "token_789", headers: {} })

  assert.equal(body.status, 200)
  assert.equal(body.payload.token, "token_789")
  assert.equal(body.payload.callback_url, null)
})

test("admin webhook url route returns null callback_url for invalid env origins", async () => {
  const body = await invokeGet({
    token: "token_invalid",
    env: {
      MEDUSA_BACKEND_URL: "not-a-valid-url",
      VITE_BACKEND_URL: "also-not-a-url",
    },
  })

  assert.equal(body.status, 200)
  assert.equal(body.payload.callback_url, null)
})

test("admin webhook url route falls back to VITE backend origin when MEDUSA backend origin is invalid", async () => {
  const body = await invokeGet({
    token: "token_vite",
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

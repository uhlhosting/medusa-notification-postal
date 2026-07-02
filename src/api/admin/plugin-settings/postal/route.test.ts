import test from "node:test"
import assert from "node:assert/strict"
import { GET } from "./route"

test("postal settings GET returns public settings without secrets", async () => {
  const previousEnv = {
    POSTAL_AUTH_TYPE: process.env.POSTAL_AUTH_TYPE,
    POSTAL_FROM: process.env.POSTAL_FROM,
    POSTAL_BASE_URL: process.env.POSTAL_BASE_URL,
    POSTAL_API_KEY: process.env.POSTAL_API_KEY,
    POSTAL_TEST_TO: process.env.POSTAL_TEST_TO,
    POSTAL_WEBHOOK_TOKEN: process.env.POSTAL_WEBHOOK_TOKEN,
  }

  process.env.POSTAL_AUTH_TYPE = "smtp-api"
  process.env.POSTAL_FROM = "noreply@uhlhosting.ch"
  process.env.POSTAL_BASE_URL = "https://post.uhlhosting.ch"
  process.env.POSTAL_API_KEY = "postal-secret-api-key"
  process.env.POSTAL_TEST_TO = "customer@highacid.com"
  process.env.POSTAL_WEBHOOK_TOKEN = "postal-secret-webhook-token"

  try {
    const responseBody: any = {}
    const req = {
      scope: {
        resolve: () => null,
      },
    } as any
    const res = {
      json(payload: any) {
        responseBody.payload = payload
        return payload
      },
    } as any

    await GET(req, res)

    assert.equal(responseBody.payload.provider_id, "postal")
    assert.equal(responseBody.payload.auth_type, "smtp-api")
    assert.equal(responseBody.payload.from, "noreply@uhlhosting.ch")
    assert.equal(responseBody.payload.base_url, "https://post.uhlhosting.ch")
    assert.equal(responseBody.payload.test_to, "customer@highacid.com")
    assert.equal(responseBody.payload.api_key, "")
    assert.equal(responseBody.payload.webhook_token, "")
    assert.equal(responseBody.payload.configured.api_key, true)
    assert.equal(responseBody.payload.configured.webhook_token, true)
    assert.match(responseBody.payload.secret_hints.api_key_masked, /\*+-key$/)
    assert.match(
      responseBody.payload.secret_hints.webhook_token_masked,
      /\*+oken$/
    )
    assert.equal(responseBody.payload.diagnostics.settings_source, "db_over_env")
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
})

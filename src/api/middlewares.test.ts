import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync, sign } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
import middlewares, { verifyPostalWebhookSignature } from "./middlewares"

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
})
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString()

// Postal is a Rails app: its `to_json` escapes HTML characters, so the signed
// bytes differ from what JSON.stringify would produce for the parsed body.
const rawJson =
  '{"event":"MessageSent","payload":{"status":"Sent","message":{"subject":"\\u003cb\\u003eHi\\u003c/b\\u003e"}}}'
const rawBody = Buffer.from(rawJson)
const sign64 = (algorithm: string, body: Buffer) =>
  sign(algorithm, body, privateKey).toString("base64")

const withPublicKey = (value: string | undefined, run: () => void) => {
  const previous = process.env.POSTAL_WEBHOOK_PUBLIC_KEY
  if (value === undefined) {
    delete process.env.POSTAL_WEBHOOK_PUBLIC_KEY
  } else {
    process.env.POSTAL_WEBHOOK_PUBLIC_KEY = value
  }

  try {
    run()
  } finally {
    if (previous === undefined) {
      delete process.env.POSTAL_WEBHOOK_PUBLIC_KEY
    } else {
      process.env.POSTAL_WEBHOOK_PUBLIC_KEY = previous
    }
  }
}

const runMiddleware = (req: Record<string, unknown>) => {
  let nextCalls = 0
  verifyPostalWebhookSignature(
    { params: { token: "token_abc" }, body: JSON.parse(rawJson), ...req } as any,
    {} as any,
    () => {
      nextCalls += 1
    }
  )
  return nextCalls
}

const assertRejected = (req: Record<string, unknown>) =>
  assert.throws(
    () => runMiddleware(req),
    (error: MedusaError) =>
      error instanceof MedusaError &&
      error.type === MedusaError.Types.NOT_ALLOWED &&
      error.message === "Invalid Postal webhook signature"
  )

test("signature check is skipped when POSTAL_WEBHOOK_PUBLIC_KEY is unset", () => {
  withPublicKey(undefined, () => {
    assert.equal(runMiddleware({ headers: {} }), 1)
  })
  withPublicKey("   ", () => {
    assert.equal(runMiddleware({ headers: {} }), 1)
  })
})

test("accepts a valid SHA256 signature over the raw body bytes", () => {
  assert.notEqual(JSON.stringify(JSON.parse(rawJson)), rawJson)

  withPublicKey(publicPem, () => {
    assert.equal(
      runMiddleware({
        rawBody,
        headers: { "x-postal-signature-256": sign64("sha256", rawBody) },
      }),
      1
    )
  })
})

test("falls back to the legacy SHA1 signature when the SHA256 header is absent", () => {
  withPublicKey(publicPem, () => {
    assert.equal(
      runMiddleware({
        rawBody,
        headers: { "x-postal-signature": sign64("sha1", rawBody) },
      }),
      1
    )
  })
})

test("does not fall back to SHA1 when the SHA256 signature is present but invalid", () => {
  withPublicKey(publicPem, () => {
    assertRejected({
      rawBody,
      headers: {
        "x-postal-signature-256": sign64("sha1", rawBody),
        "x-postal-signature": sign64("sha1", rawBody),
      },
    })
  })
})

test("rejects a tampered body", () => {
  withPublicKey(publicPem, () => {
    assertRejected({
      rawBody: Buffer.from(rawJson.replace("Sent", "Bounced")),
      headers: { "x-postal-signature-256": sign64("sha256", rawBody) },
    })
  })
})

test("rejects a request without a signature header", () => {
  withPublicKey(publicPem, () => {
    assertRejected({ rawBody, headers: {} })
  })
})

test("rejects a request without a preserved raw body", () => {
  withPublicKey(publicPem, () => {
    assertRejected({
      headers: { "x-postal-signature-256": sign64("sha256", rawBody) },
    })
  })
})

test("accepts a JWK-configured key", () => {
  withPublicKey(JSON.stringify(publicKey.export({ format: "jwk" })), () => {
    assert.equal(
      runMiddleware({
        rawBody,
        headers: { "x-postal-signature-256": sign64("sha256", rawBody) },
      }),
      1
    )
  })
})

test("fails closed with a 500 when the configured key is invalid", () => {
  withPublicKey("not-a-key", () => {
    assert.throws(
      () =>
        runMiddleware({
          rawBody,
          headers: { "x-postal-signature-256": sign64("sha256", rawBody) },
        }),
      (error: MedusaError) =>
        error instanceof MedusaError &&
        error.type === MedusaError.Types.UNEXPECTED_STATE &&
        /not a valid RSA public key/.test(error.message)
    )
  })
})

test("webhook route preserves the raw body and verifies the signature after the token", () => {
  const route = middlewares.routes?.find(
    (entry) => entry.matcher === "/postal/webhooks/:token"
  )

  assert.ok(route)
  assert.deepEqual(route.bodyParser, { sizeLimit: "512kb", preserveRawBody: true })
  const chain = route.middlewares ?? []
  assert.equal(chain.length, 3)
  assert.equal(chain[1], verifyPostalWebhookSignature)
  assert.equal((chain[0] as { name?: string }).name, "authenticatePostalWebhook")
})

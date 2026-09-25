import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync, sign } from "node:crypto"
import {
  hasValidPostalSignature,
  parsePostalWebhookPublicKey,
  resolvePostalWebhookPublicKey,
} from "./webhook-signature"

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
})
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString()
const publicJwk = publicKey.export({ format: "jwk" })
const rawBody = Buffer.from('{"event":"MessageSent","payload":{"status":"Sent"}}')
const sign64 = (algorithm: string, body: Buffer) =>
  sign(algorithm, body, privateKey).toString("base64")

test("parsePostalWebhookPublicKey accepts PEM, escaped PEM, JWK and single-key JWKS", () => {
  const escapedPem = publicPem.trim().replace(/\n/g, "\\n")
  const jwks = JSON.stringify({ keys: [{ ...publicJwk, use: "sig", alg: "RS256" }] })

  for (const value of [publicPem, escapedPem, JSON.stringify(publicJwk), jwks]) {
    const key = parsePostalWebhookPublicKey(value)
    assert.equal(key.asymmetricKeyType, "rsa")
    assert.ok(key.equals(publicKey))
  }
})

test("parsePostalWebhookPublicKey rejects non-RSA keys and garbage", () => {
  const ec = generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey
  const ecPem = ec.export({ type: "spki", format: "pem" }).toString()

  assert.throws(() => parsePostalWebhookPublicKey(ecPem), /RSA/)
  assert.throws(() => parsePostalWebhookPublicKey("not-a-key"))
  assert.throws(() => parsePostalWebhookPublicKey('{"keys":[]}'))
})

test("resolvePostalWebhookPublicKey parses once per value and fails closed on invalid keys", () => {
  const first = resolvePostalWebhookPublicKey(publicPem)
  assert.equal(resolvePostalWebhookPublicKey(publicPem), first)

  assert.throws(
    () => resolvePostalWebhookPublicKey("-----BEGIN PUBLIC KEY-----\nbroken"),
    (error: Error) =>
      /not a valid RSA public key/.test(error.message) &&
      !error.message.includes("broken")
  )
})

test("hasValidPostalSignature prefers SHA256 and falls back to SHA1 only when it is absent", () => {
  const signature256 = sign64("sha256", rawBody)
  const signature = sign64("sha1", rawBody)

  assert.equal(hasValidPostalSignature(rawBody, { signature256 }, publicKey), true)
  assert.equal(hasValidPostalSignature(rawBody, { signature }, publicKey), true)
  assert.equal(
    hasValidPostalSignature(rawBody, { signature256: signature, signature }, publicKey),
    false
  )
  assert.equal(hasValidPostalSignature(rawBody, {}, publicKey), false)
  assert.equal(
    hasValidPostalSignature(rawBody, { signature256: "%%%not-base64%%%" }, publicKey),
    false
  )
})

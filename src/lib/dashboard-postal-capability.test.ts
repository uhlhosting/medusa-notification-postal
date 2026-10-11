import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync, randomUUID, sign } from "node:crypto"
import { createRequire } from "node:module"
import { once } from "node:events"
import {
  authenticateDashboardPostalActivity,
  consumePostalActivityCapability,
  POSTAL_ACTIVITY_MATCHER,
  POSTAL_ACTIVITY_REPLAY_RESOURCE,
  POSTAL_ACTIVITY_REPLAY_SCRIPT,
  type ReplayRedis,
} from "./dashboard-postal-capability"

const { publicKey, privateKey } = generateKeyPairSync("ed25519")
const env = {
  DASHBOARD_POSTAL_ACTIVITY_PUBLIC_KEY: publicKey.export({ type: "spki", format: "pem" }).toString(),
  DASHBOARD_POSTAL_ACTIVITY_PROJECT_ID: "123",
  DASHBOARD_POSTAL_ACTIVITY_ENVIRONMENT: "staging",
  DASHBOARD_POSTAL_ACTIVITY_BACKEND_ORIGIN: "https://tenant.example.test",
  DASHBOARD_POSTAL_ACTIVITY_ISSUER: "https://dashboard.example.test",
  DASHBOARD_POSTAL_ACTIVITY_AUDIENCE: "medusa-postal-activity",
}
const claims = (now = 1000) => ({
  iss: env.DASHBOARD_POSTAL_ACTIVITY_ISSUER,
  aud: env.DASHBOARD_POSTAL_ACTIVITY_AUDIENCE,
  project_id: "123",
  environment: "staging",
  backend_origin: env.DASHBOARD_POSTAL_ACTIVITY_BACKEND_ORIGIN,
  scope: "postal.activity.read",
  iat: now,
  exp: now + 60,
  jti: randomUUID(),
  nonce: randomUUID(),
})
const token = (payload: unknown, header: unknown = { alg: "EdDSA", typ: "JWT" }) => {
  const input = [header, payload].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".")
  return `${input}.${sign(null, Buffer.from(input), privateKey).toString("base64url")}`
}
const ledger = (): ReplayRedis => {
  const keys = new Set<string>()
  return { async eval(script, numberOfKeys, ...args) {
    assert.equal(script, POSTAL_ACTIVITY_REPLAY_SCRIPT)
    assert.equal(numberOfKeys, 2)
    const [jti, nonce, ttl] = args
    assert.match(String(jti), /^postal-activity:\{[a-f0-9]{64}\}:jti:[a-f0-9]{64}$/)
    assert.match(String(nonce), /^postal-activity:\{[a-f0-9]{64}\}:nonce:[a-f0-9]{64}$/)
    assert.ok(Number(ttl) > 0 && Number(ttl) <= 60)
    if (keys.has(String(jti)) || keys.has(String(nonce))) return 0
    keys.add(String(jti)); keys.add(String(nonce))
    return 1
  } }
}

test("accepts exact Ed25519 capability and rejects replay of either identifier across replicas", async () => {
  const shared = ledger()
  const first = claims()
  await consumePostalActivityCapability(token(first), shared, env, 1000)
  for (const next of [first, { ...claims(), jti: first.jti }, { ...claims(), nonce: first.nonce }]) {
    await assert.rejects(consumePostalActivityCapability(token(next), shared, env, 1000), /capability required/)
  }
  const next = token(claims())
  const race = await Promise.allSettled(Array.from({ length: 10 }, () => consumePostalActivityCapability(next, shared, env, 1000)))
  assert.equal(race.filter((result) => result.status === "fulfilled").length, 1)
})

test("rejects every mismatched tenant binding and invalid timing/identifier claim", async () => {
  const changes = {
    iss: "https://other.example.test", aud: "admin", project_id: 123,
    environment: "production", backend_origin: "https://other.example.test",
    scope: "admin", iat: 1001, exp: 1061, jti: "short", nonce: "short",
  }
  for (const [field, value] of Object.entries(changes)) {
    await assert.rejects(consumePostalActivityCapability(token({ ...claims(), [field]: value }), ledger(), env, 1000), /capability required/)
  }
  for (const exp of [1000, 999, 1000.5]) {
    await assert.rejects(consumePostalActivityCapability(token({ ...claims(), exp }), ledger(), env, 1000))
  }
})

test("fails closed for malformed input, keys, headers, missing configuration and Redis outages", async () => {
  for (const assertion of [undefined, [], "bad", "a.b.c", token(null), token(claims(), { alg: "HS256", typ: "JWT" }), token(claims(), { alg: "EdDSA", typ: "JWT", jku: "https://bad.example.test" }), `${token(claims())}x`]) {
    await assert.rejects(consumePostalActivityCapability(assertion, ledger(), env, 1000))
  }
  for (const field of Object.keys(env)) {
    await assert.rejects(consumePostalActivityCapability(token(claims()), ledger(), { ...env, [field]: "" }, 1000))
  }
  for (const origin of ["http://tenant.example.test", "https://tenant.example.test/", "https://user@tenant.example.test"]) {
    await assert.rejects(consumePostalActivityCapability(token(claims()), ledger(), { ...env, DASHBOARD_POSTAL_ACTIVITY_BACKEND_ORIGIN: origin }, 1000))
  }
  await assert.rejects(consumePostalActivityCapability(token(claims()), { eval: async () => { throw new Error("redis unavailable") } }, env, 1000), /capability required/)
})

test("global Express guard handles mounted path and denies alternate spellings, methods and admin credentials", async () => {
  // Resolve Express from the actual installed Medusa framework, not a new
  // undeclared runtime dependency of this plugin.
  const localRequire = createRequire(__filename)
  const frameworkRequire = createRequire(localRequire.resolve("@medusajs/framework/http"))
  const express = frameworkRequire("express")
  const app = express()
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
  Object.assign(process.env, env)
  const shared = ledger()
  app.use((req: any, _res: any, next: () => void) => {
    req.scope = { resolve(name: string) { assert.equal(name, POSTAL_ACTIVITY_REPLAY_RESOURCE); return shared } }
    next()
  })
  app.use(POSTAL_ACTIVITY_MATCHER, (req: any, res: any, next: any) => {
    assert.equal(req.path, "/")
    authenticateDashboardPostalActivity(req, res, next).catch(next)
  })
  app.get("/dashboard/postal/activity", (_req: any, res: any) => res.json({ ok: true }))
  app.use((_error: unknown, _req: any, res: any, _next: any) => res.status(403).json({ denied: true }))
  const server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    const ok = await fetch(`${origin}/dashboard/postal/activity?limit=25`, { headers: { "x-dashboard-postal-assertion": token(claims(Math.floor(Date.now() / 1000))) } })
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get("cache-control"), "no-store")
    for (const path of ["/dashboard/postal/activity/", "/Dashboard/Postal/Activity"]) {
      const response = await fetch(`${origin}${path}`, { headers: { "x-dashboard-postal-assertion": token(claims(Math.floor(Date.now() / 1000))) } })
      assert.equal(response.status, 403)
    }
    for (const method of ["HEAD", "POST", "OPTIONS"]) {
      assert.equal((await fetch(`${origin}/dashboard/postal/activity`, { method })).status, 403)
    }
    assert.equal((await fetch(`${origin}/dashboard/postal/activity`, { headers: { authorization: "Bearer admin-token", cookie: "session=admin", "x-medusa-access-token": "admin-key" } })).status, 403)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

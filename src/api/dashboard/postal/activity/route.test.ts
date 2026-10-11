import test from "node:test"
import assert from "node:assert/strict"
import { GET } from "./route"
import { postalActivityQuerySchema } from "./validators"

test("activity pagination is strict and bounded", () => {
  assert.deepEqual(postalActivityQuerySchema.parse({}), { limit: 25, offset: 0 })
  assert.deepEqual(postalActivityQuerySchema.parse({ limit: "100", offset: "10000" }), { limit: 100, offset: 10000 })
  for (const query of [{ limit: 0 }, { limit: 101 }, { offset: -1 }, { offset: 10001 }, { limit: 1.5 }, { fields: "recipient" }, { order: "created_at" }, { offset: null }, { offset: "" }, { limit: ["25"] }, { limit: true }]) {
    assert.equal(postalActivityQuerySchema.safeParse(query).success, false)
  }
})

test("activity uses retention floor, deterministic pagination and explicit six-field redaction", async () => {
  const before = Date.now()
  let filters: any, config: any, body: any
  const service = { async listAndCountPostalWebhookEvents(filter: any, options: any) {
    filters = filter; config = options
    return [[{ id: "evt", event_type: "MessageSent", status: "sent", message_id: null, occurred_at: null, created_at: "2026-10-11T00:00:00Z", recipient: "private@example.test", payload: { secret: true } }], 42]
  } }
  const headers: Record<string, string> = {}
  await GET({ scope: { resolve: () => service }, validatedQuery: { limit: 25, offset: 10 } } as never, {
    setHeader: (key: string, value: string) => { headers[key] = value },
    status: (code: number) => { assert.equal(code, 200); return { json: (value: unknown) => { body = value } } },
  } as never)
  assert.ok(filters.created_at.$gte instanceof Date)
  assert.ok(filters.created_at.$gte.getTime() >= before - 30 * 86400000)
  assert.ok(filters.created_at.$gte.getTime() <= Date.now() - 30 * 86400000)
  assert.deepEqual(config, { take: 25, skip: 10, order: { created_at: "DESC", id: "DESC" }, select: ["id", "event_type", "status", "message_id", "occurred_at", "created_at"] })
  assert.equal(headers["Cache-Control"], "no-store")
  assert.deepEqual(body, { events: [{ id: "evt", event_type: "MessageSent", status: "sent", message_id: null, occurred_at: null, created_at: "2026-10-11T00:00:00Z" }], count: 42, limit: 25, offset: 10 })
})

test("activity fails closed when module is unavailable", async () => {
  await assert.rejects(GET({ scope: { resolve: () => undefined } } as never, {} as never), /unavailable/)
})

import test from "node:test"
import assert from "node:assert/strict"
import { GET } from "./route"

test("admin webhook route returns webhook events from pgConnection", async () => {
  const calls: Array<{ sql: string; params?: unknown[] }> = []
  const pgConnection = {
    raw: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params })
      return {
        rows: [
          {
            id: "postal_webhook_1",
            event_type: "message.sent",
            status: "sent",
            message_id: "msg_1",
            recipient: "recipient@example.com",
            occurred_at: "2026-06-28T12:00:00.000Z",
            created_at: "2026-06-28T12:01:00.000Z",
            payload: {},
          },
        ],
      }
    },
  }

  const req = {
    scope: {
      resolve: (name: string) => {
        assert.equal(name, "pgConnection")
        return pgConnection
      },
    },
    query: {},
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

  assert.equal(calls.length, 1)
  assert.equal(responseBody.status, 200)
  assert.equal(responseBody.payload.events[0].id, "postal_webhook_1")
  assert.equal(responseBody.payload.events[0].status, "sent")
})

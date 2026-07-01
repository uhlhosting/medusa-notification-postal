import test from "node:test"
import assert from "node:assert/strict"
import { resolveOptionalPgConnection } from "./db"

test("resolveOptionalPgConnection prefers the first usable connection alias", () => {
  const preferred = { raw: () => ({}) }
  const container = {
    resolve: (key: string) => {
      if (key === "pgConnection") {
        return preferred
      }

      throw new Error(`missing ${key}`)
    },
  }

  assert.equal(resolveOptionalPgConnection(container as never), preferred)
})

test("resolveOptionalPgConnection falls back to query-capable aliases and returns null otherwise", () => {
  const queried = { query: () => ({}) }
  const container = {
    resolve: (key: string) => {
      if (key === "__pg_connection__") {
        return queried
      }

      throw new Error(`missing ${key}`)
    },
  }

  assert.equal(resolveOptionalPgConnection(container as never), queried)
  assert.equal(resolveOptionalPgConnection({ resolve: () => null } as never), null)
})

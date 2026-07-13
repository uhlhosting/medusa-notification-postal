import assert from "node:assert/strict"
import test from "node:test"
import {
  POSTAL_PROVIDER_CONTAINER_KEY,
  resolvePostalProvider,
} from "./resolve-provider"

test("resolvePostalProvider resolves Medusa's provider registration key", () => {
  const provider = { getHealthSnapshot: () => ({ auth_type: "smtp-api", mode: "api" }) }
  let resolvedKey = ""

  const result = resolvePostalProvider({
    resolve: (key) => {
      resolvedKey = key
      return provider
    },
  })

  assert.equal(POSTAL_PROVIDER_CONTAINER_KEY, "np_postal")
  assert.equal(resolvedKey, "np_postal")
  assert.equal(result, provider)
})

test("resolvePostalProvider rejects an empty provider registration", () => {
  assert.throws(
    () => resolvePostalProvider({ resolve: () => undefined }),
    /Postal notification provider is not loaded/
  )
})

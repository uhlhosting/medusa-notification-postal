import assert from "node:assert/strict"
import test from "node:test"
import {
  POSTAL_PROVIDER_ID,
  resolvePostalProvider,
} from "./resolve-provider"

test("resolvePostalProvider delegates to the Notification module provider registry", () => {
  const provider = { getHealthSnapshot: () => ({ auth_type: "smtp-api", mode: "api" }) }
  let resolvedKey = ""
  let resolvedProviderId = ""

  const result = resolvePostalProvider({
    resolve: (key) => {
      resolvedKey = key
      return {
        notificationProviderService_: {
          retrieveProviderRegistration: (providerId: string) => {
            resolvedProviderId = providerId
            return provider
          },
        },
      }
    },
  })

  assert.equal(POSTAL_PROVIDER_ID, "postal")
  assert.equal(resolvedKey, "notification")
  assert.equal(resolvedProviderId, "postal")
  assert.equal(result, provider)
})

test("resolvePostalProvider rejects an empty provider registration", () => {
  assert.throws(
    () => resolvePostalProvider({ resolve: () => ({}) }),
    /Postal notification provider is not loaded/
  )
})

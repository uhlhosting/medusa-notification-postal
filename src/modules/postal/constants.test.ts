import test from "node:test"
import assert from "node:assert/strict"
import { resolvePostalModule, POSTAL_PLUGIN_MODULE } from "./constants"

test("resolvePostalModule returns the resolved module when available", () => {
  const expectedModule = { fakeService: true }
  const container = {
    resolve: (key: string) => {
      assert.strictEqual(key, POSTAL_PLUGIN_MODULE)
      return expectedModule
    }
  }

  const result = resolvePostalModule(container)
  assert.strictEqual(result, expectedModule)
})

test("resolvePostalModule returns null when resolving throws an error", () => {
  const container = {
    resolve: () => {
      throw new Error("Resolution failed")
    }
  }

  const result = resolvePostalModule(container)
  assert.strictEqual(result, null)
})

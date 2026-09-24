import test from "node:test"
import assert from "node:assert/strict"
import { postalSettingsSchema } from "./validators"

const save = (base_url: string) =>
  postalSettingsSchema.safeParse({ action: "save", settings: { base_url } })

test("settings schema accepts http(s) and empty base_url values", () => {
  assert.equal(save("https://postal.example.com").success, true)
  assert.equal(save("http://postal.internal:5000").success, true)
  assert.equal(save("").success, true)
})

test("settings schema rejects base_url values that are not http(s) URLs", () => {
  assert.equal(save("ftp://postal.example.com").success, false)
  assert.equal(save("file:///etc/passwd").success, false)
  assert.equal(save("postal.example.com").success, false)
})

test("settings schema still rejects secret fields", () => {
  const result = postalSettingsSchema.safeParse({
    action: "save",
    settings: { api_key: "secret" },
  })
  assert.equal(result.success, false)
})

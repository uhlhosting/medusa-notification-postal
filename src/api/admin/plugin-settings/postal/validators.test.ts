import test from "node:test"
import assert from "node:assert/strict"
import { postalSettingsSchema } from "./validators"

test("postal settings schema accepts only non-secret save fields", () => {
  const result = postalSettingsSchema.safeParse({
    action: "save",
    settings: {
      auth_type: "smtp-api",
      from: "sender@example.com",
      base_url: "https://postal.example.com",
      test_to: "test@example.com",
    },
  })

  assert.equal(result.success, true)
})

test("postal settings schema strictly rejects secrets and test actions", () => {
  assert.equal(
    postalSettingsSchema.safeParse({
      action: "save",
      settings: { api_key: "must-not-be-accepted" },
    }).success,
    false
  )
  assert.equal(
    postalSettingsSchema.safeParse({ action: "test", settings: {} }).success,
    false
  )
})

test("postal settings schema validates persisted URL and email formats", () => {
  assert.equal(
    postalSettingsSchema.safeParse({
      action: "save",
      settings: {
        from: "bad\r\naddress@example.com",
        base_url: "ftp://postal.example.com",
      },
    }).success,
    false
  )
})

test("postal settings schema refuses a base_url the provider's SSRF guard would refuse", () => {
  const save = (base_url: string) =>
    postalSettingsSchema.safeParse({ action: "save", settings: { base_url } })

  for (const base_url of [
    "http://localhost:5000",
    "http://127.0.0.1",
    "http://10.0.0.5",
    "http://100.64.0.1",
    "http://169.254.169.254",
    "http://[::1]",
    "http://[::ffff:192.168.1.1]",
  ]) {
    const result = save(base_url)
    assert.equal(result.success, false, base_url)
    assert.match(
      JSON.stringify(result.error?.issues),
      /non-public IP address/,
      base_url
    )
  }

  for (const base_url of ["https://postal.example.com", "http://1.1.1.1", ""]) {
    assert.equal(save(base_url).success, true, base_url)
  }
})

test("postal settings schema refuses a base_url with credentials, query or fragment", () => {
  for (const base_url of [
    "https://user:pw@postal.example.com",
    "https://postal.example.com?token=1",
    "https://postal.example.com/#frag",
    "https://postal.example.com?",
  ]) {
    const result = postalSettingsSchema.safeParse({
      action: "save",
      settings: { base_url },
    })
    assert.equal(result.success, false, base_url)
    assert.match(JSON.stringify(result.error?.issues), /without credentials, query or fragment/)
  }

  assert.equal(
    postalSettingsSchema.safeParse({
      action: "save",
      settings: { base_url: "https://postal.example.com/postal" },
    }).success,
    true
  )
})

test("postal settings schema reports one issue for a non-http base_url", () => {
  const result = postalSettingsSchema.safeParse({
    action: "save",
    settings: { base_url: "ftp://postal.example.com" },
  })

  assert.equal(result.success, false)
  assert.deepEqual(
    result.error?.issues.map((issue) => issue.message),
    ["Must be an absolute http or https URL"]
  )
})

import test from "node:test"
import assert from "node:assert/strict"
import {
  MAX_RETENTION_DAYS,
  readPostalPluginOptions,
  resolvePostalPluginOptions,
  resolveRetentionDays,
} from "./options"
import PostalPluginModuleService from "./service"

test("every option is off when nothing is configured", () => {
  const off = {
    notification_retention_days: { days: null, invalid: false },
    webhook_event_retention_days: { days: null, invalid: false },
    ignore_engagement_webhooks: false,
  }

  assert.deepEqual(resolvePostalPluginOptions(undefined), off)
  assert.deepEqual(resolvePostalPluginOptions(null), off)
  assert.deepEqual(resolvePostalPluginOptions({}), off)
  assert.deepEqual(
    resolvePostalPluginOptions({
      notification_retention_days: "",
      webhook_event_retention_days: null,
    }),
    off
  )
})

test("retention days accept positive whole numbers and numeric strings", () => {
  assert.deepEqual(resolveRetentionDays(90), { days: 90, invalid: false })
  assert.deepEqual(resolveRetentionDays("30"), { days: 30, invalid: false })
  assert.deepEqual(resolveRetentionDays(" 7 "), { days: 7, invalid: false })
  assert.deepEqual(resolveRetentionDays(MAX_RETENTION_DAYS), {
    days: MAX_RETENTION_DAYS,
    invalid: false,
  })
})

test("unusable retention days switch the purge off and are flagged", () => {
  for (const value of [
    0,
    -1,
    1.5,
    Number.NaN,
    "abc",
    "90d",
    "1e3",
    MAX_RETENTION_DAYS + 1,
    true,
    {},
  ]) {
    assert.deepEqual(
      resolveRetentionDays(value),
      { days: null, invalid: true },
      `value ${String(value)}`
    )
  }
})

test("ignore_engagement_webhooks accepts booleans and env-style strings", () => {
  assert.equal(
    resolvePostalPluginOptions({ ignore_engagement_webhooks: true })
      .ignore_engagement_webhooks,
    true
  )
  assert.equal(
    resolvePostalPluginOptions({ ignore_engagement_webhooks: "true" })
      .ignore_engagement_webhooks,
    true
  )
  assert.equal(
    resolvePostalPluginOptions({ ignore_engagement_webhooks: "false" })
      .ignore_engagement_webhooks,
    false
  )
  assert.equal(
    resolvePostalPluginOptions({ ignore_engagement_webhooks: false })
      .ignore_engagement_webhooks,
    false
  )
})

test("readPostalPluginOptions treats a missing reader as every option off", async () => {
  assert.equal(
    (await readPostalPluginOptions(null)).notification_retention_days.days,
    null
  )
  assert.equal(
    (await readPostalPluginOptions({})).ignore_engagement_webhooks,
    false
  )
})

test("the module service exposes the plugin options it was constructed with", async () => {
  const service = new (PostalPluginModuleService as any)(
    {},
    {
      notification_retention_days: 90,
      webhook_event_retention_days: "30",
      ignore_engagement_webhooks: true,
    }
  )

  assert.deepEqual(await service.getPluginOptions(), {
    notification_retention_days: { days: 90, invalid: false },
    webhook_event_retention_days: { days: 30, invalid: false },
    ignore_engagement_webhooks: true,
  })
  assert.deepEqual(
    await readPostalPluginOptions(service),
    await service.getPluginOptions()
  )
})

test("the module service defaults every option off without plugin options", async () => {
  const service = new (PostalPluginModuleService as any)({})

  assert.deepEqual(
    await service.getPluginOptions(),
    resolvePostalPluginOptions({})
  )
})

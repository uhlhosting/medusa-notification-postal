import test from "node:test"
import assert from "node:assert/strict"
import purgeExpiredNotifications, {
  config as notificationConfig,
} from "./purge-expired-notifications"
import purgePostalWebhookEvents, {
  config as webhookConfig,
} from "./purge-postal-webhook-events"

test("the purge jobs run once a day under plugin-prefixed names", () => {
  assert.deepEqual(notificationConfig, {
    name: "postal-purge-expired-notifications",
    schedule: "30 3 * * *",
  })
  assert.deepEqual(webhookConfig, {
    name: "postal-purge-webhook-events",
    schedule: "40 3 * * *",
  })
})

test("the purge jobs are inert in a store that has not configured them", async () => {
  const resolved: string[] = []
  const container = {
    resolve: (key: string) => {
      resolved.push(key)
      if (key === "postalPlugin") {
        return { getPluginOptions: undefined }
      }
      throw new Error(`unexpected dependency: ${key}`)
    },
  }

  await purgeExpiredNotifications(container as never)
  await purgePostalWebhookEvents(container as never)

  // Only the options were read: no workflow, notification module or logger.
  assert.deepEqual(resolved, ["postalPlugin", "postalPlugin"])
})

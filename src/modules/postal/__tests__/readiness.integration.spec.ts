import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import PostalPluginModuleService from "../service"
import PostalSetting from "../models/postal-setting"
import PostalWebhookEvent from "../models/postal-webhook-event"
import { recordPostalWebhookEvent } from "../webhooks"
import { registerRetentionCases } from "./retention-cases"
jest.setTimeout(60_000)
moduleIntegrationTestRunner<PostalPluginModuleService>({
  pathToMigrations: "./src/modules/postal/migrations", moduleName: "postalPlugin",
  moduleModels: [PostalSetting, PostalWebhookEvent], resolve: "./src/modules/postal", dbName: "postal_readiness_native",
  testSuite: ({ service }) => {
    registerRetentionCases(service)
    const payload = { event: "MessageDelayed", timestamp: 1730000000, payload: { status: "Delayed", message: { id: 28638, tag: "uhlhosting.medusa-notification-postal:native" } }, uuid: "native-callback-1" }
    it("deduplicates concurrent callbacks using a database unique index", async () => {
      const results = await Promise.all(Array.from({ length: 8 }, () => recordPostalWebhookEvent(service as any, payload)))
      expect(results.filter(row => !row?.duplicate)).toHaveLength(1)
      expect(await service.listPostalWebhookEvents()).toHaveLength(1)
      expect(results[0]).toMatchObject({ message_id: "28638" })
    })
    it("fences concurrent publishers and recovers an abandoned owner lease", async () => {
      const event = await recordPostalWebhookEvent(service as any, payload)
      const claims = await Promise.all(Array.from({ length: 8 }, () => service.claimWebhookPublication(event!.id)))
      expect(claims.filter(Boolean)).toHaveLength(1)
      const owner = claims.find(Boolean)!
      expect(await service.settleWebhookPublication(event!.id, "wrong-owner", true)).toBe(false)
      await service.updatePostalWebhookEvents({ id: event!.id, publication_expires_at: new Date(0) })
      const recovered = await service.claimWebhookPublication(event!.id)
      expect(recovered).not.toBe(owner)
      expect(await service.settleWebhookPublication(event!.id, owner, true)).toBe(false)
      expect(await service.settleWebhookPublication(event!.id, recovered!, true)).toBe(true)
      expect(await service.claimWebhookPublication(event!.id)).toBeNull()
    })
    it("preserves distinct recurring delays and deduplicates missing message IDs", async () => {
      await recordPostalWebhookEvent(service as any, payload)
      await recordPostalWebhookEvent(service as any, { ...payload, uuid: "native-callback-2", timestamp: 1730000001 })
      const noId = { event: "MessageSent", payload: { status: "Sent", tag: "uhlhosting.medusa-notification-postal:native" } }
      await recordPostalWebhookEvent(service as any, noId)
      expect((await recordPostalWebhookEvent(service as any, noId))?.duplicate).toBe(true)
      expect(await service.listPostalWebhookEvents()).toHaveLength(3)
      expect((await service.listPostalWebhookEvents()).every(row => row.recipient === null && JSON.stringify(row.payload) === "{}")).toBe(true)
    })
  },
})

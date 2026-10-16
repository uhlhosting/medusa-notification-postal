import type PostalPluginModuleService from "../service"
import { postalDeleteExpiredWebhookEventsStepHandler } from "../../../workflows/steps/postal-delete-expired-webhook-events"

/** Share the existing module boot: Medusa's registry is process-global. */
export function registerRetentionCases(service: PostalPluginModuleService) {
  const row = (id: string) => ({
    id,
    event_type: "MessageSent",
    status: "Sent",
    payload: {}
  })
  const purge = () =>
    postalDeleteExpiredWebhookEventsStepHandler(
      // All freshly created fixture rows are older than this future cutoff.
      {
        now: new Date(Date.now() + 31 * 86_400_000).toISOString(),
        retention_days: 30
      },
      { container: { resolve: () => service } }
    )

  it("preserves pending, leased and inconsistent lease receipts, deleting only published unleased rows", async () => {
    await service.createPostalWebhookEvents([
      row("pending"),
      {
        ...row("leased"),
        publication_owner: "owner",
        publication_expires_at: new Date(Date.now() + 120_000)
      },
      {
        ...row("expired"),
        publication_owner: "expired-owner",
        publication_expires_at: new Date(0)
      },
      { ...row("published"), published_at: new Date() },
      {
        ...row("published-leased"),
        published_at: new Date(),
        publication_owner: "owner",
        publication_expires_at: new Date(Date.now() + 120_000)
      },
      {
        ...row("orphan-lease"),
        published_at: new Date(),
        publication_expires_at: new Date(Date.now() + 120_000)
      }
    ])
    const result = await purge()
    expect(result.output.deleted).toBe(1)
    expect(
      (await service.listPostalWebhookEvents()).map((r) => r.id).sort()
    ).toEqual([
      "expired",
      "leased",
      "orphan-lease",
      "pending",
      "published-leased"
    ])
    expect((await purge()).output.deleted).toBe(0)
  })

  it("does not let more than one batch of pending receipts starve eligible rows", async () => {
    await service.createPostalWebhookEvents(
      Array.from({ length: 501 }, (_, i) => row(`pending-${i}`))
    )
    await service.createPostalWebhookEvents(
      Array.from({ length: 501 }, (_, i) => ({
        ...row(`published-${i}`),
        published_at: new Date()
      }))
    )
    expect((await purge()).output.deleted).toBe(501)
    const remaining = await service.listPostalWebhookEvents({}, { take: 1_100 })
    expect(remaining).toHaveLength(501)
    expect(remaining.every((r) => r.published_at === null)).toBe(true)
  })

  it("cannot acquire a publication claim on a published purge candidate", async () => {
    await service.createPostalWebhookEvents({
      ...row("published-race"),
      published_at: new Date()
    })
    const [owner, result] = await Promise.all([
      service.claimWebhookPublication("published-race"),
      purge()
    ])
    expect(owner).toBeNull()
    expect(result.output.deleted).toBe(1)
  })

  it("retains published metadata inside the configured creation-time window", async () => {
    await service.createPostalWebhookEvents({
      ...row("recent"),
      published_at: new Date()
    })
    const result = await postalDeleteExpiredWebhookEventsStepHandler(
      { now: new Date().toISOString(), retention_days: 30 },
      { container: { resolve: () => service } }
    )
    expect(result.output.deleted).toBe(0)
    expect(await service.retrievePostalWebhookEvent("recent")).toMatchObject({
      id: "recent"
    })
  })
}

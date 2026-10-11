import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import postalWebhookPublication from "../../src/jobs/postal-webhook-publication"
import { Modules } from "@medusajs/framework/utils"
import { resolvePostalProvider } from "../../src/providers/postal/resolve-provider"
jest.setTimeout(120_000)
medusaIntegrationTestRunner({ inApp: true, dbName: "postal_http_native", testSuite: ({ api, getContainer }) => {
  it("registers the actual Postal provider in the Notification module", async () => {
    const provider = resolvePostalProvider(getContainer())
    expect(provider.constructor.name).toBe("PostalNotificationService")
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "success", data: { message_id: "isolated-message", messages: {} } }), { status: 200 }))
    await provider.send({ to: "recipient@example.invalid", template: "native", data: {}, provider_data: { subject: "Native contract", text: "Isolated fixture" } } as any)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({ redirect: "error" })
    fetchSpy.mockRestore()
  })
  it("requires admin authentication and a valid callback token", async () => {
    await expect(api.get("/admin/postal/health")).rejects.toMatchObject({ response: { status: 401 } })
    await expect(api.post("/postal/webhooks/wrong-token", {})).rejects.toMatchObject({ response: { status: 400 } })
  })
  it("records one event and emits once across real HTTP callback retries", async () => {
    const bus = getContainer().resolve(Modules.EVENT_BUS)
    const emit = jest.spyOn(bus, "emit").mockResolvedValue(undefined)
    const data = { event: "MessageSent", timestamp: 1730000000, uuid: "native-http-1", payload: { status: "Sent", message: { id: 28638, tag: "uhlhosting.medusa-notification-postal:native" } } }
    await api.post("/postal/webhooks/isolated-postal-callback-token", data)
    await api.post("/postal/webhooks/isolated-postal-callback-token", data)
    expect(await (getContainer().resolve("postalPlugin") as any).listPostalWebhookEvents()).toHaveLength(1)
    expect(emit.mock.calls.filter(([message]) => !Array.isArray(message) && message.name === "postal.sent")).toHaveLength(1)
    emit.mockRestore()
  })
  it("recovers a failed bus publication on callback retry without resending after acknowledgment", async () => {
    const bus = getContainer().resolve(Modules.EVENT_BUS)
    let failed = false
    const emit = jest.spyOn(bus, "emit").mockImplementation(async message => {
      if (!Array.isArray(message) && message.name === "postal.sent" && !failed) { failed = true; throw new Error("isolated bus unavailable") }
    })
    const data = { event: "MessageSent", uuid: "native-bus-fault", payload: { status: "Sent", message: { id: 777, tag: "uhlhosting.medusa-notification-postal:native" } } }
    await expect(api.post("/postal/webhooks/isolated-postal-callback-token", data)).rejects.toBeDefined()
    await api.post("/postal/webhooks/isolated-postal-callback-token", data)
    await api.post("/postal/webhooks/isolated-postal-callback-token", data)
    expect(emit.mock.calls.filter(([message]) => !Array.isArray(message) && message.name === "postal.sent")).toHaveLength(2)
    expect((await (getContainer().resolve("postalPlugin") as any).listPostalWebhookEvents())[0].published_at).not.toBeNull()
    emit.mockRestore()
  })

  it("reports lost acknowledgment ownership and re-emits the same stable event ID", async () => {
    const service = getContainer().resolve("postalPlugin") as any
    const ids: string[] = []
    const emit = jest.spyOn(getContainer().resolve(Modules.EVENT_BUS), "emit").mockImplementation(async message => {
      if (!Array.isArray(message) && message.name === "postal.sent") {
        const id = (message.data as any).id; ids.push(id)
        if (ids.length === 1) await service.updatePostalWebhookEvents({ id, publication_owner: "new-crash-owner", publication_expires_at: new Date(0) })
      }
    })
    const payload = { event: "MessageSent", uuid: "owner-loss", payload: { status: "Sent", message: { id: 888, tag: "uhlhosting.medusa-notification-postal:native" } } }
    await expect(api.post("/postal/webhooks/isolated-postal-callback-token", payload)).rejects.toBeDefined()
    await api.post("/postal/webhooks/isolated-postal-callback-token", payload)
    expect(ids).toHaveLength(2)
    expect(ids[1]).toBe(ids[0])
    emit.mockRestore()
  })
  it("rotates failing backlog so newer publications are not starved", async () => {
    const service = getContainer().resolve("postalPlugin") as any
    await service.createPostalWebhookEvents(Array.from({ length: 101 }, (_, index) => ({
      id: `backlog-${String(index).padStart(3, "0")}`, event_type: "message.sent", status: "sent", message_id: String(index), payload: {}, replay_key: `backlog-${index}`, occurred_at: null,
    })))
    const newest = "backlog-100"
    const emitted: string[] = []
    const emit = jest.spyOn(getContainer().resolve(Modules.EVENT_BUS), "emit").mockImplementation(async message => {
      if (!Array.isArray(message) && message.name === "postal.sent") {
        const id = (message.data as any).id
        if (id !== newest) throw new Error("isolated persistent bus failure")
        emitted.push(id)
      }
    })
    await postalWebhookPublication(getContainer())
    await postalWebhookPublication(getContainer())
    expect(emitted).toContain(newest)
    expect((await service.retrievePostalWebhookEvent(newest)).published_at).not.toBeNull()
    emit.mockRestore()
  })

} })

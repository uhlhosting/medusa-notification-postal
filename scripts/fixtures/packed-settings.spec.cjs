const { medusaIntegrationTestRunner } = require("@medusajs/test-utils")
const { Modules, ContainerRegistrationKeys, generateJwtToken } = require("@medusajs/framework/utils")
jest.setTimeout(120000)
medusaIntegrationTestRunner({ inApp: true, dbName: "postal_packed_boot_" + process.env.POSTAL_BOOT_CASE, testSuite: ({ getContainer, api }) => {
  it("applies only the validated persisted boot revision through the installed provider", async () => {
    const container = getContainer()
    const settings = container.resolve("postalPlugin")
    const [initial] = await settings.listPostalSettings({ id: "postal" })
    expect(initial.pending_restart).toBe(true)
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ status: "success", data: { message_id: "isolated-settings", messages: {} } }), { status: 200 }))
    try {
      const resolve = () => container.resolve(Modules.NOTIFICATION).notificationProviderService_.retrieveProviderRegistration("postal")
      if (process.env.POSTAL_BOOT_CASE === "mismatch") {
        expect(resolve).toThrow(/operator-approved/)
        expect(fetchSpy).not.toHaveBeenCalled()
        expect((await settings.listPostalSettings({ id: "postal" }))[0].pending_restart).toBe(true)
        return
      }
      const provider = resolve()
      const user = await container.resolve(Modules.USER).createUsers({ email: "settings-admin@example.invalid" })
      const token = generateJwtToken({ actor_id: user.id, actor_type: "user", auth_identity_id: "isolated" }, { secret: container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http.jwtSecret, expiresIn: "1m" })
      const save = async (from) => api.post("/admin/plugin-settings/postal", { action: "save", settings: { from } }, { headers: { Authorization: "Bearer " + token } })
      const notification = { to: "recipient@example.invalid", template: "native", data: {}, provider_data: { subject: "Boot settings", text: "Isolated fixture" } }
      if (process.env.POSTAL_BOOT_CASE === "late-save") {
        await save("saved-sender@example.invalid")
      }
      await provider.send(notification)
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body).from).toBe("saved-sender@example.invalid")
      const [after] = await settings.listPostalSettings({ id: "postal" })
      expect(after.pending_restart).toBe(process.env.POSTAL_BOOT_CASE === "late-save")
      expect(after.from_address).toBe("saved-sender@example.invalid")
      await save("latest-sender@example.invalid")
      await provider.send(notification)
      expect(JSON.parse(fetchSpy.mock.calls[1][1].body).from).toBe("saved-sender@example.invalid")
      expect((await settings.listPostalSettings({ id: "postal" }))[0].pending_restart).toBe(true)
    } finally { fetchSpy.mockRestore() }
  })
} })

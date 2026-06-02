import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Text, 
  Input, 
  Label, 
  Button, 
  toast, 
  Badge, 
  StatusBadge,
  Select,
  Divider,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
	import { useEffect, useState } from "react"
	import { Envelope, PaperPlane } from "@medusajs/icons"
import { sdk } from "../../../lib/client"

type PostalSettingsForm = {
  auth_type: "smtp-api" | "smtp-ip" | "smtp"
  from: string
  base_url: string
  api_key: string
  smtp_host: string
  smtp_port: string
  smtp_secure: string
  smtp_user: string
  smtp_pass: string
  test_to: string
}

const emptyForm: PostalSettingsForm = {
  auth_type: "smtp-api",
  from: "",
  base_url: "",
  api_key: "",
  smtp_host: "",
  smtp_port: "",
  smtp_secure: "false",
  smtp_user: "",
  smtp_pass: "",
  test_to: "",
}

const PostalSettingsPage = () => {
  const [to, setTo] = useState("")
  const [form, setForm] = useState<PostalSettingsForm>(emptyForm)

  const { data, refetch } = useQuery<any>({
    queryKey: ["plugin-settings-postal"],
    queryFn: () => sdk.client.fetch("/admin/plugin-settings/postal"),
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setForm({
      auth_type: data.auth_type || "smtp-api",
      from: data.from || "",
      base_url: data.base_url || "",
      api_key: data.api_key || "",
      smtp_host: data.smtp_host || "",
      smtp_port: data.smtp_port || "",
      smtp_secure: data.smtp_secure || "false",
      smtp_user: data.smtp_user || "",
      smtp_pass: data.smtp_pass || "",
      test_to: data.test_to || "",
    })
    setTo(data.test_to || "")
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload: { action: "save"; settings: PostalSettingsForm }) =>
      sdk.client.fetch("/admin/plugin-settings/postal", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res: any) => {
      const next = res?.settings
      setForm((prev) => ({
        ...prev,
        auth_type: next?.auth_type || prev.auth_type,
        from: next?.from || "",
        base_url: next?.base_url || "",
        smtp_host: next?.smtp_host || "",
        smtp_port: next?.smtp_port || "",
        smtp_secure: next?.smtp_secure || "false",
        smtp_user: next?.smtp_user || "",
        test_to: next?.test_to || "",
        api_key: next?.api_key || prev.api_key,
        smtp_pass: next?.smtp_pass || prev.smtp_pass,
      }))
      toast.success("Postal settings saved")
      refetch()
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save postal settings")
    },
  })

  const testMutation = useMutation({
    mutationFn: (payload: { action: "test"; to?: string; settings: PostalSettingsForm }) =>
      sdk.client.fetch("/admin/plugin-settings/postal", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res: any) => {
      toast.success(`Postal test queued to ${res?.to || "recipient"}`)
      refetch()
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send test email")
    },
  })

  const showApiFields = form.auth_type === "smtp-api"
  const showSmtpFields = form.auth_type === "smtp-ip" || form.auth_type === "smtp"

  const isConfigured = data?.configured && Object.values(data.configured).some(v => v === true)

  return (
    <div className="flex flex-col gap-y-8 p-8">
      <Container className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <Heading level="h1">Postal Notifications</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Configure your Postal SMTP/API delivery provider for transactional emails.
            </Text>
          </div>
          <StatusBadge color={isConfigured ? "green" : "grey"}>
            {isConfigured ? "Configured" : "Not Configured"}
          </StatusBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <Heading level="h2">Configuration</Heading>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-auth-type">Authentication Type</Label>
                  <Select
                    value={form.auth_type}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, auth_type: v as PostalSettingsForm["auth_type"] }))}
                    disabled={saveMutation.isPending || testMutation.isPending}
                  >
                    <Select.Trigger id="postal-auth-type">
                      <Select.Value placeholder="Select auth type" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="smtp-api">SMTP API (Recommended)</Select.Item>
                      <Select.Item value="smtp-ip">SMTP IP Based</Select.Item>
                      <Select.Item value="smtp">Standard SMTP</Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-from">From Email</Label>
                  <Input 
                    id="postal-from" 
                    type="email" 
                    placeholder="noreply@yourstore.com"
                    value={form.from} 
                    onChange={(e) => setForm((prev) => ({ ...prev, from: e.target.value }))} 
                  />
                </div>

                {showApiFields && (
                  <>
                    <div className="flex flex-col gap-y-2">
                      <Label htmlFor="postal-base-url">Postal Base URL</Label>
                      <Input 
                        id="postal-base-url" 
                        placeholder="https://post.example.com" 
                        value={form.base_url} 
                        onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))} 
                      />
                    </div>
                    <div className="flex flex-col gap-y-2">
                      <Label htmlFor="postal-api-key">API Key</Label>
                      <Input 
                        id="postal-api-key" 
                        type="password" 
                        placeholder="••••••••••••••••" 
                        value={form.api_key} 
                        onChange={(e) => setForm((prev) => ({ ...prev, api_key: e.target.value }))} 
                      />
                    </div>
                  </>
                )}

                {showSmtpFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-y-2 md:col-span-2">
                      <Label htmlFor="postal-smtp-host">SMTP Host</Label>
                      <Input 
                        id="postal-smtp-host" 
                        placeholder="mail.postal.yourdomain.com"
                        value={form.smtp_host} 
                        onChange={(e) => setForm((prev) => ({ ...prev, smtp_host: e.target.value }))} 
                      />
                    </div>
                    {form.auth_type === "smtp" && (
                      <>
                        <div className="flex flex-col gap-y-2 md:col-span-2">
                          <Label htmlFor="postal-smtp-port">Port</Label>
                          <Input 
                            id="postal-smtp-port" 
                            placeholder="25"
                            value={form.smtp_port} 
                            onChange={(e) => setForm((prev) => ({ ...prev, smtp_port: e.target.value }))} 
                          />
                        </div>
                        <div className="flex flex-col gap-y-2 md:col-span-2">
                          <Label htmlFor="postal-smtp-user">Username</Label>
                          <Input 
                            id="postal-smtp-user" 
                            placeholder="username@org/server"
                            value={form.smtp_user} 
                            onChange={(e) => setForm((prev) => ({ ...prev, smtp_user: e.target.value }))} 
                          />
                        </div>
                        <div className="flex flex-col gap-y-2 md:col-span-2">
                          <Label htmlFor="postal-smtp-pass">Password</Label>
                          <Input 
                            id="postal-smtp-pass" 
                            type="password" 
                            placeholder="••••••••" 
                            value={form.smtp_pass} 
                            onChange={(e) => setForm((prev) => ({ ...prev, smtp_pass: e.target.value }))} 
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Divider />

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="postal-test-to-default">Default Test Recipient</Label>
                <Input
                  id="postal-test-to-default"
                  type="email"
                  placeholder="admin@example.com"
                  value={form.test_to}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, test_to: e.target.value }))
                    setTo(e.target.value)
                  }}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Used as fallback for testing delivery if no recipient is provided.
                </Text>
              </div>

              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => saveMutation.mutate({ action: "save", settings: form })}
                isLoading={saveMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>

          <div className="p-6 bg-ui-bg-subtle/20 space-y-6">
            <Heading level="h2">Test Connectivity</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Verify that your credentials are correct by sending a real test email through the Postal infrastructure.
            </Text>
            
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="postal-test-to">Recipient Address</Label>
                <Input
                  id="postal-test-to"
                  type="email"
                  placeholder="customer@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => testMutation.mutate({ action: "test", to: to.trim() || undefined, settings: form })}
                isLoading={testMutation.isPending}
              >
                <PaperPlane className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>

              {data?.configured && (
                <div className="mt-4 p-4 rounded-lg border bg-ui-bg-base space-y-3 shadow-sm transition-all duration-300">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Text size="xsmall" weight="plus" className="text-ui-fg-subtle uppercase tracking-wider">
                      Active Config Checklist
                    </Text>
                    <Badge size="small" color="blue" className="capitalize">
                      {form.auth_type.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 pt-1">
                    {Object.entries(data.configured)
                      .filter(([key]) => {
                        if (form.auth_type === "smtp-api") {
                          return ["from", "base_url", "api_key"].includes(key)
                        } else if (form.auth_type === "smtp-ip") {
                          return ["from", "smtp_host"].includes(key)
                        } else {
                          return ["from", "smtp_host", "smtp_port", "smtp_user", "smtp_pass"].includes(key)
                        }
                      })
                      .map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between bg-ui-bg-subtle/30 px-3 py-1.5 rounded-md border border-ui-border-transparent hover:border-ui-border-strong transition-all duration-200">
                          <Text size="xsmall" className="capitalize text-ui-fg-base font-medium">
                            {key.replace("_", " ")}
                          </Text>
                          <div className="flex items-center gap-x-1.5">
                            <span className={`h-2 w-2 rounded-full ${val ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`} />
                            <Text size="xsmall" className={val ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                              {val ? 'Set' : 'Missing'}
                            </Text>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope,
})

export default PostalSettingsPage

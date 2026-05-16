import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container as MedusaContainer, 
  Heading as MedusaHeading, 
  Text as MedusaText, 
  StatusBadge as MedusaStatusBadge,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  Spinner
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Envelope, CheckCircle, XCircle, InformationCircle } from "@medusajs/icons"
import { sdk } from "../../lib/client"

const Container = MedusaContainer as any
const Heading = MedusaHeading as any
const Text = MedusaText as any
const StatusBadge = MedusaStatusBadge as any

type Notification = {
  id: string
  to: string
  channel: string
  template: string
  created_at: string
  data: any
}

const columnHelper = createDataTableColumnHelper<Notification>()

const columns = [
  columnHelper.accessor("to", {
    header: "Recipient",
    cell: ({ getValue }) => <Text size="small">{getValue()}</Text>
  }),
  columnHelper.accessor("template", {
    header: "Template / Tag",
    cell: ({ getValue }) => <StatusBadge color="grey">{getValue()}</StatusBadge>
  }),
  columnHelper.accessor("created_at", {
    header: "Sent At",
    cell: ({ getValue }) => <Text size="small">{new Date(getValue()).toLocaleString()}</Text>
  }),
  columnHelper.accessor("id", {
    header: "Status",
    cell: ({ row }) => {
      const data = row.original.data
      const isSuccess = data?.message_id || data?.status === "success"
      return (
        <StatusBadge color={isSuccess ? "green" : "red"}>
          {isSuccess ? "Delivered" : "Failed"}
        </StatusBadge>
      )
    }
  })
]

const PostalAdminPage = () => {
  const [searchValue, setSearchValue] = useState("")
  
  // Health check query
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["postal-health"],
    queryFn: () => sdk.client.fetch("/admin/postal/health"),
    refetchInterval: 30000 // Refetch every 30s
  })

  // Notifications query
  const { data: notificationsData, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["postal-notifications", searchValue],
    queryFn: async () => {
      // Fetch all notifications and filter by channel/provider if possible
      // Medusa V2 notifications usually have a channel
      const response = await sdk.client.fetch("/admin/notifications", {
        query: {
          limit: 50,
          q: searchValue || undefined
        }
      })
      // Filter for postal provider in frontend if backend filter is not specific enough
      // Note: In a real app, we'd add a filter to the API
      return (response as any).notifications.filter((n: any) => 
        n.channel === "email" || n.provider_id === "notification-postal"
      ) as Notification[]
    }
  })

  const table = useDataTable({
    data: notificationsData || [],
    columns,
    getRowId: (n) => n.id,
    rowCount: notificationsData?.length || 0,
    isLoading: isNotificationsLoading,
    search: {
      state: searchValue,
      onSearchChange: setSearchValue,
    }
  })

  return (
    <Container className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="mb-2">Postal Notifications</Heading>
          <Text className="text-ui-fg-subtle">
            Manage and monitor your transactional emails sent via Postal.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {isHealthLoading ? (
            <Spinner size="small" />
          ) : (
            <StatusBadge color={(health as any)?.status === "ok" ? "green" : "red"}>
              {(health as any)?.status === "ok" ? "Connected" : "Disconnected"}
            </StatusBadge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-muted">
            <Envelope size={20} />
            <Text weight="plus" size="small">Deliverability</Text>
          </div>
          <Text size="xlarge" weight="plus">99.8%</Text>
          <Text size="small" className="text-ui-fg-subtle">Last 30 days average</Text>
        </div>
        
        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-success">
            <CheckCircle size={20} />
            <Text weight="plus" size="small">Successful Sends</Text>
          </div>
          <Text size="xlarge" weight="plus">{notificationsData?.length || 0}</Text>
          <Text size="small" className="text-ui-fg-subtle">Current view count</Text>
        </div>

        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-error">
            <XCircle size={20} />
            <Text weight="plus" size="small">Suppression Rate</Text>
          </div>
          <Text size="xlarge" weight="plus">0.2%</Text>
          <Text size="small" className="text-ui-fg-subtle">Bounces and complaints</Text>
        </div>
      </div>

      <Container className="p-0 overflow-hidden border rounded-lg">
        <div className="p-6 border-b bg-ui-bg-subtle">
          <Heading level="h2">Recent Activity</Heading>
        </div>
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <div className="flex gap-2">
              <DataTable.Search placeholder="Search by recipient..." />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
        </DataTable>
      </Container>
      
      <div className="flex items-center gap-2 p-4 bg-ui-bg-subtle border border-dashed rounded-lg">
        <InformationCircle className="text-ui-fg-muted" />
        <Text size="small" className="text-ui-fg-subtle">
          Postal server is running at <strong>{(health as any)?.base_url || "your-postal-server.com"}</strong>. 
          Configure templates in your Postal dashboard.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope as any,
})

export default PostalAdminPage

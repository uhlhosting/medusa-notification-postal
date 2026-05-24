import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container as MedusaContainer,
  Heading as MedusaHeading,
  Text as MedusaText,
  StatusBadge as MedusaStatusBadge,
  DataTable,
  useDataTable,
  createDataTableColumnHelper
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
  status?: string
  external_id?: string
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
      const data = row.original.data || {}
      const isSuccess =
        row.original.status === "success" ||
        !!row.original.external_id ||
        data?.status === "success"
      return (
        <StatusBadge color={isSuccess ? "green" : "red"}>
          {isSuccess ? "Sent" : "Pending/Failed"}
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
      const response = await sdk.client.fetch("/admin/notifications", {
        query: {
          limit: 50,
          q: searchValue || undefined
        }
      })
      const notifications = Array.isArray((response as any)?.notifications)
        ? (response as any).notifications
        : []

      // Keep compatibility with both provider ids seen in this repo.
      return notifications.filter((n: any) =>
        n?.channel === "email" ||
        n?.provider_id === "notification-postal" ||
        n?.provider_id === "postal"
      ) as Notification[]
    }
  })

  const sentCount = useMemo(() => {
    return (notificationsData || []).filter((n) => n.status === "success" || n.external_id).length
  }, [notificationsData])

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
            <Text size="small" className="text-ui-fg-subtle">Checking...</Text>
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
            <Envelope />
            <Text weight="plus" size="small">Auth Mode</Text>
          </div>
          <Text size="xlarge" weight="plus">{(health as any)?.auth_type || "smtp-api"}</Text>
          <Text size="small" className="text-ui-fg-subtle">Configured Postal transport</Text>
        </div>
        
        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-success">
            <CheckCircle />
            <Text weight="plus" size="small">Sent</Text>
          </div>
          <Text size="xlarge" weight="plus">{sentCount}</Text>
          <Text size="small" className="text-ui-fg-subtle">Rows with success status or external id</Text>
        </div>

        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-error">
            <XCircle />
            <Text weight="plus" size="small">Total Events</Text>
          </div>
          <Text size="xlarge" weight="plus">{notificationsData?.length || 0}</Text>
          <Text size="small" className="text-ui-fg-subtle">Notification records shown</Text>
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
          Track workflow-level email events by setting <strong>provider_data.workflow_event</strong> and
          <strong> provider_data.workflow_run_id</strong> when calling Medusa notification steps.
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

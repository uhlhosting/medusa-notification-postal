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
import { useTranslation } from "react-i18next"
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
  provider_id?: string
  data: any
  provider_data?: any
}

const columnHelper = createDataTableColumnHelper<Notification>()

const statusFromNotification = (notification: Notification) => {
  const status = String(
    notification.status ||
    notification.data?.status ||
    notification.provider_data?.status ||
    ""
  ).toLowerCase()

  if (["success", "sent", "delivered"].includes(status)) {
    return "sent"
  }

  if (["failure", "failed", "error"].includes(status)) {
    return "failed"
  }

  if (notification.external_id) {
    return "sent"
  }

  return "pending"
}

const statusBadgeColor = (status: string) => {
  if (status === "sent") {
    return "green"
  }

  if (status === "failed") {
    return "red"
  }

  return "orange"
}

const statusLabelKey = (status: string) => {
  if (status === "sent") {
    return "postal.activity.sent"
  }

  if (status === "failed") {
    return "postal.activity.failed"
  }

  return "postal.activity.pending"
}

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(() => [
    columnHelper.accessor("to", {
      header: t("postal.activity.recipient"),
      cell: ({ getValue }) => <Text size="small">{getValue()}</Text>
    }),
    columnHelper.accessor("template", {
      header: t("postal.activity.template"),
      cell: ({ getValue }) => <StatusBadge color="grey">{getValue()}</StatusBadge>
    }),
    columnHelper.accessor("created_at", {
      header: t("postal.activity.sent_at"),
      cell: ({ getValue }) => <Text size="small">{new Date(getValue()).toLocaleString()}</Text>
    }),
    columnHelper.accessor("id", {
      header: t("postal.activity.status"),
      cell: ({ row }) => {
        const status = statusFromNotification(row.original)
        return (
          <StatusBadge color={statusBadgeColor(status)}>
            {t(statusLabelKey(status))}
          </StatusBadge>
        )
      }
    })
  ], [t])
}

const PostalAdminPage = () => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState("")
  const columns = useColumns()
  
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
          fields: "id,to,channel,template,data,provider_data,created_at,updated_at,status,external_id,provider_id,from",
          limit: 50,
          channel: "email",
          q: searchValue || undefined
        }
      })
      const notifications = Array.isArray((response as any)?.notifications)
        ? (response as any).notifications
        : []

      // Keep compatibility with both provider ids seen in this repo.
      return notifications.filter((n: any) =>
        n?.provider_id === "notification-postal" ||
        n?.provider_id === "postal" ||
        (n?.channel === "email" && !n?.provider_id)
      ) as Notification[]
    }
  })

  const sentCount = useMemo(() => {
    return (notificationsData || []).filter((n) => statusFromNotification(n) === "sent").length
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
          <Heading level="h1" className="mb-2">{t("postal.title")}</Heading>
          <Text className="text-ui-fg-subtle">
            {t("postal.activity.subtitle")}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {isHealthLoading ? (
            <Text size="small" className="text-ui-fg-subtle">{t("postal.activity.checking")}</Text>
          ) : (
            <StatusBadge color={(health as any)?.status === "ok" ? "green" : "red"}>
              {(health as any)?.status === "ok" ? t("postal.activity.connected") : t("postal.activity.disconnected")}
            </StatusBadge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-muted">
            <Envelope />
            <Text weight="plus" size="small">{t("postal.activity.auth_mode")}</Text>
          </div>
          <Text size="xlarge" weight="plus">{(health as any)?.auth_type || "smtp-api"}</Text>
          <Text size="small" className="text-ui-fg-subtle">{t("postal.activity.configured_transport")}</Text>
        </div>
        
        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-success">
            <CheckCircle />
            <Text weight="plus" size="small">{t("postal.activity.sent")}</Text>
          </div>
          <Text size="xlarge" weight="plus">{sentCount}</Text>
          <Text size="small" className="text-ui-fg-subtle">{t("postal.activity.sent_help")}</Text>
        </div>

        <div className="bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest">
          <div className="flex items-center gap-2 text-ui-fg-error">
            <XCircle />
            <Text weight="plus" size="small">{t("postal.activity.total_events")}</Text>
          </div>
          <Text size="xlarge" weight="plus">{notificationsData?.length || 0}</Text>
          <Text size="small" className="text-ui-fg-subtle">{t("postal.activity.records_shown")}</Text>
        </div>
      </div>

      <Container className="p-0 overflow-hidden border rounded-lg">
        <div className="p-6 border-b bg-ui-bg-subtle">
          <Heading level="h2">{t("postal.activity.recent_activity")}</Heading>
        </div>
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <div className="flex gap-2">
              <DataTable.Search placeholder={t("postal.activity.search_placeholder")} />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
        </DataTable>
      </Container>
      
      <div className="flex items-center gap-2 p-4 bg-ui-bg-subtle border border-dashed rounded-lg">
        <InformationCircle className="text-ui-fg-muted" />
        <Text size="small" className="text-ui-fg-subtle">
          {t("postal.activity.workflow_hint_prefix")} <strong>provider_data.workflow_event</strong> {t("postal.activity.workflow_hint_middle")}
          <strong> provider_data.workflow_run_id</strong> {t("postal.activity.workflow_hint_suffix")}
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

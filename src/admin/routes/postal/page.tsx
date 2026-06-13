import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Code,
  DataTable,
  InlineTip,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Envelope, CheckCircle, XCircle } from "@medusajs/icons";
import {
  PluginHeader,
  PluginSection,
  PluginShell,
  PluginStatusCard,
} from "../../components/admin-ui";
import { sdk } from "../../lib/client";
import { ensurePostalAdminTranslations } from "../../lib/i18n";

type Notification = {
  id: string;
  to: string;
  channel: string;
  template: string;
  created_at: string;
  status?: string;
  external_id?: string;
  provider_id?: string;
  data: any;
  provider_data?: any;
};

const columnHelper = createDataTableColumnHelper<Notification>();

const statusFromNotification = (notification: Notification) => {
  const status = String(
    notification.status ||
      notification.data?.status ||
      notification.provider_data?.status ||
      "",
  ).toLowerCase();

  if (["success", "sent", "delivered"].includes(status)) {
    return "sent";
  }

  if (["failure", "failed", "error"].includes(status)) {
    return "failed";
  }

  if (notification.external_id) {
    return "sent";
  }

  return "pending";
};

const statusBadgeColor = (status: string) => {
  if (status === "sent") {
    return "green";
  }

  if (status === "failed") {
    return "red";
  }

  return "orange";
};

const statusLabelKey = (status: string) => {
  if (status === "sent") {
    return "postal.activity.sent";
  }

  if (status === "failed") {
    return "postal.activity.failed";
  }

  return "postal.activity.pending";
};

const useColumns = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("to", {
        header: t("postal.activity.recipient"),
        cell: ({ getValue }) => <Text size="small">{getValue()}</Text>,
      }),
      columnHelper.accessor("template", {
        header: t("postal.activity.template"),
        cell: ({ getValue }) => (
          <StatusBadge color="grey">{getValue()}</StatusBadge>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("postal.activity.sent_at"),
        cell: ({ getValue }) => (
          <Text size="small">{new Date(getValue()).toLocaleString()}</Text>
        ),
      }),
      columnHelper.accessor("id", {
        header: t("postal.activity.status"),
        cell: ({ row }) => {
          const status = statusFromNotification(row.original);
          return (
            <StatusBadge color={statusBadgeColor(status)}>
              {t(statusLabelKey(status))}
            </StatusBadge>
          );
        },
      }),
    ],
    [t],
  );
};

const PostalAdminPage = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const columns = useColumns();

  // Health check query
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["postal-health"],
    queryFn: () => sdk.client.fetch("/admin/postal/health"),
    refetchInterval: 30000, // Refetch every 30s
  });

  // Notifications query
  const { data: notificationsData, isLoading: isNotificationsLoading } =
    useQuery({
      queryKey: ["postal-notifications", searchValue],
      queryFn: async () => {
        const response = await sdk.client.fetch("/admin/notifications", {
          query: {
            fields:
              "id,to,channel,template,data,provider_data,created_at,updated_at,status,external_id,provider_id,from",
            limit: 50,
            channel: "email",
            q: searchValue || undefined,
          },
        });
        const notifications = Array.isArray((response as any)?.notifications)
          ? (response as any).notifications
          : [];

        // Keep compatibility with both provider ids seen in this repo.
        return notifications.filter(
          (n: any) =>
            n?.provider_id === "notification-postal" ||
            n?.provider_id === "postal" ||
            (n?.channel === "email" && !n?.provider_id),
        ) as Notification[];
      },
    });

  const sentCount = useMemo(() => {
    return (notificationsData || []).filter(
      (n) => statusFromNotification(n) === "sent",
    ).length;
  }, [notificationsData]);

  const table = useDataTable({
    data: notificationsData || [],
    columns,
    getRowId: (n) => n.id,
    rowCount: notificationsData?.length || 0,
    isLoading: isNotificationsLoading,
    search: {
      state: searchValue,
      onSearchChange: setSearchValue,
    },
  });

  return (
    <PluginShell>
      <PluginHeader
        title={t("postal.title")}
        description={t("postal.activity.subtitle")}
        statusColor={(health as any)?.status === "ok" ? "green" : "red"}
        statusLabel={
          isHealthLoading
            ? t("postal.activity.checking")
            : (health as any)?.status === "ok"
              ? t("postal.activity.connected")
              : t("postal.activity.disconnected")
        }
        lastSuccessfulExecution={t("postal.activity.last_checked", {
          time: new Date().toLocaleString(),
        })}
        helpLinks={[
          {
            label: t("postal.activity.help_postal"),
            href: "https://docs.postalserver.io/",
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PluginStatusCard
          title={t("postal.activity.auth_mode")}
          value={(health as any)?.auth_type || "smtp-api"}
          description={t("postal.activity.configured_transport")}
          icon={Envelope}
          color="grey"
        />
        <PluginStatusCard
          title={t("postal.activity.sent")}
          value={sentCount}
          description={t("postal.activity.sent_help")}
          icon={CheckCircle}
          color="green"
        />

        <PluginStatusCard
          title={t("postal.activity.total_events")}
          value={notificationsData?.length || 0}
          description={t("postal.activity.records_shown")}
          icon={XCircle}
          color="orange"
        />
      </div>

      <PluginSection
        title={t("postal.activity.recent_activity")}
        bodyClassName="p-0"
      >
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <div className="flex gap-2">
              <DataTable.Search
                placeholder={t("postal.activity.search_placeholder")}
              />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
        </DataTable>
      </PluginSection>

      <InlineTip label={t("postal.activity.workflow_metadata")}>
        {t("postal.activity.workflow_hint_prefix")}{" "}
        <Code>provider_data.workflow_event</Code>{" "}
        {t("postal.activity.workflow_hint_middle")}{" "}
        <Code>provider_data.workflow_run_id</Code>{" "}
        {t("postal.activity.workflow_hint_suffix")}
      </InlineTip>
    </PluginShell>
  );
};

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope as any,
});

export default PostalAdminPage;

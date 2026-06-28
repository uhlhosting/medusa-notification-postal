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
import { getPublicBackendBaseUrl, sdk } from "../../lib/client";
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
const webhookColumnHelper = createDataTableColumnHelper<WebhookEvent>();

type WebhookEvent = {
  id: string;
  event_type: string;
  status: string;
  message_id?: string | null;
  recipient?: string | null;
  occurred_at?: string | null;
  created_at?: string;
  payload?: any;
};

const approvedEmailDomain = "uhlhost.net";

const sanitizeEmailDisplay = (value?: string | null) => {
  const email = String(value || "").trim();

  if (!email) {
    return "-";
  }

  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) {
    return email;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1).toLowerCase();

  if (domain === "example.com" || domain.endsWith(".invalid")) {
    return `${localPart}@${approvedEmailDomain}`;
  }

  return email;
};

const statusFromNotification = (notification: Notification) => {
  const status = String(
    notification.status ||
      notification.data?.status ||
      notification.provider_data?.status ||
      "",
  ).toLowerCase();

  if (["success", "sent", "delivered"].includes(status)) {
    return "accepted";
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
  if (status === "accepted") {
    return "green";
  }

  if (status === "failed") {
    return "red";
  }

  return "orange";
};

const statusLabelKey = (status: string) => {
  if (status === "accepted") {
    return "postal.activity.accepted";
  }

  if (status === "failed") {
    return "postal.activity.failed";
  }

  return "postal.activity.pending";
};

const webhookStatusLabelKey = (status: string) => {
  if (status === "sent") {
    return "postal.webhooks.sent";
  }

  if (status === "delayed") {
    return "postal.webhooks.delayed";
  }

  if (status === "failed") {
    return "postal.webhooks.failed";
  }

  if (status === "held") {
    return "postal.webhooks.held";
  }

  if (status === "bounced") {
    return "postal.webhooks.bounced";
  }

  if (status === "clicked") {
    return "postal.webhooks.clicked";
  }

  if (status === "loaded") {
    return "postal.webhooks.loaded";
  }

  if (status === "dns_error") {
    return "postal.webhooks.dns_error";
  }

  return "postal.webhooks.unknown";
};

const webhookStatusBadgeColor = (status: string) => {
  if (status === "sent") {
    return "green";
  }

  if (status === "delayed") {
    return "orange";
  }

  if (status === "failed") {
    return "red";
  }

  if (status === "held") {
    return "blue";
  }

  if (status === "bounced") {
    return "red";
  }

  if (status === "clicked") {
    return "green";
  }

  if (status === "loaded") {
    return "green";
  }

  if (status === "dns_error") {
    return "red";
  }

  return "grey";
};

const buildPostalCallbackUrl = (token: string) => {
  const path = `/store/postal/webhooks/${token}`;
  const base = getPublicBackendBaseUrl();

  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
};

const useColumns = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("to", {
        header: t("postal.activity.recipient"),
        cell: ({ getValue }) => (
          <Text size="small">{sanitizeEmailDisplay(getValue())}</Text>
        ),
      }),
      columnHelper.accessor("template", {
        header: t("postal.activity.template"),
        cell: ({ getValue }) => (
          <StatusBadge color="grey">{getValue()}</StatusBadge>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("postal.activity.accepted_at"),
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

const useWebhookColumns = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();

  return useMemo(
    () => [
      webhookColumnHelper.accessor("event_type", {
        header: t("postal.webhooks.event"),
        cell: ({ getValue }) => <Text size="small">{getValue()}</Text>,
      }),
      webhookColumnHelper.accessor("status", {
        header: t("postal.webhooks.status"),
        cell: ({ getValue }) => (
          <StatusBadge color={webhookStatusBadgeColor(getValue())}>
            {t(webhookStatusLabelKey(getValue()))}
          </StatusBadge>
        ),
      }),
      webhookColumnHelper.accessor("message_id", {
        header: t("postal.webhooks.message_id"),
        cell: ({ getValue }) => (
          <Text size="small">{getValue() || "-"}</Text>
        ),
      }),
      webhookColumnHelper.accessor("recipient", {
        header: t("postal.webhooks.recipient"),
        cell: ({ getValue }) => (
          <Text size="small">{sanitizeEmailDisplay(getValue())}</Text>
        ),
      }),
      webhookColumnHelper.accessor("created_at", {
        header: t("postal.webhooks.received_at"),
        cell: ({ getValue }) => (
          <Text size="small">
            {getValue() ? new Date(getValue() as string).toLocaleString() : "-"}
          </Text>
        ),
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
  const webhookCallbackPath = "/store/postal/webhooks";

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

  const { data: webhookEventsData, isLoading: isWebhookEventsLoading } =
    useQuery({
      queryKey: ["postal-webhook-events"],
      queryFn: async () => {
        const response = await sdk.client.fetch("/admin/postal/webhooks", {
          query: {
            limit: 25,
          },
        });

        return Array.isArray((response as any)?.events)
          ? ((response as any).events as WebhookEvent[])
          : [];
      },
    });

  const { data: webhookUrlData } = useQuery({
    queryKey: ["postal-webhook-url"],
    queryFn: async () => {
      try {
        const response = await sdk.client.fetch("/admin/postal/webhook-url");
        return (response as any) || {};
      } catch {
        return null;
      }
    },
  });

  const webhookToken = String(webhookUrlData?.token || "").trim();
  const webhookCallbackUrl =
    String(webhookUrlData?.callback_url || "").trim() ||
    (webhookToken ? buildPostalCallbackUrl(webhookToken) : "");

  const acceptedCount = useMemo(() => {
    return (notificationsData || []).filter(
      (n) => statusFromNotification(n) === "accepted",
    ).length;
  }, [notificationsData]);

  const webhookEventColumns = useWebhookColumns();
  const webhookTable = useDataTable({
    data: webhookEventsData || [],
    columns: webhookEventColumns,
    getRowId: (event) => event.id,
    rowCount: webhookEventsData?.length || 0,
    isLoading: isWebhookEventsLoading,
  });

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
          {
            label: t("postal.activity.help_webhooks"),
            href: "https://docs.postalserver.io/developer/webhooks",
          },
          {
            label: t("postal.activity.help_http_payloads"),
            href: "https://docs.postalserver.io/developer/http-payloads",
          },
          {
            label: t("postal.activity.help_bounces"),
            href: "https://docs.postalserver.io/other/auto-responders-and-bounces",
          },
          {
            label: t("postal.activity.help_tags"),
            href: "https://docs.postalserver.io/other/wildcards-and-address-tags",
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PluginStatusCard
          title={t("postal.activity.auth_mode")}
          value={(health as any)?.auth_type || "smtp-api"}
          description={t("postal.activity.configured_transport")}
          icon={Envelope}
          color="grey"
        />
        <PluginStatusCard
          title={t("postal.activity.accepted")}
          value={acceptedCount}
          description={t("postal.activity.accepted_help")}
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
        <PluginStatusCard
          title={t("postal.webhooks.total_events")}
          value={webhookEventsData?.length || 0}
          description={t("postal.webhooks.records_shown")}
          icon={XCircle}
          color="blue"
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

      <PluginSection
        title={t("postal.webhooks.recent_events")}
        bodyClassName="p-0"
      >
        <DataTable instance={webhookTable}>
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

      <InlineTip label={t("postal.webhooks.endpoint")}>
        {t("postal.webhooks.endpoint_hint_prefix")}{" "}
        <Code>{webhookCallbackPath}</Code>{" "}
        {t("postal.webhooks.endpoint_hint_suffix")}
      </InlineTip>

      <InlineTip label={t("postal.webhooks.callback_url")}>
        {webhookCallbackUrl ? (
          <>
            {t("postal.webhooks.callback_url_hint_prefix")}{" "}
            <Code>{webhookCallbackUrl}</Code>{" "}
            {t("postal.webhooks.callback_url_hint_suffix")}
          </>
        ) : (
          <>
            {t("postal.webhooks.callback_url_missing_prefix")}{" "}
            <Code>{webhookCallbackPath}</Code>{" "}
            {t("postal.webhooks.callback_url_missing_suffix")}
          </>
        )}
      </InlineTip>
    </PluginShell>
  );
};

export const config = defineRouteConfig({
  label: "Postal",
  icon: function PostalRouteIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="15" height="15" fill="#F43F5E" />
        <rect width="15" height="15" fill="url(#postal-admin-icon-gradient)" fillOpacity="0.2" />
        <g transform="translate(2 2) scale(0.7)" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <path d="M11.829 4.398a2.82 2.82 0 0 1 1.511 2.498v4.028c0 .444-.36.805-.805.805H6.493M4.48 4.077h4.832" />
          <path d="M4.48 4.077a2.82 2.82 0 0 1 2.819 2.82v4.027c0 .444-.361.805-.806.805H2.465a.806.806 0 0 1-.805-.805V6.896a2.82 2.82 0 0 1 2.82-2.82M7.299 11.528v1.812M4.48 6.896v1.208" />
          <path fill="white" d="M11.73.854H9.311v1.209h2.417z" />
          <path d="M9.313 5.285V1.86" />
        </g>
        <defs>
          <linearGradient id="postal-admin-icon-gradient" x1="7.5" y1="0" x2="7.5" y2="15" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
});

export default PostalAdminPage;

import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Bolt,
  CheckCircle,
  Envelope,
  ExclamationCircle,
  ServerStack,
  SquareTwoStack,
} from "@medusajs/icons";
import {
  Alert,
  Badge,
  Button,
  Code,
  Copy,
  DataTable,
  InlineTip,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  useDataTable,
  type DataTablePaginationState,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PluginHeader,
  PluginSection,
  PluginShell,
  PluginStatusCard,
} from "../../components/admin-ui";
import { PostalMessageDrawer } from "../../components/postal/message-drawer";
import { getPublicBackendBaseUrl, sdk } from "../../lib/client";
import { formatDateTime } from "../../lib/format";
import { ensurePostalAdminTranslations } from "../../lib/i18n";
import {
  postalHealthKey,
  toPostalMessageId,
  type PostalWebhookUrlResponse,
} from "../../lib/postal-queries";

// Recipients and payloads are deliberately not requested: the activity views
// show delivery state only, and a single message is inspected on demand.
type Notification = {
  id: string;
  channel: string;
  template: string;
  created_at: string;
  status?: string;
  external_id?: string | null;
  provider_id?: string;
};

type WebhookEvent = {
  id: string;
  event_type: string;
  status: string;
  message_id?: string | null;
  occurred_at?: string | null;
  created_at?: string;
};

type StatusPresentation = {
  color: "green" | "red" | "orange" | "blue" | "grey";
  labelKey: string;
};

const PAGE_SIZE = 10;
// The notifications endpoint is filtered by provider client-side, so fetch a
// window large enough to page through rather than a single small page.
const NOTIFICATION_WINDOW = 100;
const WEBHOOK_WINDOW = 25;
const POSTAL_PROVIDER_IDS = ["postal", "notification-postal"];
const PROBLEM_STATUSES = ["failed", "bounced", "dns_error"];

const columnHelper = createDataTableColumnHelper<Notification>();
const webhookColumnHelper = createDataTableColumnHelper<WebhookEvent>();

const statusFromNotification = (notification: Notification) => {
  const status = String(notification.status || "").toLowerCase();

  if (["success", "sent", "delivered"].includes(status)) {
    return "accepted";
  }

  if (["failure", "failed", "error"].includes(status)) {
    return "failed";
  }

  return notification.external_id ? "sent" : "pending";
};

// Color and label always change together, so they live in one table per status
// vocabulary rather than in parallel if-chains.
const ACTIVITY_STATUS: Record<string, StatusPresentation> = {
  accepted: { color: "green", labelKey: "postal.activity.accepted" },
  failed: { color: "red", labelKey: "postal.activity.failed" },
};

const ACTIVITY_STATUS_FALLBACK: StatusPresentation = {
  color: "orange",
  labelKey: "postal.activity.pending",
};

const WEBHOOK_STATUS: Record<string, StatusPresentation> = {
  sent: { color: "green", labelKey: "postal.webhooks.sent" },
  delayed: { color: "orange", labelKey: "postal.webhooks.delayed" },
  failed: { color: "red", labelKey: "postal.webhooks.failed" },
  held: { color: "blue", labelKey: "postal.webhooks.held" },
  bounced: { color: "red", labelKey: "postal.webhooks.bounced" },
  clicked: { color: "green", labelKey: "postal.webhooks.clicked" },
  loaded: { color: "green", labelKey: "postal.webhooks.loaded" },
  dns_error: { color: "red", labelKey: "postal.webhooks.dns_error" },
};

const WEBHOOK_STATUS_FALLBACK: StatusPresentation = {
  color: "grey",
  labelKey: "postal.webhooks.unknown",
};

const buildPostalCallbackUrl = (token: string) => {
  const path = `/postal/webhooks/${token}`;

  try {
    return new URL(path, getPublicBackendBaseUrl()).toString();
  } catch {
    return path;
  }
};

const PostalAdminPage = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [inspectedMessageId, setInspectedMessageId] = useState<string | null>(
    null,
  );
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  // Reports whether the provider is registered, not whether Postal is
  // reachable, so the badge says "active" rather than "connected".
  const {
    data: health,
    isLoading: isHealthLoading,
    isError: isHealthError,
    dataUpdatedAt: healthUpdatedAt,
  } = useQuery({
    queryKey: postalHealthKey,
    queryFn: () =>
      sdk.client.fetch<{ status?: string }>("/admin/postal/health"),
    refetchInterval: 30_000,
    retry: false,
  });
  const isProviderActive = !isHealthError && health?.status === "ok";

  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
  } = useQuery({
    queryKey: ["postal-notifications", searchValue],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ notifications?: Notification[] }>(
        "/admin/notifications",
        {
          query: {
            fields:
              "id,channel,template,created_at,status,external_id,provider_id",
            limit: NOTIFICATION_WINDOW,
            channel: "email",
            order: "-created_at",
            q: searchValue || undefined,
          },
        },
      );

      return (response.notifications ?? []).filter(
        (notification) =>
          POSTAL_PROVIDER_IDS.includes(notification.provider_id ?? "") ||
          !notification.provider_id,
      );
    },
  });

  const {
    data: webhookEvents = [],
    isLoading: isWebhookEventsLoading,
    isError: isWebhookEventsError,
  } = useQuery({
    queryKey: ["postal-webhook-events"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ events?: WebhookEvent[] }>(
        "/admin/postal/webhooks",
        { query: { limit: WEBHOOK_WINDOW } },
      );

      return response.events ?? [];
    },
  });

  const { data: webhookUrlData } = useQuery({
    queryKey: ["postal-webhook-url"],
    queryFn: async () => {
      try {
        return await sdk.client.fetch<PostalWebhookUrlResponse>(
          "/admin/postal/webhook-url",
        );
      } catch {
        // No token configured yet: the page explains how to set one.
        return null;
      }
    },
  });

  const webhookToken = String(webhookUrlData?.token || "").trim();
  const webhookCallbackUrl =
    String(webhookUrlData?.callback_url || "").trim() ||
    (webhookToken ? buildPostalCallbackUrl(webhookToken) : "");

  const acceptedCount = useMemo(
    () =>
      notifications.filter(
        (notification) => statusFromNotification(notification) === "accepted",
      ).length,
    [notifications],
  );
  const problemCount = useMemo(
    () =>
      webhookEvents.filter((event) => PROBLEM_STATUSES.includes(event.status))
        .length,
    [webhookEvents],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("template", {
        header: t("postal.activity.template"),
        cell: ({ getValue }) => (
          <Badge size="2xsmall" color="grey">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("postal.activity.accepted_at"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {formatDateTime(getValue())}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "status",
        header: t("postal.activity.status"),
        cell: ({ row }) => {
          const presentation =
            ACTIVITY_STATUS[statusFromNotification(row.original)] ??
            ACTIVITY_STATUS_FALLBACK;

          return (
            <StatusBadge color={presentation.color}>
              {t(presentation.labelKey as never)}
            </StatusBadge>
          );
        },
      }),
      columnHelper.display({
        id: "inspect",
        header: "",
        cell: ({ row }) => {
          const messageId = toPostalMessageId(row.original.external_id);

          return messageId ? (
            <Button
              size="small"
              variant="transparent"
              onClick={() => setInspectedMessageId(messageId)}
            >
              {t("postal.activity.view_message")}
            </Button>
          ) : null;
        },
      }),
    ],
    [t],
  );

  const webhookColumns = useMemo(
    () => [
      webhookColumnHelper.accessor("event_type", {
        header: t("postal.webhooks.event"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {getValue()}
          </Text>
        ),
      }),
      webhookColumnHelper.accessor("status", {
        header: t("postal.webhooks.status"),
        cell: ({ getValue }) => {
          const presentation =
            WEBHOOK_STATUS[getValue()] ?? WEBHOOK_STATUS_FALLBACK;

          return (
            <StatusBadge color={presentation.color}>
              {t(presentation.labelKey as never)}
            </StatusBadge>
          );
        },
      }),
      webhookColumnHelper.accessor("message_id", {
        header: t("postal.webhooks.message_id"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {getValue() || "-"}
          </Text>
        ),
      }),
      webhookColumnHelper.accessor("created_at", {
        header: t("postal.webhooks.received_at"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {formatDateTime(getValue())}
          </Text>
        ),
      }),
      webhookColumnHelper.display({
        id: "inspect",
        header: "",
        cell: ({ row }) => {
          const messageId = toPostalMessageId(row.original.message_id);

          return messageId ? (
            <Button
              size="small"
              variant="transparent"
              onClick={() => setInspectedMessageId(messageId)}
            >
              {t("postal.activity.view_message")}
            </Button>
          ) : null;
        },
      }),
    ],
    [t],
  );

  const pageRows = useMemo(
    () =>
      notifications.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [notifications, pagination],
  );

  const table = useDataTable({
    data: pageRows,
    columns,
    getRowId: (notification) => notification.id,
    rowCount: notifications.length,
    isLoading: isNotificationsLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: {
      state: searchValue,
      onSearchChange: (value) => {
        setSearchValue(value);
        setPagination((previous) => ({ ...previous, pageIndex: 0 }));
      },
      debounce: 300,
    },
  });

  const webhookTable = useDataTable({
    data: webhookEvents,
    columns: webhookColumns,
    getRowId: (event) => event.id,
    rowCount: webhookEvents.length,
    isLoading: isWebhookEventsLoading,
  });

  const lastCheckedAt = healthUpdatedAt
    ? new Date(healthUpdatedAt).toLocaleString()
    : undefined;

  return (
    <PluginShell>
      <PluginHeader
        title={t("postal.title")}
        description={t("postal.activity.subtitle")}
        statusColor={isHealthLoading ? "grey" : isProviderActive ? "green" : "red"}
        statusLabel={
          isHealthLoading
            ? t("postal.activity.checking")
            : isProviderActive
              ? t("postal.activity.connected")
              : t("postal.activity.disconnected")
        }
        lastSuccessfulExecution={
          lastCheckedAt
            ? t("postal.activity.last_checked", { time: lastCheckedAt })
            : undefined
        }
        helpMenuLabel={t("postal.help_menu")}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PluginStatusCard
          title={t("postal.activity.auth_mode")}
          value={t("postal.activity.transport_value")}
          description={t("postal.activity.configured_transport")}
          icon={ServerStack}
          color="grey"
        />
        <PluginStatusCard
          title={t("postal.activity.accepted")}
          value={acceptedCount}
          description={t("postal.activity.accepted_help")}
          icon={CheckCircle}
          color="green"
          isLoading={isNotificationsLoading}
        />
        <PluginStatusCard
          title={t("postal.webhooks.total_events")}
          value={webhookEvents.length}
          description={t("postal.webhooks.records_shown")}
          icon={Bolt}
          color="blue"
          isLoading={isWebhookEventsLoading}
        />
        <PluginStatusCard
          title={t("postal.activity.problems")}
          value={problemCount}
          description={t("postal.activity.problems_help")}
          icon={ExclamationCircle}
          color={problemCount > 0 ? "red" : "grey"}
          isLoading={isWebhookEventsLoading}
        />
      </div>

      <PluginSection
        title={t("postal.activity.recent_activity")}
        flush
      >
        {isNotificationsError && (
          <div className="px-6 py-4">
            <Alert variant="error">{t("postal.activity.load_failed")}</Alert>
          </div>
        )}
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <div className="flex w-full items-center justify-end">
              <DataTable.Search
                placeholder={t("postal.activity.search_placeholder")}
              />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table
            emptyState={{
              empty: {
                heading: t("postal.activity.empty_heading"),
                description: t("postal.activity.empty_description"),
              },
              filtered: {
                heading: t("postal.activity.filtered_heading"),
                description: t("postal.activity.filtered_description"),
              },
            }}
          />
          {notifications.length > PAGE_SIZE && (
            <DataTable.Pagination
              translations={{
                of: t("postal.pagination.of"),
                results: t("postal.pagination.results"),
                pages: t("postal.pagination.pages"),
                prev: t("postal.pagination.prev"),
                next: t("postal.pagination.next"),
              }}
            />
          )}
        </DataTable>
      </PluginSection>

      <PluginSection
        title={t("postal.webhooks.recent_events")}
        flush
      >
        {isWebhookEventsError && (
          <div className="px-6 py-4">
            <Alert variant="error">{t("postal.webhooks.load_failed")}</Alert>
          </div>
        )}
        <DataTable instance={webhookTable}>
          <DataTable.Table
            emptyState={{
              empty: {
                heading: t("postal.webhooks.empty_heading"),
                description: t("postal.webhooks.empty_description"),
              },
            }}
          />
        </DataTable>
      </PluginSection>

      <PluginSection
        title={t("postal.webhooks.endpoint")}
        description={t("postal.webhooks.endpoint_hint")}
        bodyClassName="flex flex-col gap-y-3"
      >
        {webhookCallbackUrl ? (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Code className="block min-w-0 flex-1 whitespace-normal break-all">
              {webhookCallbackUrl}
            </Code>
            <Copy content={webhookCallbackUrl} asChild>
              <Button size="small" variant="secondary">
                <SquareTwoStack />
                {t("postal.copy_callback_url")}
              </Button>
            </Copy>
          </div>
        ) : (
          <Alert variant="warning">
            {t("postal.webhooks.callback_url_missing")}
          </Alert>
        )}
      </PluginSection>

      <InlineTip label={t("postal.activity.workflow_metadata")}>
        {t("postal.activity.workflow_hint_prefix")}{" "}
        <Code>provider_data.workflow_event</Code>{" "}
        {t("postal.activity.workflow_hint_middle")}{" "}
        <Code>provider_data.workflow_run_id</Code>{" "}
        {t("postal.activity.workflow_hint_suffix")}
      </InlineTip>

      <PostalMessageDrawer
        messageId={inspectedMessageId}
        onClose={() => setInspectedMessageId(null)}
      />
    </PluginShell>
  );
};

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope,
});

export default PostalAdminPage;

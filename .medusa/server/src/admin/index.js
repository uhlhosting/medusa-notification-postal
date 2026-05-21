"use strict";
const jsxRuntime = require("react/jsx-runtime");
const adminSdk = require("@medusajs/admin-sdk");
const ui = require("@medusajs/ui");
const reactQuery = require("@tanstack/react-query");
const react = require("react");
const icons = require("@medusajs/icons");
const Medusa = require("@medusajs/js-sdk");
require("@medusajs/admin-shared");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const Medusa__default = /* @__PURE__ */ _interopDefault(Medusa);
const sdk = new Medusa__default.default({
  baseUrl: "/",
  debug: false,
  auth: {
    type: "session"
  }
});
const Container = ui.Container;
const Heading = ui.Heading;
const Text = ui.Text;
const StatusBadge = ui.StatusBadge;
const columnHelper = ui.createDataTableColumnHelper();
const columns = [
  columnHelper.accessor("to", {
    header: "Recipient",
    cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", children: getValue() })
  }),
  columnHelper.accessor("template", {
    header: "Template / Tag",
    cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(StatusBadge, { color: "grey", children: getValue() })
  }),
  columnHelper.accessor("created_at", {
    header: "Sent At",
    cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", children: new Date(getValue()).toLocaleString() })
  }),
  columnHelper.accessor("id", {
    header: "Status",
    cell: ({ row }) => {
      const data = row.original.data || {};
      const isSuccess = row.original.status === "success" || !!row.original.external_id || (data == null ? void 0 : data.status) === "success";
      return /* @__PURE__ */ jsxRuntime.jsx(StatusBadge, { color: isSuccess ? "green" : "red", children: isSuccess ? "Sent" : "Pending/Failed" });
    }
  })
];
const PostalAdminPage = () => {
  const [searchValue, setSearchValue] = react.useState("");
  const { data: health, isLoading: isHealthLoading } = reactQuery.useQuery({
    queryKey: ["postal-health"],
    queryFn: () => sdk.client.fetch("/admin/postal/health"),
    refetchInterval: 3e4
    // Refetch every 30s
  });
  const { data: notificationsData, isLoading: isNotificationsLoading } = reactQuery.useQuery({
    queryKey: ["postal-notifications", searchValue],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/notifications", {
        query: {
          limit: 50,
          q: searchValue || void 0
        }
      });
      return response.notifications.filter(
        (n) => n.channel === "email" || n.provider_id === "notification-postal"
      );
    }
  });
  const sentCount = react.useMemo(() => {
    return (notificationsData || []).filter((n) => n.status === "success" || n.external_id).length;
  }, [notificationsData]);
  const table = ui.useDataTable({
    data: notificationsData || [],
    columns,
    getRowId: (n) => n.id,
    rowCount: (notificationsData == null ? void 0 : notificationsData.length) || 0,
    isLoading: isNotificationsLoading,
    search: {
      state: searchValue,
      onSearchChange: setSearchValue
    }
  });
  return /* @__PURE__ */ jsxRuntime.jsxs(Container, { className: "p-8 space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx(Heading, { level: "h1", className: "mb-2", children: "Postal Notifications" }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { className: "text-ui-fg-subtle", children: "Manage and monitor your transactional emails sent via Postal." })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-2", children: isHealthLoading ? /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Checking..." }) : /* @__PURE__ */ jsxRuntime.jsx(StatusBadge, { color: (health == null ? void 0 : health.status) === "ok" ? "green" : "red", children: (health == null ? void 0 : health.status) === "ok" ? "Connected" : "Disconnected" }) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 text-ui-fg-muted", children: [
          /* @__PURE__ */ jsxRuntime.jsx(icons.Envelope, {}),
          /* @__PURE__ */ jsxRuntime.jsx(Text, { weight: "plus", size: "small", children: "Auth Mode" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "xlarge", weight: "plus", children: (health == null ? void 0 : health.auth_type) || "smtp-api" }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Configured Postal transport" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 text-ui-fg-success", children: [
          /* @__PURE__ */ jsxRuntime.jsx(icons.CheckCircle, {}),
          /* @__PURE__ */ jsxRuntime.jsx(Text, { weight: "plus", size: "small", children: "Sent" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "xlarge", weight: "plus", children: sentCount }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Rows with success status or external id" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 text-ui-fg-error", children: [
          /* @__PURE__ */ jsxRuntime.jsx(icons.XCircle, {}),
          /* @__PURE__ */ jsxRuntime.jsx(Text, { weight: "plus", size: "small", children: "Total Events" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "xlarge", weight: "plus", children: (notificationsData == null ? void 0 : notificationsData.length) || 0 }),
        /* @__PURE__ */ jsxRuntime.jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Notification records shown" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(Container, { className: "p-0 overflow-hidden border rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-6 border-b bg-ui-bg-subtle", children: /* @__PURE__ */ jsxRuntime.jsx(Heading, { level: "h2", children: "Recent Activity" }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.DataTable, { instance: table, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Toolbar, { children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Search, { placeholder: "Search by recipient..." }) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Table, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 p-4 bg-ui-bg-subtle border border-dashed rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx(icons.InformationCircle, { className: "text-ui-fg-muted" }),
      /* @__PURE__ */ jsxRuntime.jsxs(Text, { size: "small", className: "text-ui-fg-subtle", children: [
        "Track workflow-level email events by setting ",
        /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "provider_data.workflow_event" }),
        " and",
        /* @__PURE__ */ jsxRuntime.jsx("strong", { children: " provider_data.workflow_run_id" }),
        " when calling Medusa notification steps."
      ] })
    ] })
  ] });
};
const config = adminSdk.defineRouteConfig({
  label: "Postal",
  icon: icons.Envelope
});
const widgetModule = { widgets: [] };
const routeModule = {
  routes: [
    {
      Component: PostalAdminPage,
      path: "/postal"
    }
  ]
};
const menuItemModule = {
  menuItems: [
    {
      label: config.label,
      icon: config.icon,
      path: "/postal",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    }
  ]
};
const formModule = { customFields: {} };
const displayModule = {
  displays: {}
};
const i18nModule = { resources: {} };
const plugin = {
  widgetModule,
  routeModule,
  menuItemModule,
  formModule,
  displayModule,
  i18nModule
};
module.exports = plugin;

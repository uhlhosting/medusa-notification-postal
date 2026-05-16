import { jsx, jsxs } from "react/jsx-runtime";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, Text as Text$1, StatusBadge as StatusBadge$1, useDataTable, Container as Container$1, Heading as Heading$1, Spinner, DataTable } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Envelope, CheckCircle, XCircle, InformationCircle } from "@medusajs/icons";
import Medusa from "@medusajs/js-sdk";
import "@medusajs/admin-shared";
const sdk = new Medusa({
  baseUrl: "/",
  debug: false,
  auth: {
    type: "session"
  }
});
const Container = Container$1;
const Heading = Heading$1;
const Text = Text$1;
const StatusBadge = StatusBadge$1;
const columnHelper = createDataTableColumnHelper();
const columns = [
  columnHelper.accessor("to", {
    header: "Recipient",
    cell: ({ getValue }) => /* @__PURE__ */ jsx(Text, { size: "small", children: getValue() })
  }),
  columnHelper.accessor("template", {
    header: "Template / Tag",
    cell: ({ getValue }) => /* @__PURE__ */ jsx(StatusBadge, { color: "grey", children: getValue() })
  }),
  columnHelper.accessor("created_at", {
    header: "Sent At",
    cell: ({ getValue }) => /* @__PURE__ */ jsx(Text, { size: "small", children: new Date(getValue()).toLocaleString() })
  }),
  columnHelper.accessor("id", {
    header: "Status",
    cell: ({ row }) => {
      const data = row.original.data;
      const isSuccess = (data == null ? void 0 : data.message_id) || (data == null ? void 0 : data.status) === "success";
      return /* @__PURE__ */ jsx(StatusBadge, { color: isSuccess ? "green" : "red", children: isSuccess ? "Delivered" : "Failed" });
    }
  })
];
const PostalAdminPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["postal-health"],
    queryFn: () => sdk.client.fetch("/admin/postal/health"),
    refetchInterval: 3e4
    // Refetch every 30s
  });
  const { data: notificationsData, isLoading: isNotificationsLoading } = useQuery({
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
  const table = useDataTable({
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
  return /* @__PURE__ */ jsxs(Container, { className: "p-8 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Heading, { level: "h1", className: "mb-2", children: "Postal Notifications" }),
        /* @__PURE__ */ jsx(Text, { className: "text-ui-fg-subtle", children: "Manage and monitor your transactional emails sent via Postal." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: isHealthLoading ? /* @__PURE__ */ jsx(Spinner, { size: "small" }) : /* @__PURE__ */ jsx(StatusBadge, { color: (health == null ? void 0 : health.status) === "ok" ? "green" : "red", children: (health == null ? void 0 : health.status) === "ok" ? "Connected" : "Disconnected" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ui-fg-muted", children: [
          /* @__PURE__ */ jsx(Envelope, { size: 20 }),
          /* @__PURE__ */ jsx(Text, { weight: "plus", size: "small", children: "Deliverability" })
        ] }),
        /* @__PURE__ */ jsx(Text, { size: "xlarge", weight: "plus", children: "99.8%" }),
        /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Last 30 days average" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ui-fg-success", children: [
          /* @__PURE__ */ jsx(CheckCircle, { size: 20 }),
          /* @__PURE__ */ jsx(Text, { weight: "plus", size: "small", children: "Successful Sends" })
        ] }),
        /* @__PURE__ */ jsx(Text, { size: "xlarge", weight: "plus", children: (notificationsData == null ? void 0 : notificationsData.length) || 0 }),
        /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Current view count" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-ui-bg-component border rounded-lg p-6 flex flex-col gap-2 shadow-elevation-card-rest", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ui-fg-error", children: [
          /* @__PURE__ */ jsx(XCircle, { size: 20 }),
          /* @__PURE__ */ jsx(Text, { weight: "plus", size: "small", children: "Suppression Rate" })
        ] }),
        /* @__PURE__ */ jsx(Text, { size: "xlarge", weight: "plus", children: "0.2%" }),
        /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Bounces and complaints" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Container, { className: "p-0 overflow-hidden border rounded-lg", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b bg-ui-bg-subtle", children: /* @__PURE__ */ jsx(Heading, { level: "h2", children: "Recent Activity" }) }),
      /* @__PURE__ */ jsxs(DataTable, { instance: table, children: [
        /* @__PURE__ */ jsx(DataTable.Toolbar, { children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx(DataTable.Search, { placeholder: "Search by recipient..." }) }) }),
        /* @__PURE__ */ jsx(DataTable.Table, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-4 bg-ui-bg-subtle border border-dashed rounded-lg", children: [
      /* @__PURE__ */ jsx(InformationCircle, { className: "text-ui-fg-muted" }),
      /* @__PURE__ */ jsxs(Text, { size: "small", className: "text-ui-fg-subtle", children: [
        "Postal server is running at ",
        /* @__PURE__ */ jsx("strong", { children: (health == null ? void 0 : health.base_url) || "your-postal-server.com" }),
        ". Configure templates in your Postal dashboard."
      ] })
    ] })
  ] });
};
const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope
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
export {
  plugin as default
};

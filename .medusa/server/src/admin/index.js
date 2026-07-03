"use strict";
var _a;
const jsxRuntime = require("react/jsx-runtime");
const adminSdk = require("@medusajs/admin-sdk");
const ui = require("@medusajs/ui");
const reactQuery = require("@tanstack/react-query");
const react = require("react");
const reactI18next = require("react-i18next");
const icons = require("@medusajs/icons");
const Medusa = require("@medusajs/js-sdk");
const i18n = require("i18next");
const reactRouterDom = require("react-router-dom");
require("@medusajs/admin-shared");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const Medusa__default = /* @__PURE__ */ _interopDefault(Medusa);
const i18n__default = /* @__PURE__ */ _interopDefault(i18n);
const SingleColumnLayout = ({
  children,
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: ui.clx("flex min-w-0 flex-col gap-y-3", className), children });
};
const PluginShell = SingleColumnLayout;
const PluginHeader = ({
  title,
  description,
  statusLabel,
  statusColor = "grey",
  lastSuccessfulExecution,
  actions,
  helpLinks = [],
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: ui.clx("divide-y p-0", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-start md:justify-between", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-y-2", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { level: "h1", children: title }),
          statusLabel && /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: statusColor, children: statusLabel })
        ] }),
        description && /* @__PURE__ */ jsxRuntime.jsx(
          ui.Text,
          {
            size: "small",
            leading: "compact",
            className: "max-w-3xl break-words text-ui-fg-subtle",
            children: description
          }
        ),
        lastSuccessfulExecution && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-muted", children: lastSuccessfulExecution })
      ] }),
      actions && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions })
    ] }),
    helpLinks.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex min-w-0 flex-wrap items-center gap-2 px-4 py-3 sm:px-6", children: helpLinks.map((link) => /* @__PURE__ */ jsxRuntime.jsx(ui.Button, { asChild: true, size: "small", variant: "transparent", children: /* @__PURE__ */ jsxRuntime.jsx("a", { href: link.href, target: "_blank", rel: "noreferrer", children: link.label }) }, link.href)) })
  ] });
};
const statusColorClass = (color) => {
  if (color === "green") return "text-ui-fg-success";
  if (color === "red") return "text-ui-fg-error";
  if (color === "orange") return "text-ui-fg-warning";
  if (color === "blue" || color === "purple") return "text-ui-fg-interactive";
  return "text-ui-fg-subtle";
};
const PluginStatusCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = "grey",
  statusLabel,
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(ui.Container, { className: ui.clx("divide-y p-0", className), children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-start justify-between gap-4 px-6 py-4", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-y-2", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
        Icon && /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: ui.clx("size-4", statusColorClass(color)) }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Text,
          {
            size: "small",
            leading: "compact",
            weight: "plus",
            className: "text-ui-fg-subtle",
            children: title
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { as: "div", size: "xlarge", leading: "compact", weight: "plus", children: value }),
      description && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-muted", children: description })
    ] }),
    statusLabel && /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color, children: statusLabel })
  ] }) });
};
const PluginSection = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName
}) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: ui.clx("divide-y p-0", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-start md:justify-between", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-y-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { level: "h2", children: title }),
        description && /* @__PURE__ */ jsxRuntime.jsx(
          ui.Text,
          {
            size: "small",
            leading: "compact",
            className: "break-words text-ui-fg-subtle",
            children: description
          }
        )
      ] }),
      actions && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions })
    ] }),
    children && /* @__PURE__ */ jsxRuntime.jsx("div", { className: ui.clx("min-w-0 px-4 py-4 sm:px-6", bodyClassName), children })
  ] });
};
const PluginSidebarSection = ({
  title,
  icon,
  children,
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: ui.clx("divide-y p-0", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 items-center gap-x-2 px-4 py-4 text-ui-fg-subtle sm:px-6", children: [
      icon,
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: title })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "min-w-0 px-4 py-4 sm:px-6", children })
  ] });
};
const DEFAULT_BACKEND_ORIGIN = "/";
const toAbsoluteOrigin = (value) => {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) {
    return null;
  }
  try {
    return new URL(candidate).origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
};
const resolveBackendBaseUrl = (candidate, fallbackOrigin) => {
  const absoluteCandidate = toAbsoluteOrigin(candidate);
  if (absoluteCandidate) {
    return absoluteCandidate;
  }
  const absoluteFallback = toAbsoluteOrigin(fallbackOrigin);
  if (absoluteFallback) {
    return absoluteFallback;
  }
  return DEFAULT_BACKEND_ORIGIN;
};
const __vite_import_meta_env__ = {};
const runtimeEnv = globalThis.__VITE_ENV__ ?? {};
const backendUrl = (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.VITE_BACKEND_URL) ?? (typeof runtimeEnv.VITE_BACKEND_URL === "string" ? runtimeEnv.VITE_BACKEND_URL : void 0) ?? "/";
const resolvedBackendUrl = resolveBackendBaseUrl(
  backendUrl,
  typeof window !== "undefined" ? (_a = window.location) == null ? void 0 : _a.origin : null
);
const isDev = (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.NODE_ENV) === "development" || false || runtimeEnv.DEV === true || runtimeEnv.DEV === "true";
const sdk = new Medusa__default.default({
  baseUrl: resolvedBackendUrl,
  debug: Boolean(isDev),
  auth: {
    type: "jwt"
  }
});
const getPublicBackendBaseUrl = () => resolvedBackendUrl;
const en = {
  "postal.title": "Postal Notifications",
  "postal.subtitle": "Configure your Postal HTTP API delivery provider for transactional emails.",
  "postal.configured": "Configured",
  "postal.not_configured": "Not Configured",
  "postal.settings.runtime_notice": "Saved settings may require backend restart depending on auth mode.",
  "postal.settings.help_postal": "Postal documentation",
  "postal.configuration": "Configuration",
  "postal.auth_type": "Authentication Type",
  "postal.select_auth_type": "Select auth type",
  "postal.from_email": "From Email",
  "postal.base_url": "Postal Base URL",
  "postal.api_key": "API Key",
  "postal.default_test_recipient": "Default Test Recipient",
  "postal.default_test_recipient_hint": "Used as fallback for testing delivery if no recipient is provided.",
  "postal.test_connectivity": "Test Connectivity",
  "postal.test_connectivity_hint": "Verify that your credentials are correct by sending a real test email through the Postal infrastructure.",
  "postal.recipient_address": "Recipient Address",
  "postal.cc": "CC",
  "postal.bcc": "BCC",
  "postal.sender_name": "Sender Name",
  "postal.reply_to": "Reply-To",
  "postal.template": "Template",
  "postal.template_preview": "Template Preview",
  "postal.template_subject": "Subject",
  "postal.template_text": "Text",
  "postal.template_html": "HTML",
  "postal.template_rendered_preview": "Rendered Preview",
  "postal.template_rendered_preview_hint": "Sandboxed browser rendering",
  "postal.template_example": "Example Payload",
  "postal.copy_example_values": "Copy Example JSON",
  "postal.template_example_copied": "Example payload copied",
  "postal.template_example_copy_failed": "Failed to copy example payload",
  "postal.load_example_values": "Load Example Values",
  "postal.custom_args": "Custom Args JSON",
  "postal.custom_args_placeholder": '{\n  "order_id": "ord_123"\n}',
  "postal.metadata": "Metadata JSON",
  "postal.metadata_placeholder": '{\n  "store": "main"\n}',
  "postal.headers": "Headers JSON",
  "postal.headers_placeholder": '{\n  "X-Trace-Id": "trace_123"\n}',
  "postal.invalid_custom_args_json": "Invalid JSON in Custom Args JSON",
  "postal.invalid_metadata_json": "Invalid JSON in Metadata JSON",
  "postal.invalid_headers_json": "Invalid JSON in Headers JSON",
  "postal.invalid_example_json": "Invalid example payload JSON",
  "postal.template_empty": "Empty",
  "postal.send_test_email": "Send Test Email",
  "postal.save_changes": "Save Changes",
  "postal.active_config_checklist": "Active Config Checklist",
  "postal.set": "Set",
  "postal.missing": "Missing",
  "postal.recipient_fallback": "recipient",
  "postal.saved_key_prefix": "Saved key:",
  "postal.saved_key_suffix": "Enter a new key only to replace it.",
  "postal.saved_password_prefix": "Saved password:",
  "postal.saved_password_suffix": "Enter a new password only to replace it.",
  "postal.no_api_key_saved": "No API key saved yet.",
  "postal.api_key_saved_no_hint": "API key is saved. Enter a new key only to replace it.",
  "postal.masked_long": "••••••••••••••••",
  "postal.masked_short": "••••••••",
  "postal.toast.saved": "Postal settings saved",
  "postal.toast.save_failed": "Failed to save postal settings",
  "postal.toast.test_queued_prefix": "Postal test queued to",
  "postal.toast.test_failed": "Failed to send test email",
  "postal.placeholder.from_email": "noreply@example.com",
  "postal.placeholder.base_url": "https://postal.example.com",
  "postal.placeholder.api_key": "postal-api-key",
  "postal.placeholder.test_recipient": "recipient@example.com",
  "postal.placeholder.sender_name": "Optional sender name",
  "postal.placeholder.reply_to": "Optional reply-to address",
  "postal.placeholder.customer_email": "customer@example.com",
  "postal.placeholder.recipients_list": "Optional comma-separated recipients",
  "postal.webhook_callback": "Webhook Callback",
  "postal.webhook_callback_path": "Callback Path",
  "postal.webhook_callback_hint": "Use the secure tokenized URL shown on the Postal activity page.",
  "postal.copy_callback_path": "Copy URL",
  "postal.copy_callback_url": "Copy URL",
  "postal.webhook_callback_copied": "Callback path copied",
  "postal.webhook_callback_hint_suffix": "The exact tokenized URL is shown on the Postal activity page.",
  "postal.activity.subtitle": "Manage and monitor your transactional emails accepted by Postal.",
  "postal.activity.checking": "Checking...",
  "postal.activity.connected": "Connected",
  "postal.activity.disconnected": "Disconnected",
  "postal.activity.last_checked": "Last checked: {{time}}",
  "postal.activity.help_postal": "Postal documentation",
  "postal.activity.auth_mode": "Auth Mode",
  "postal.activity.configured_transport": "Configured Postal transport",
  "postal.activity.accepted": "Accepted",
  "postal.activity.accepted_help": "Rows accepted by Postal or assigned an external id",
  "postal.activity.total_events": "Total Events",
  "postal.activity.records_shown": "Notification records shown",
  "postal.activity.recent_activity": "Recent Activity",
  "postal.activity.search_placeholder": "Search by recipient...",
  "postal.activity.help_webhooks": "Postal webhooks",
  "postal.activity.help_http_payloads": "Postal HTTP payloads",
  "postal.activity.help_bounces": "Postal bounces",
  "postal.activity.help_tags": "Postal tags and wildcards",
  "postal.activity.recipient": "Recipient",
  "postal.activity.template": "Template / Tag",
  "postal.activity.accepted_at": "Accepted At",
  "postal.activity.status": "Status",
  "postal.activity.pending": "Pending",
  "postal.activity.failed": "Failed",
  "postal.activity.pending_failed": "Pending/Failed",
  "postal.activity.workflow_metadata": "Workflow metadata",
  "postal.activity.workflow_hint_prefix": "Track workflow-level email events by setting",
  "postal.activity.workflow_hint_middle": "and",
  "postal.activity.workflow_hint_suffix": "when calling Medusa notification steps.",
  "postal.webhooks.total_events": "Webhook Events",
  "postal.webhooks.records_shown": "Webhook records shown",
  "postal.webhooks.recent_events": "Recent Webhook Events",
  "postal.webhooks.search_placeholder": "Search by message id or recipient...",
  "postal.webhooks.event": "Event",
  "postal.webhooks.status": "Status",
  "postal.webhooks.message_id": "Message ID",
  "postal.webhooks.recipient": "Recipient",
  "postal.webhooks.received_at": "Received At",
  "postal.webhooks.endpoint": "Webhook Endpoint",
  "postal.webhooks.endpoint_hint_prefix": "Configure Postal to POST delivery events to",
  "postal.webhooks.endpoint_hint_suffix": "and store the raw callback payload for later inspection.",
  "postal.webhooks.callback_url": "Callback URL",
  "postal.webhook_callback_url": "Webhook URL",
  "postal.webhooks.callback_url_hint_prefix": "Use this exact callback URL generated by this plugin in Postal:",
  "postal.webhooks.callback_url_hint_suffix": "It resolves to the current Medusa backend host and includes a secure token.",
  "postal.webhooks.callback_url_missing_prefix": "Save the Postal settings to generate the plugin-managed callback URL, then copy",
  "postal.webhooks.callback_url_missing_suffix": "from the activity page.",
  "postal.webhooks.sent": "Sent",
  "postal.webhooks.delayed": "Delayed",
  "postal.webhooks.failed": "Failed",
  "postal.webhooks.held": "Held",
  "postal.webhooks.bounced": "Bounced",
  "postal.webhooks.clicked": "Link Clicked",
  "postal.webhooks.loaded": "Loaded",
  "postal.webhooks.dns_error": "DNS Error",
  "postal.webhooks.unknown": "Unknown"
};
const de = {
  "postal.title": "Postal-Benachrichtigungen",
  "postal.subtitle": "Konfiguriere den Postal HTTP-API-Anbieter für transaktionale E-Mails.",
  "postal.configured": "Konfiguriert",
  "postal.not_configured": "Nicht konfiguriert",
  "postal.settings.runtime_notice": "Gespeicherte Einstellungen können je nach Auth-Modus einen Backend-Neustart erfordern.",
  "postal.settings.help_postal": "Postal-Dokumentation",
  "postal.configuration": "Konfiguration",
  "postal.auth_type": "Authentifizierungstyp",
  "postal.select_auth_type": "Authentifizierungstyp wählen",
  "postal.from_email": "Absender-E-Mail",
  "postal.base_url": "Postal Base URL",
  "postal.api_key": "API-Schlüssel",
  "postal.default_test_recipient": "Standard-Testempfänger",
  "postal.default_test_recipient_hint": "Wird als Fallback für Testzustellungen verwendet, wenn kein Empfänger angegeben ist.",
  "postal.test_connectivity": "Verbindung testen",
  "postal.test_connectivity_hint": "Prüft die Zugangsdaten mit einer echten Test-E-Mail über die Postal-Infrastruktur.",
  "postal.recipient_address": "Empfängeradresse",
  "postal.cc": "CC",
  "postal.bcc": "BCC",
  "postal.sender_name": "Absendername",
  "postal.reply_to": "Reply-To",
  "postal.template": "Template",
  "postal.template_preview": "Template-Vorschau",
  "postal.template_subject": "Betreff",
  "postal.template_text": "Text",
  "postal.template_html": "HTML",
  "postal.template_rendered_preview": "Gerenderte Vorschau",
  "postal.template_rendered_preview_hint": "Abgesichertes Browser-Rendering",
  "postal.template_example": "Beispiel-Payload",
  "postal.copy_example_values": "Beispiel-JSON kopieren",
  "postal.template_example_copied": "Beispiel-Payload kopiert",
  "postal.template_example_copy_failed": "Beispiel-Payload konnte nicht kopiert werden",
  "postal.load_example_values": "Beispielwerte laden",
  "postal.custom_args": "Custom Args JSON",
  "postal.custom_args_placeholder": '{\n  "order_id": "ord_123"\n}',
  "postal.metadata": "Metadata JSON",
  "postal.metadata_placeholder": '{\n  "store": "main"\n}',
  "postal.headers": "Headers JSON",
  "postal.headers_placeholder": '{\n  "X-Trace-Id": "trace_123"\n}',
  "postal.invalid_custom_args_json": "Ungültiges JSON in Custom Args JSON",
  "postal.invalid_metadata_json": "Ungültiges JSON in Metadata JSON",
  "postal.invalid_headers_json": "Ungültiges JSON in Headers JSON",
  "postal.invalid_example_json": "Ungültiges Beispiel-Payload-JSON",
  "postal.template_empty": "Leer",
  "postal.send_test_email": "Test-E-Mail senden",
  "postal.save_changes": "Änderungen speichern",
  "postal.active_config_checklist": "Aktive Konfiguration",
  "postal.set": "Gesetzt",
  "postal.missing": "Fehlt",
  "postal.recipient_fallback": "Empfänger",
  "postal.saved_key_prefix": "Gespeicherter Schlüssel:",
  "postal.saved_key_suffix": "Neuen Schlüssel nur eingeben, um ihn zu ersetzen.",
  "postal.saved_password_prefix": "Gespeichertes Passwort:",
  "postal.saved_password_suffix": "Neues Passwort nur eingeben, um es zu ersetzen.",
  "postal.no_api_key_saved": "Noch kein API-Schlüssel gespeichert.",
  "postal.api_key_saved_no_hint": "API-Schlüssel ist gespeichert. Neuen Schlüssel nur eingeben, um ihn zu ersetzen.",
  "postal.masked_long": "••••••••••••••••",
  "postal.masked_short": "••••••••",
  "postal.toast.saved": "Postal-Einstellungen gespeichert",
  "postal.toast.save_failed": "Postal-Einstellungen konnten nicht gespeichert werden",
  "postal.toast.test_queued_prefix": "Postal-Test eingereiht an",
  "postal.toast.test_failed": "Test-E-Mail konnte nicht gesendet werden",
  "postal.placeholder.from_email": "noreply@example.com",
  "postal.placeholder.base_url": "https://postal.example.com",
  "postal.placeholder.api_key": "postal-api-key",
  "postal.placeholder.test_recipient": "recipient@example.com",
  "postal.placeholder.sender_name": "Optionaler Absendername",
  "postal.placeholder.reply_to": "Optionale Reply-To-Adresse",
  "postal.placeholder.customer_email": "kunde@example.com",
  "postal.placeholder.recipients_list": "Optionale Empfaenger, durch Kommas getrennt",
  "postal.webhook_callback": "Webhook-Callback",
  "postal.webhook_callback_path": "Callback-Pfad",
  "postal.webhook_callback_hint": "Verwende die sichere tokenisierte URL auf der Postal-Aktivitätsseite.",
  "postal.copy_callback_path": "URL kopieren",
  "postal.copy_callback_url": "URL kopieren",
  "postal.webhook_callback_copied": "Callback-Pfad kopiert",
  "postal.webhook_callback_hint_suffix": "Die exakte tokenisierte URL wird auf der Postal-Aktivitätsseite angezeigt.",
  "postal.activity.subtitle": "Verwalte und überwache transaktionale E-Mails, die von Postal akzeptiert werden.",
  "postal.activity.checking": "Prüfung läuft...",
  "postal.activity.connected": "Verbunden",
  "postal.activity.disconnected": "Getrennt",
  "postal.activity.last_checked": "Zuletzt geprüft: {{time}}",
  "postal.activity.help_postal": "Postal-Dokumentation",
  "postal.activity.auth_mode": "Auth-Modus",
  "postal.activity.configured_transport": "Konfigurierter Postal-Transport",
  "postal.activity.accepted": "Akzeptiert",
  "postal.activity.accepted_help": "Zeilen, die von Postal akzeptiert oder mit einer externen ID versehen wurden",
  "postal.activity.total_events": "Ereignisse gesamt",
  "postal.activity.records_shown": "Angezeigte Benachrichtigungen",
  "postal.activity.recent_activity": "Letzte Aktivität",
  "postal.activity.search_placeholder": "Nach Empfänger suchen...",
  "postal.activity.help_webhooks": "Postal-Webhooks",
  "postal.activity.help_http_payloads": "Postal-HTTP-Payloads",
  "postal.activity.help_bounces": "Postal-Bounces",
  "postal.activity.help_tags": "Postal-Tags und Wildcards",
  "postal.activity.recipient": "Empfänger",
  "postal.activity.template": "Template / Tag",
  "postal.activity.accepted_at": "Akzeptiert am",
  "postal.activity.status": "Status",
  "postal.activity.pending": "Ausstehend",
  "postal.activity.failed": "Fehlgeschlagen",
  "postal.activity.pending_failed": "Ausstehend/Fehlgeschlagen",
  "postal.activity.workflow_metadata": "Workflow-Metadaten",
  "postal.activity.workflow_hint_prefix": "Workflow-E-Mail-Ereignisse nachverfolgen, indem",
  "postal.activity.workflow_hint_middle": "und",
  "postal.activity.workflow_hint_suffix": "beim Aufruf der Medusa-Benachrichtigungsschritte gesetzt werden.",
  "postal.webhooks.total_events": "Webhook-Ereignisse",
  "postal.webhooks.records_shown": "Angezeigte Webhook-Einträge",
  "postal.webhooks.recent_events": "Letzte Webhook-Ereignisse",
  "postal.webhooks.search_placeholder": "Nach Nachrichten-ID oder Empfänger suchen...",
  "postal.webhooks.event": "Ereignis",
  "postal.webhooks.status": "Status",
  "postal.webhooks.message_id": "Nachrichten-ID",
  "postal.webhooks.recipient": "Empfänger",
  "postal.webhooks.received_at": "Empfangen am",
  "postal.webhooks.endpoint": "Webhook-Endpunkt",
  "postal.webhooks.endpoint_hint_prefix": "Konfiguriere Postal so, dass Zustellereignisse an",
  "postal.webhooks.endpoint_hint_suffix": "gesendet und der rohe Callback-Payload für spätere Prüfung gespeichert wird.",
  "postal.webhooks.callback_url": "Callback-URL",
  "postal.webhook_callback_url": "Webhook-URL",
  "postal.webhooks.callback_url_hint_prefix": "Verwende diese exakte, von diesem Plugin erzeugte Callback-URL in Postal:",
  "postal.webhooks.callback_url_hint_suffix": "Sie zeigt auf den aktuellen Medusa-Backend-Host und enthält ein sicheres Token.",
  "postal.webhooks.callback_url_missing_prefix": "Speichere die Postal-Einstellungen, um die pluginverwaltete Callback-URL zu erzeugen, und kopiere sie dann",
  "postal.webhooks.callback_url_missing_suffix": "von der Aktivitätsseite.",
  "postal.webhooks.sent": "Gesendet",
  "postal.webhooks.delayed": "Verzögert",
  "postal.webhooks.failed": "Fehlgeschlagen",
  "postal.webhooks.held": "Zurückgehalten",
  "postal.webhooks.bounced": "Gebounct",
  "postal.webhooks.clicked": "Link geklickt",
  "postal.webhooks.loaded": "Geladen",
  "postal.webhooks.dns_error": "DNS-Fehler",
  "postal.webhooks.unknown": "Unbekannt"
};
const i18nTranslations0 = {
  en: { translation: en },
  de: { translation: de }
};
let registered = false;
const ensurePostalAdminTranslations = () => {
  if (registered) {
    return;
  }
  for (const [locale, bundle] of Object.entries(i18nTranslations0)) {
    const translation = bundle.translation;
    if (translation) {
      i18n__default.default.addResourceBundle(locale, "translation", translation, true, true);
    }
  }
  registered = true;
};
const columnHelper = ui.createDataTableColumnHelper();
const webhookColumnHelper = ui.createDataTableColumnHelper();
const sanitizeEmailDisplay = (value) => {
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
  if (!localPart || !domain) {
    return email;
  }
  const maskedLocal = localPart.length <= 2 ? `${localPart[0] || ""}*` : `${localPart[0]}***${localPart.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
};
const statusFromNotification = (notification) => {
  var _a2, _b;
  const status = String(
    notification.status || ((_a2 = notification.data) == null ? void 0 : _a2.status) || ((_b = notification.provider_data) == null ? void 0 : _b.status) || ""
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
const statusBadgeColor = (status) => {
  if (status === "accepted") {
    return "green";
  }
  if (status === "failed") {
    return "red";
  }
  return "orange";
};
const statusLabelKey = (status) => {
  if (status === "accepted") {
    return "postal.activity.accepted";
  }
  if (status === "failed") {
    return "postal.activity.failed";
  }
  return "postal.activity.pending";
};
const webhookStatusLabelKey = (status) => {
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
const webhookStatusBadgeColor = (status) => {
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
const buildPostalCallbackUrl = (token) => {
  const path = `/postal/webhooks/${token}`;
  const base = getPublicBackendBaseUrl();
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
};
const useColumns = () => {
  ensurePostalAdminTranslations();
  const { t } = reactI18next.useTranslation();
  return react.useMemo(
    () => [
      columnHelper.accessor("to", {
        header: t("postal.activity.recipient"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: sanitizeEmailDisplay(getValue()) })
      }),
      columnHelper.accessor("template", {
        header: t("postal.activity.template"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: "grey", children: getValue() })
      }),
      columnHelper.accessor("created_at", {
        header: t("postal.activity.accepted_at"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: new Date(getValue()).toLocaleString() })
      }),
      columnHelper.accessor("id", {
        header: t("postal.activity.status"),
        cell: ({ row }) => {
          const status = statusFromNotification(row.original);
          return /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: statusBadgeColor(status), children: t(statusLabelKey(status)) });
        }
      })
    ],
    [t]
  );
};
const useWebhookColumns = () => {
  ensurePostalAdminTranslations();
  const { t } = reactI18next.useTranslation();
  return react.useMemo(
    () => [
      webhookColumnHelper.accessor("event_type", {
        header: t("postal.webhooks.event"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: getValue() })
      }),
      webhookColumnHelper.accessor("status", {
        header: t("postal.webhooks.status"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: webhookStatusBadgeColor(getValue()), children: t(webhookStatusLabelKey(getValue())) })
      }),
      webhookColumnHelper.accessor("message_id", {
        header: t("postal.webhooks.message_id"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: getValue() || "-" })
      }),
      webhookColumnHelper.accessor("recipient", {
        header: t("postal.webhooks.recipient"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: sanitizeEmailDisplay(getValue()) })
      }),
      webhookColumnHelper.accessor("created_at", {
        header: t("postal.webhooks.received_at"),
        cell: ({ getValue }) => /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", children: getValue() ? new Date(getValue()).toLocaleString() : "-" })
      })
    ],
    [t]
  );
};
const PostalAdminPage = () => {
  ensurePostalAdminTranslations();
  const { t } = reactI18next.useTranslation();
  const [searchValue, setSearchValue] = react.useState("");
  const columns = useColumns();
  const webhookCallbackPath = "/postal/webhooks";
  const { data: health, isLoading: isHealthLoading, dataUpdatedAt: healthUpdatedAt } = reactQuery.useQuery({
    queryKey: ["postal-health"],
    queryFn: () => sdk.client.fetch("/admin/postal/health"),
    refetchInterval: 3e4
    // Refetch every 30s
  });
  const lastCheckedAt = healthUpdatedAt ? new Date(healthUpdatedAt).toLocaleString() : void 0;
  const { data: notificationsData, isLoading: isNotificationsLoading } = reactQuery.useQuery({
    queryKey: ["postal-notifications", searchValue],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/notifications", {
        query: {
          fields: "id,to,channel,template,data,provider_data,created_at,updated_at,status,external_id,provider_id,from",
          limit: 50,
          channel: "email",
          q: searchValue || void 0
        }
      });
      const notifications = Array.isArray(response == null ? void 0 : response.notifications) ? response.notifications : [];
      return notifications.filter(
        (n) => (n == null ? void 0 : n.provider_id) === "notification-postal" || (n == null ? void 0 : n.provider_id) === "postal" || (n == null ? void 0 : n.channel) === "email" && !(n == null ? void 0 : n.provider_id)
      ).map((notification) => ({
        ...notification,
        to: sanitizeEmailDisplay(notification == null ? void 0 : notification.to)
      }));
    }
  });
  const { data: webhookEventsData, isLoading: isWebhookEventsLoading } = reactQuery.useQuery({
    queryKey: ["postal-webhook-events"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/postal/webhooks", {
        query: {
          limit: 25
        }
      });
      return Array.isArray(response == null ? void 0 : response.events) ? response.events.map((event) => ({
        ...event,
        recipient: sanitizeEmailDisplay(event.recipient)
      })) : [];
    }
  });
  const { data: webhookUrlData } = reactQuery.useQuery({
    queryKey: ["postal-webhook-url"],
    queryFn: async () => {
      try {
        const response = await sdk.client.fetch("/admin/postal/webhook-url");
        return response || {};
      } catch {
        return null;
      }
    }
  });
  const webhookToken = String((webhookUrlData == null ? void 0 : webhookUrlData.token) || "").trim();
  const webhookCallbackUrl = String((webhookUrlData == null ? void 0 : webhookUrlData.callback_url) || "").trim() || (webhookToken ? buildPostalCallbackUrl(webhookToken) : "");
  const acceptedCount = react.useMemo(() => {
    return (notificationsData || []).filter(
      (n) => statusFromNotification(n) === "accepted"
    ).length;
  }, [notificationsData]);
  const webhookEventColumns = useWebhookColumns();
  const webhookTable = ui.useDataTable({
    data: webhookEventsData || [],
    columns: webhookEventColumns,
    getRowId: (event) => event.id,
    rowCount: (webhookEventsData == null ? void 0 : webhookEventsData.length) || 0,
    isLoading: isWebhookEventsLoading
  });
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
  return /* @__PURE__ */ jsxRuntime.jsxs(PluginShell, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      PluginHeader,
      {
        title: t("postal.title"),
        description: t("postal.activity.subtitle"),
        statusColor: (health == null ? void 0 : health.status) === "ok" ? "green" : "red",
        statusLabel: isHealthLoading ? t("postal.activity.checking") : (health == null ? void 0 : health.status) === "ok" ? t("postal.activity.connected") : t("postal.activity.disconnected"),
        lastSuccessfulExecution: lastCheckedAt ? t("postal.activity.last_checked", {
          time: lastCheckedAt
        }) : void 0,
        helpLinks: [
          {
            label: t("postal.activity.help_postal"),
            href: "https://docs.postalserver.io/"
          },
          {
            label: t("postal.activity.help_webhooks"),
            href: "https://docs.postalserver.io/developer/webhooks"
          },
          {
            label: t("postal.activity.help_http_payloads"),
            href: "https://docs.postalserver.io/developer/http-payloads"
          },
          {
            label: t("postal.activity.help_bounces"),
            href: "https://docs.postalserver.io/other/auto-responders-and-bounces"
          },
          {
            label: t("postal.activity.help_tags"),
            href: "https://docs.postalserver.io/other/wildcards-and-address-tags"
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        PluginStatusCard,
        {
          title: t("postal.activity.auth_mode"),
          value: "API only",
          description: t("postal.activity.configured_transport"),
          icon: icons.Envelope,
          color: "grey"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        PluginStatusCard,
        {
          title: t("postal.activity.accepted"),
          value: acceptedCount,
          description: t("postal.activity.accepted_help"),
          icon: icons.CheckCircle,
          color: "green"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        PluginStatusCard,
        {
          title: t("postal.activity.total_events"),
          value: (notificationsData == null ? void 0 : notificationsData.length) || 0,
          description: t("postal.activity.records_shown"),
          icon: icons.XCircle,
          color: "orange"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        PluginStatusCard,
        {
          title: t("postal.webhooks.total_events"),
          value: (webhookEventsData == null ? void 0 : webhookEventsData.length) || 0,
          description: t("postal.webhooks.records_shown"),
          icon: icons.XCircle,
          color: "blue"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      PluginSection,
      {
        title: t("postal.activity.recent_activity"),
        bodyClassName: "p-0",
        children: /* @__PURE__ */ jsxRuntime.jsxs(ui.DataTable, { instance: table, children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Toolbar, { children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntime.jsx(
            ui.DataTable.Search,
            {
              placeholder: t("postal.activity.search_placeholder")
            }
          ) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Table, {})
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      PluginSection,
      {
        title: t("postal.webhooks.recent_events"),
        bodyClassName: "p-0",
        children: /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable, { instance: webhookTable, children: /* @__PURE__ */ jsxRuntime.jsx(ui.DataTable.Table, {}) })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.InlineTip, { label: t("postal.activity.workflow_metadata"), children: [
      t("postal.activity.workflow_hint_prefix"),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { children: "provider_data.workflow_event" }),
      " ",
      t("postal.activity.workflow_hint_middle"),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { children: "provider_data.workflow_run_id" }),
      " ",
      t("postal.activity.workflow_hint_suffix")
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.InlineTip, { label: t("postal.webhooks.endpoint"), children: [
      t("postal.webhooks.endpoint_hint_prefix"),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { children: webhookCallbackPath }),
      " ",
      t("postal.webhooks.endpoint_hint_suffix")
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(ui.InlineTip, { label: t("postal.webhooks.callback_url"), children: webhookCallbackUrl ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      t("postal.webhooks.callback_url_hint_prefix"),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { children: webhookCallbackUrl }),
      " ",
      t("postal.webhooks.callback_url_hint_suffix")
    ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      t("postal.webhooks.callback_url_missing_prefix"),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { children: webhookCallbackPath }),
      " ",
      t("postal.webhooks.callback_url_missing_suffix")
    ] }) })
  ] });
};
const config$1 = adminSdk.defineRouteConfig({
  label: "Postal",
  icon: function PostalRouteIcon() {
    return /* @__PURE__ */ jsxRuntime.jsxs("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "15", height: "15", fill: "#F43F5E" }),
      /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "15", height: "15", fill: "url(#postal-admin-icon-gradient)", fillOpacity: "0.2" }),
      /* @__PURE__ */ jsxRuntime.jsxs("g", { transform: "translate(2 2) scale(0.7)", stroke: "white", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M11.829 4.398a2.82 2.82 0 0 1 1.511 2.498v4.028c0 .444-.36.805-.805.805H6.493M4.48 4.077h4.832" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.48 4.077a2.82 2.82 0 0 1 2.819 2.82v4.027c0 .444-.361.805-.806.805H2.465a.806.806 0 0 1-.805-.805V6.896a2.82 2.82 0 0 1 2.82-2.82M7.299 11.528v1.812M4.48 6.896v1.208" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { fill: "white", d: "M11.73.854H9.311v1.209h2.417z" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M9.313 5.285V1.86" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("defs", { children: /* @__PURE__ */ jsxRuntime.jsxs("linearGradient", { id: "postal-admin-icon-gradient", x1: "7.5", y1: "0", x2: "7.5", y2: "15", gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxRuntime.jsx("stop", { stopColor: "white" }),
        /* @__PURE__ */ jsxRuntime.jsx("stop", { offset: "1", stopColor: "white", stopOpacity: "0" })
      ] }) })
    ] });
  }
});
const TEST_TO = "recipient@example.com";
const buildRichHtmlTemplate = (eyebrow, title, body, footer, preview) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="background-color:#f5f1ea;margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,'Noto Sans','Liberation Sans',sans-serif;color:#171717">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent">
      ${preview || title}
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="margin:0;padding:0;background-color:#f5f1ea;font-family:'Helvetica Neue',Helvetica,Arial,'Noto Sans','Liberation Sans',sans-serif;color:#171717">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;padding:24px 12px 36px">
              <tbody>
                <tr>
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;border-radius:28px;overflow:hidden;background-color:#ffffff;border:1px solid #e7dfd3;box-shadow:0 12px 32px rgba(17, 17, 17, 0.08)">
                      <tbody>
                        <tr style="width:100%">
                          <td>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="height:6px;background-color:#171717">
                              <tbody>
                                <tr>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 32px 22px;background-color:#fffdf8;border-bottom:1px solid #f0e9df">
                              <tbody>
                                <tr>
                                  <td>
                                    <p style="font-size:12px;line-height:18px;margin:0 0 12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7b6b52">
                                      ${eyebrow}
                                    </p>
                                    <h1 style="margin:0;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.02em;color:#111111">
                                      ${title}
                                    </h1>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 32px 16px;background-color:#ffffff">
                              <tbody>
                                <tr>
                                  <td>
                                    <div style="font-size:16px;line-height:28px;color:#222222">
                                      ${body}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:0 32px 32px;background-color:#ffffff">
                              <tbody>
                                <tr>
                                  <td>
                                    <div style="margin-top:12px;padding:18px 20px;background-color:#fff8ef;border:1px solid #f1e1cf;border-radius:20px;color:#6b5b45;font-size:14px;line-height:22px">
                                      ${footer}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
const POSTAL_TEMPLATE_REGISTRY = {
  default: {
    subject: "Notification",
    html: buildRichHtmlTemplate(
      "Postal Notification",
      "Notification",
      `
        <p style="margin:0 0 14px">
          This is a generic Postal notification preview used for template validation.
        </p>
        <div style="margin:22px 0 8px;padding:18px 20px;border:1px solid #efe3d4;border-radius:20px;background:#fffaf2">
          <p style="margin:0;font-weight:700;color:#111111">Fallback preview</p>
          <p style="margin:8px 0 0;color:#4b453e">
            Use this template when a workflow does not provide a more specific subject or body.
          </p>
        </div>
      `,
      "Use this template as a fallback when a workflow does not provide a more specific subject or body.",
      "Postal notification preview"
    ),
    text: "This is a generic Postal notification preview used for template validation."
  },
  "postal-test": {
    subject: "Postal test send",
    html: buildRichHtmlTemplate(
      "Postal Transport Check",
      "Postal Test Send",
      `
        <p style="margin:0 0 16px">
          This is a Postal test message from Medusa.
        </p>
        <div style="margin:22px 0 8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
          <div style="padding:16px 18px;border:1px solid #efe3d4;border-radius:18px;background:#fffaf2">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7b6b52;font-weight:700">Transport</p>
            <p style="margin:0;font-size:16px;line-height:24px;font-weight:700;color:#111111">Postal API and workflow delivery</p>
          </div>
          <div style="padding:16px 18px;border:1px solid #efe3d4;border-radius:18px;background:#fffaf2">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7b6b52;font-weight:700">Result</p>
            <p style="margin:0;font-size:16px;line-height:24px;font-weight:700;color:#111111">Rich HTML preview renders correctly</p>
          </div>
        </div>
      `,
      "If you received this message, the Postal transport and workflow path are both working.",
      "Postal transport and workflow path are working."
    ),
    text: "Postal test message from Medusa."
  },
  "postal-admin-test": {
    subject: "Postal test from Medusa Admin",
    html: buildRichHtmlTemplate(
      "Medusa Admin Settings",
      "Postal Test From Admin",
      `
        <p style="margin:0 0 16px">
          Postal provider test message from Medusa Admin settings.
        </p>
        <div style="margin:22px 0 8px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Admin check</p>
          <p style="margin:0;font-size:16px;line-height:24px;color:#111111">
            This message confirms the saved Postal configuration can send through the live provider.
          </p>
        </div>
      `,
      "This message confirms the saved Postal configuration can send through the live provider.",
      "Postal admin configuration test."
    ),
    text: "Postal provider test message from Medusa Admin settings."
  },
  "order-placed": {
    subject: "Order confirmation",
    html: buildRichHtmlTemplate(
      "Order Receipt",
      "Thanks for your order",
      `
        <p style="margin:0 0 18px">
          We have received your order and are preparing it for fulfillment.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#fffaf2;border:1px solid #efe3d4">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding:0 0 12px;color:#7b6b52;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Order summary</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#111111">Order received</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;line-height:24px;color:#4b453e">We will email you again once your items move into fulfillment.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin:0">
          <a href="https://example.com/account/orders" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">View order details</a>
        </p>
      `,
      "This is a sample customer-facing transactional message.",
      "Your order has been received and is being prepared."
    ),
    text: "We have received your order and are preparing it for fulfillment."
  },
  "password-reset": {
    subject: "Reset your password",
    html: buildRichHtmlTemplate(
      "Account Security",
      "Reset your password",
      `
        <p style="margin:0 0 14px">
          We received a request to reset the password for your account.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#fff7f8;border:1px solid #f3d7dd">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8e4b5a;font-weight:700">Security notice</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#4b453e">This link can only be used once and will expire for security reasons.</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#4b453e">If you did not request this, you can ignore this email and your password will remain unchanged.</p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/reset-password" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Reset password</a>
        </p>
      `,
      "If you did not request this reset, you can safely ignore this message.",
      "We received a request to reset the password for your account."
    ),
    text: "We received a request to reset the password for your account."
  },
  "email-verification": {
    subject: "Verify your email address",
    html: buildRichHtmlTemplate(
      "Account Security",
      "Verify your email address",
      `
        <p style="margin:0 0 14px">
          Use the verification link in this email to confirm your email address and finish setting up your account.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Verification notice</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#2b3d57">This link is for account activation and should only be used by the intended recipient.</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#2b3d57">If you did not request this message, you can safely ignore it.</p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/verify-email" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Verify email</a>
        </p>
      `,
      "If you did not request this message, you can safely ignore it.",
      "Verify your email address"
    ),
    text: "Use the link in this email to verify your email address."
  },
  welcome: {
    subject: "Welcome",
    html: buildRichHtmlTemplate(
      "Customer Welcome",
      "Welcome aboard",
      `
        <p style="margin:0 0 18px">
          We are glad to have you with us.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#f6fbf5;border:1px solid #dcebd8">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#57705b;font-weight:700">Next steps</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#334033">
            <li style="margin:0 0 8px">Explore the storefront</li>
            <li style="margin:0 0 8px">Review your account details</li>
            <li style="margin:0">Reach out if you need help</li>
          </ul>
        </div>
        <p style="margin:0">
          <a href="https://example.com" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Explore storefront</a>
        </p>
      `,
      "Use this template for onboarding and first-contact customer messaging.",
      "We are glad to have you with us."
    ),
    text: "We are glad to have you with us."
  },
  "abandoned-cart": {
    subject: "You left items in your cart",
    html: buildRichHtmlTemplate(
      "Cart Recovery",
      "You left items in your cart",
      `
        <p style="margin:0 0 14px">
          We saved the items you added to your cart. You can return any time and finish checkout in a couple of clicks.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#fffaf2;border:1px solid #efe3d4">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding:0 0 12px;color:#7b6b52;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Items waiting for you</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#111111">Cart summary</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;line-height:24px;color:#4b453e">Keep the recovery message focused on the products, the total, and a single clear return path.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin:0">
          <a href="https://example.com/cart" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">Return to cart</a>
        </p>
      `,
      "If you already completed your order, you can ignore this message.",
      "We saved the items you added to your cart."
    ),
    text: "We saved the items you added to your cart."
  },
  "restock-available": {
    subject: "Product is back in stock",
    html: buildRichHtmlTemplate(
      "Back In Stock",
      "Product is back in stock",
      `
        <p style="margin:0 0 14px">
          The item you asked us to watch is available again. If you still want it, you can go straight to the product page and place your order.
        </p>
        <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#f4f8ff;border:1px solid #dbe7ff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#35507a;font-weight:700">Product</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#2b3d57">
            Use this message when inventory changes should trigger a customer notification.
          </p>
        </div>
        <p style="margin:0">
          <a href="https://example.com/products/example-product" style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;line-height:20px">View product</a>
        </p>
      `,
      "If you no longer need this item, you can ignore this email.",
      "The item you asked us to watch is available again."
    ),
    text: "The item you asked us to watch is available again."
  }
};
const POSTAL_TEMPLATE_ORDER = [
  "postal-admin-test",
  "postal-test",
  "order-placed",
  "password-reset",
  "email-verification",
  "welcome",
  "abandoned-cart",
  "restock-available"
];
const getPostalTemplateOptions = () => POSTAL_TEMPLATE_ORDER.map((value) => {
  const definition = POSTAL_TEMPLATE_REGISTRY[value];
  const label = value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return {
    value,
    label,
    description: definition.subject
  };
});
const getPostalTemplatePreview = (template) => {
  const definition = POSTAL_TEMPLATE_REGISTRY[template];
  const option = getPostalTemplateOptions().find(
    (candidate) => candidate.value === template
  );
  return {
    value: template,
    label: (option == null ? void 0 : option.label) || template,
    description: (option == null ? void 0 : option.description) || definition.subject,
    subject: definition.subject,
    html: definition.html || "",
    text: definition.text || ""
  };
};
const getPostalTemplateExample = (template) => {
  const preview = getPostalTemplatePreview(template);
  const examples = {
    default: {
      to: TEST_TO,
      from: "no-reply@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Trace-Id": "trace_default"
      },
      workflow_event: "postal.example.default",
      workflow_run_id: "wf_example_default",
      custom_args: {
        example: "default"
      },
      metadata: {
        audience: "customer"
      }
    },
    "postal-test": {
      to: TEST_TO,
      from: "no-reply@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Trace-Id": "trace_postal_test"
      },
      workflow_event: "postal.example.test",
      workflow_run_id: "wf_example_postal_test",
      custom_args: {
        example: "postal-test"
      },
      metadata: {
        audience: "operator"
      }
    },
    "postal-admin-test": {
      to: TEST_TO,
      from: "no-reply@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Trace-Id": "trace_admin_test"
      },
      workflow_event: "postal.example.admin_test",
      workflow_run_id: "wf_example_admin_test",
      custom_args: {
        example: "postal-admin-test"
      },
      metadata: {
        audience: "operator"
      }
    },
    "order-placed": {
      to: TEST_TO,
      from: "orders@example.com",
      from_name: "Example Store",
      reply_to: "orders@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Order-Id": "ord_123"
      },
      workflow_event: "order.placed",
      workflow_run_id: "wf_example_order_placed",
      custom_args: {
        order_id: "ord_123"
      },
      metadata: {
        store: "main"
      }
    },
    "password-reset": {
      to: TEST_TO,
      from: "security@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Reset-Flow": "password-reset"
      },
      workflow_event: "customer.password_reset",
      workflow_run_id: "wf_example_password_reset",
      custom_args: {
        reset_token: "token_123"
      },
      metadata: {
        store: "main"
      }
    },
    "email-verification": {
      to: TEST_TO,
      from: "security@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Verification-Flow": "email-verification"
      },
      workflow_event: "customer.email_verification",
      workflow_run_id: "wf_example_email_verification",
      custom_args: {
        verification_token: "token_456"
      },
      metadata: {
        store: "main"
      }
    },
    welcome: {
      to: TEST_TO,
      from: "hello@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {
        "X-Welcome-Campaign": "default"
      },
      workflow_event: "customer.welcome",
      workflow_run_id: "wf_example_welcome",
      custom_args: {
        segment: "new-customer"
      },
      metadata: {
        store: "main"
      }
    },
    "abandoned-cart": {
      to: TEST_TO,
      from: "orders@example.com",
      from_name: "Example Store",
      reply_to: "orders@example.com",
      cc: [],
      bcc: [],
      headers: {},
      workflow_event: "cart.abandoned",
      workflow_run_id: "wf_example_abandoned_cart",
      custom_args: {
        cart_id: "cart_123"
      },
      metadata: {
        store: "main"
      }
    },
    "restock-available": {
      to: TEST_TO,
      from: "hello@example.com",
      from_name: "Example Store",
      reply_to: "support@example.com",
      cc: [],
      bcc: [],
      headers: {},
      workflow_event: "restock.available",
      workflow_run_id: "wf_example_restock_available",
      custom_args: {
        product_id: "prod_123"
      },
      metadata: {
        store: "main"
      }
    }
  };
  return {
    ...preview,
    ...examples[template]
  };
};
const emptyForm = {
  auth_type: "smtp-api",
  from: "",
  base_url: "",
  api_key: "",
  test_to: ""
};
const emptyTestForm = {
  to: "",
  cc: "",
  bcc: "",
  from_name: "",
  reply_to: "",
  template: "postal-admin-test",
  subject: "",
  text: "",
  html: "",
  headers_json: "{}",
  custom_args_json: "{}",
  metadata_json: "{}"
};
const toTextareaClassName = "min-h-[160px] rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive";
const SummaryCard = ({ label, value }) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "min-w-0 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3", children: [
  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: label }),
  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", className: "break-words", children: value })
] });
const SettingsField = ({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
  disabled,
  hint,
  id
}) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
  /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: id, children: label }),
  /* @__PURE__ */ jsxRuntime.jsx(
    ui.Input,
    {
      id,
      type,
      placeholder,
      value,
      onChange: (e) => onChange(e.target.value),
      disabled
    }
  ),
  hint ? /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "break-words text-ui-fg-subtle", children: hint }) : null
] });
const postalTemplateReferenceRows = [
  {
    template: "default",
    purpose: "Generic fallback preview",
    audience: "shared",
    source: "Postal plugin native",
    required: "subject, html or text",
    optional: "template-specific content",
    event: "Any custom template",
    notes: "Used when a workflow provides custom content but no known template key."
  },
  {
    template: "postal-test",
    purpose: "Provider transport validation",
    audience: "ops",
    source: "Postal plugin native",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "postal.example.test",
    notes: "Use for live transport checks and operator testing."
  },
  {
    template: "postal-admin-test",
    purpose: "Admin settings validation",
    audience: "ops",
    source: "Postal plugin native",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "admin.postal.test",
    notes: "Used by the admin test-send panel."
  },
  {
    template: "order-placed",
    purpose: "Order confirmation",
    audience: "commerce",
    source: "Medusa native event",
    required: "order id, customer, items, currency, storefront URL",
    optional: "billing/shipping address, support URL, metadata, custom_args",
    event: "order.placed",
    notes: "Shared customer order notification."
  },
  {
    template: "password-reset",
    purpose: "Password reset",
    audience: "auth",
    source: "Medusa native event",
    required: "reset token or reset link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.password_reset",
    notes: "Shared auth flow email."
  },
  {
    template: "email-verification",
    purpose: "Email verification",
    audience: "auth",
    source: "Medusa native event",
    required: "verification token or verification link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.email_verification",
    notes: "Shared auth flow email."
  },
  {
    template: "welcome",
    purpose: "Customer onboarding",
    audience: "commerce",
    source: "Medusa native event",
    required: "customer name or customer context, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.welcome",
    notes: "Shared first-contact and onboarding mail."
  },
  {
    template: "abandoned-cart",
    purpose: "Cart recovery",
    audience: "commerce",
    source: "Project workflow",
    required: "cart id, cart items, recovery link, subject, html/text",
    optional: "locale, customer name, total, currency, support URL, metadata, custom_args",
    event: "cart.abandoned",
    notes: "Shared recovery reminder."
  },
  {
    template: "restock-available",
    purpose: "Back-in-stock alert",
    audience: "commerce",
    source: "Project workflow",
    required: "product title, product link, subject, html/text",
    optional: "customer name, product handle, locale, metadata, custom_args",
    event: "restock.available",
    notes: "Shared inventory notification."
  }
];
const PostalSettingsPage = () => {
  var _a2, _b, _c, _d, _e;
  ensurePostalAdminTranslations();
  const { t } = reactI18next.useTranslation();
  const [form, setForm] = react.useState(emptyForm);
  const [testForm, setTestForm] = react.useState(emptyTestForm);
  const [previewMode, setPreviewMode] = react.useState("rendered");
  const [templateAudienceFilter, setTemplateAudienceFilter] = react.useState("all");
  const [templateSearch, setTemplateSearch] = react.useState("");
  const templateOptions = getPostalTemplateOptions();
  const selectedTemplate = templateOptions.find(
    (option) => option.value === testForm.template
  );
  const templateExample = getPostalTemplateExample(
    testForm.template || "postal-admin-test"
  );
  const templateExampleForUi = {
    ...templateExample,
    to: "",
    from: "",
    from_name: "",
    reply_to: "",
    cc: [],
    bcc: [],
    headers: {},
    custom_args: {},
    metadata: {}
  };
  const templatePreview = getPostalTemplatePreview(
    testForm.template || "postal-admin-test"
  );
  const renderedTemplateHtml = (testForm.html || templatePreview.html || "").trim();
  const webhookCallbackPath = "/postal/webhooks";
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase();
  const filteredTemplateRows = postalTemplateReferenceRows.filter((row) => {
    const audienceMatches = templateAudienceFilter === "all" || row.audience === templateAudienceFilter;
    const searchMatches = normalizedTemplateSearch ? [
      row.template,
      row.purpose,
      row.audience,
      row.source,
      row.required,
      row.optional,
      row.event,
      row.notes
    ].join(" ").toLowerCase().includes(normalizedTemplateSearch) : true;
    return audienceMatches && searchMatches;
  });
  const checklistRows = [
    {
      key: "from",
      label: "Sender email",
      value: form.from || ""
    },
    {
      key: "base_url",
      label: "Postal base URL",
      value: form.base_url || ""
    },
    {
      key: "api_key",
      label: "API key",
      value: ((_a2 = data == null ? void 0 : data.configured) == null ? void 0 : _a2.api_key) ? "Set" : "Missing"
    }
  ];
  const parseJsonObject = (value, fieldLabel) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
    }
    throw new Error(fieldLabel);
  };
  const parseEmailList = (value) => value.split(",").map((entry) => entry.trim()).filter(Boolean);
  const copyTemplateExample = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(templateExampleForUi, null, 2)
      );
      ui.toast.success(t("postal.template_example_copied"));
    } catch {
      ui.toast.error(t("postal.template_example_copy_failed"));
    }
  };
  const loadTemplateExample = () => {
    setTestForm({
      to: "",
      cc: "",
      bcc: "",
      from_name: "",
      reply_to: "",
      template: testForm.template || "postal-admin-test",
      subject: templateExampleForUi.subject,
      text: templateExampleForUi.text,
      html: templateExampleForUi.html,
      headers_json: "{}",
      custom_args_json: "{}",
      metadata_json: "{}"
    });
  };
  const { data, refetch } = reactQuery.useQuery({
    queryKey: ["plugin-settings-postal"],
    queryFn: () => sdk.client.fetch("/admin/plugin-settings/postal")
  });
  const { data: webhookUrlData } = reactQuery.useQuery({
    queryKey: ["plugin-settings-postal-webhook-url"],
    queryFn: () => sdk.client.fetch("/admin/postal/webhook-url"),
    enabled: Boolean(data)
  });
  const webhookCallbackUrl = (webhookUrlData == null ? void 0 : webhookUrlData.callback_url) || webhookCallbackPath;
  react.useEffect(() => {
    if (!data) {
      return;
    }
    setForm({
      auth_type: "smtp-api",
      from: data.from || "",
      base_url: data.base_url || "",
      api_key: "",
      test_to: data.test_to || ""
    });
    setTestForm((prev) => ({
      ...prev,
      to: data.test_to || ""
    }));
  }, [data]);
  const saveMutation = reactQuery.useMutation({
    mutationFn: (payload) => sdk.client.fetch("/admin/plugin-settings/postal", {
      method: "POST",
      body: payload
    }),
    onSuccess: (res) => {
      const next = res == null ? void 0 : res.settings;
      setForm((prev) => ({
        ...prev,
        auth_type: "smtp-api",
        from: (next == null ? void 0 : next.from) || "",
        base_url: (next == null ? void 0 : next.base_url) || "",
        test_to: (next == null ? void 0 : next.test_to) || "",
        api_key: ""
      }));
      ui.toast.success(t("postal.toast.saved"));
      refetch();
    },
    onError: (err) => {
      ui.toast.error((err == null ? void 0 : err.message) || t("postal.toast.save_failed"));
    }
  });
  const testMutation = reactQuery.useMutation({
    mutationFn: (payload) => sdk.client.fetch("/admin/plugin-settings/postal", {
      method: "POST",
      body: payload
    }),
    onSuccess: (res) => {
      ui.toast.success(
        `${t("postal.toast.test_queued_prefix")} ${(res == null ? void 0 : res.to) || t("postal.recipient_fallback")}`
      );
      refetch();
    },
    onError: (err) => {
      ui.toast.error((err == null ? void 0 : err.message) || t("postal.toast.test_failed"));
    }
  });
  const isConfigured = (data == null ? void 0 : data.configured) && Object.values(data.configured).includes(true);
  const hasSavedApiKey = Boolean((_b = data == null ? void 0 : data.configured) == null ? void 0 : _b.api_key) || Boolean((_c = data == null ? void 0 : data.secret_hints) == null ? void 0 : _c.api_key_masked);
  const disabled = saveMutation.isPending || testMutation.isPending;
  const sendTestEmail = () => {
    try {
      const headers = parseJsonObject(
        testForm.headers_json,
        t("postal.invalid_headers_json")
      );
      const customArgs = parseJsonObject(
        testForm.custom_args_json,
        t("postal.invalid_custom_args_json")
      );
      const metadata = parseJsonObject(
        testForm.metadata_json,
        t("postal.invalid_metadata_json")
      );
      testMutation.mutate({
        action: "test",
        to: testForm.to.trim() || void 0,
        template: testForm.template || void 0,
        subject: testForm.subject.trim() || void 0,
        text: testForm.text.trim() || void 0,
        html: testForm.html.trim() || void 0,
        cc: parseEmailList(testForm.cc),
        bcc: parseEmailList(testForm.bcc),
        from_name: testForm.from_name.trim() || void 0,
        reply_to: testForm.reply_to.trim() || void 0,
        headers,
        custom_args: customArgs,
        metadata,
        settings: form
      });
    } catch (error) {
      ui.toast.error(
        error instanceof Error ? error.message : t("postal.invalid_example_json")
      );
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(PluginShell, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      PluginHeader,
      {
        title: t("postal.title"),
        description: t("postal.subtitle"),
        statusColor: isConfigured ? "green" : "grey",
        statusLabel: isConfigured ? t("postal.configured") : t("postal.not_configured"),
        lastSuccessfulExecution: t("postal.settings.runtime_notice"),
        helpLinks: [
          {
            label: t("postal.settings.help_postal"),
            href: "https://docs.postalserver.io/"
          },
          {
            label: t("postal.activity.help_webhooks"),
            href: "https://docs.postalserver.io/developer/webhooks"
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-4", children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          PluginSection,
          {
            title: t("postal.configuration"),
            description: "Postal API credentials, sender identity, and test recipient.",
            bodyClassName: "flex flex-col gap-4",
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid min-w-0 gap-3 md:grid-cols-3", children: [
                /* @__PURE__ */ jsxRuntime.jsx(SummaryCard, { label: "Delivery mode", value: "Postal API only" }),
                /* @__PURE__ */ jsxRuntime.jsx(
                  SummaryCard,
                  {
                    label: "Default test recipient",
                    value: form.test_to || t("postal.recipient_fallback")
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(SummaryCard, { label: "Webhook URL", value: webhookCallbackUrl })
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx(
                SettingsField,
                {
                  id: "postal-from",
                  label: t("postal.from_email"),
                  type: "email",
                  placeholder: t("postal.placeholder.from_email"),
                  value: form.from,
                  onChange: (value) => setForm((prev) => ({ ...prev, from: value })),
                  disabled
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4", children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  SettingsField,
                  {
                    id: "postal-base-url",
                    label: t("postal.base_url"),
                    placeholder: t("postal.placeholder.base_url"),
                    value: form.base_url,
                    onChange: (value) => setForm((prev) => ({ ...prev, base_url: value })),
                    disabled
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  SettingsField,
                  {
                    id: "postal-api-key",
                    label: t("postal.api_key"),
                    type: "password",
                    placeholder: ((_d = data == null ? void 0 : data.secret_hints) == null ? void 0 : _d.api_key_masked) || t("postal.masked_long"),
                    value: form.api_key,
                    onChange: (value) => setForm((prev) => ({ ...prev, api_key: value })),
                    disabled,
                    hint: ((_e = data == null ? void 0 : data.secret_hints) == null ? void 0 : _e.api_key_masked) ? `${t("postal.saved_key_prefix")} ${data.secret_hints.api_key_masked}. ${t("postal.saved_key_suffix")}` : hasSavedApiKey ? t("postal.api_key_saved_no_hint") : t("postal.no_api_key_saved")
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx(
                SettingsField,
                {
                  id: "postal-test-to-default",
                  label: t("postal.default_test_recipient"),
                  type: "email",
                  placeholder: t("postal.placeholder.test_recipient"),
                  value: form.test_to,
                  onChange: (value) => setForm((prev) => ({ ...prev, test_to: value })),
                  disabled,
                  hint: t("postal.default_test_recipient_hint")
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-stretch border-t pt-4 sm:justify-end", children: /* @__PURE__ */ jsxRuntime.jsx(
                ui.Button,
                {
                  variant: "primary",
                  size: "small",
                  onClick: () => saveMutation.mutate({ action: "save", settings: form }),
                  isLoading: saveMutation.isPending,
                  disabled,
                  className: "w-full sm:w-auto",
                  children: t("postal.save_changes")
                }
              ) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(PluginSidebarSection, { title: t("postal.webhook_callback"), children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-3", children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: "Postal should POST delivery and tracking events to this exact URL." }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
            /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-webhook-callback", children: t("postal.webhook_callback_url") }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center", children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                ui.Code,
                {
                  id: "postal-webhook-callback",
                  className: "block min-w-0 flex-1 whitespace-normal break-all",
                  children: webhookCallbackUrl
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                ui.Button,
                {
                  type: "button",
                  size: "small",
                  variant: "secondary",
                  onClick: async () => {
                    await navigator.clipboard.writeText(webhookCallbackUrl);
                    ui.toast.success(t("postal.webhook_callback_copied"));
                  },
                  disabled,
                  className: "w-full sm:w-auto",
                  children: t("postal.copy_callback_url")
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: "Keep this URL in Postal and do not paste it into the settings form." })
        ] }) }),
        (data == null ? void 0 : data.configured) && /* @__PURE__ */ jsxRuntime.jsx(PluginSidebarSection, { title: t("postal.active_config_checklist"), children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-3", children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: "The following values are saved and used by the provider at runtime." }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Body, { children: checklistRows.map((row) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: row.label }) }),
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { className: "text-right", children: row.key === "api_key" ? /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: data.configured.api_key ? "green" : "red", children: data.configured.api_key ? t("postal.set") : t("postal.missing") }) : /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "break-all", children: row.value || t("postal.missing") }) })
          ] }, row.key)) }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-4 xl:sticky xl:top-4", children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          PluginSection,
          {
            title: t("postal.template_preview"),
            description: templatePreview.description,
            bodyClassName: "flex flex-col gap-4",
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between", children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-y-1", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: templatePreview.label }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Text,
                    {
                      size: "small",
                      leading: "compact",
                      className: "max-w-2xl text-ui-fg-subtle",
                      children: templatePreview.description
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Button,
                    {
                      variant: "secondary",
                      size: "small",
                      onClick: copyTemplateExample,
                      disabled,
                      className: "w-full sm:w-auto",
                      children: t("postal.copy_example_values")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Button,
                    {
                      variant: "secondary",
                      size: "small",
                      onClick: loadTemplateExample,
                      disabled,
                      className: "w-full sm:w-auto",
                      children: t("postal.load_example_values")
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-template", children: t("postal.template") }),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  ui.Select,
                  {
                    value: testForm.template,
                    onValueChange: (v) => setTestForm((prev) => ({
                      ...prev,
                      template: v
                    })),
                    disabled,
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Trigger, { id: "postal-test-template", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Value, { placeholder: t("postal.template") }) }),
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Content, { children: templateOptions.map((option) => /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: option.value, children: option.label }, option.value)) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx("div", { className: "grid grid-cols-3 rounded-full border border-ui-border-base bg-ui-bg-subtle p-1 sm:inline-flex sm:w-fit", children: ["rendered", "source", "example"].map((mode) => /* @__PURE__ */ jsxRuntime.jsx(
                ui.Button,
                {
                  type: "button",
                  size: "small",
                  variant: previewMode === mode ? "primary" : "transparent",
                  onClick: () => setPreviewMode(mode),
                  className: "rounded-full",
                  children: mode === "rendered" ? "Rendered" : mode === "source" ? "Source" : "Example"
                },
                mode
              )) }),
              previewMode === "rendered" && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-sm", children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-3 border-b border-ui-border-base bg-ui-bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between", children: [
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: t("postal.template_rendered_preview") }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: t("postal.template_rendered_preview_hint")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { size: "small", color: "grey", className: "shrink-0", children: templatePreview.label })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border-b border-ui-border-base bg-ui-bg-subtle px-4 py-3", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-lg border border-ui-border-base bg-ui-bg-base p-3", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: t("postal.template_subject")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", className: "break-words", children: templatePreview.subject })
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-lg border border-ui-border-base bg-ui-bg-base p-3", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: t("postal.template_text")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "break-words", children: templatePreview.text || t("postal.template_empty") })
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-lg border border-ui-border-base bg-ui-bg-base p-3", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: t("postal.default_test_recipient")
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", className: "break-all", children: form.test_to || t("postal.recipient_fallback") })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-white", children: renderedTemplateHtml ? /* @__PURE__ */ jsxRuntime.jsx(
                  "iframe",
                  {
                    title: t("postal.template_rendered_preview"),
                    srcDoc: renderedTemplateHtml,
                    className: "h-[min(72vh,860px)] w-full bg-white",
                    sandbox: ""
                  }
                ) : /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex h-[420px] items-center justify-center p-6 text-center", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-subtle", children: t("postal.template_empty") }) }) })
              ] }),
              previewMode === "source" && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4", children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: t("postal.template_subject") }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { className: "mt-2 block whitespace-pre-wrap break-words", children: templatePreview.subject })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: t("postal.template_text") }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { className: "mt-2 block whitespace-pre-wrap break-words", children: templatePreview.text || t("postal.template_empty") })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: t("postal.template_html") }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { className: "mt-2 block max-h-[480px] overflow-auto whitespace-pre-wrap break-all", children: templatePreview.html || t("postal.template_empty") })
                ] })
              ] }),
              previewMode === "example" && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "grid gap-4", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4", children: [
                /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: t("postal.template_example") }),
                /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { className: "mt-2 block max-h-[720px] overflow-auto whitespace-pre-wrap break-all", children: JSON.stringify(templateExampleForUi, null, 2) })
              ] }) }),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4", children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: "Template contract" }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: "Required fields, optional fields, and source for each built-in template." })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { size: "small", color: "blue", className: "w-fit", children: "auth only" }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { size: "small", color: "green", className: "w-fit", children: "commerce only" }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { size: "small", color: "orange", className: "w-fit", children: "ops only" }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { size: "small", color: "grey", className: "w-fit", children: "shared fallback" })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-3 flex max-w-sm flex-col gap-y-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-template-audience-filter", children: "Filter by audience" }),
                  /* @__PURE__ */ jsxRuntime.jsxs(
                    ui.Select,
                    {
                      value: templateAudienceFilter,
                      onValueChange: (value) => setTemplateAudienceFilter(value),
                      children: [
                        /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Trigger, { id: "postal-template-audience-filter", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Value, { placeholder: "All templates" }) }),
                        /* @__PURE__ */ jsxRuntime.jsxs(ui.Select.Content, { children: [
                          /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: "all", children: "All templates" }),
                          /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: "auth", children: "Auth" }),
                          /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: "commerce", children: "Commerce" }),
                          /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: "ops", children: "Ops" }),
                          /* @__PURE__ */ jsxRuntime.jsx(ui.Select.Item, { value: "shared", children: "Shared" })
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-3 flex max-w-xl flex-col gap-y-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-template-search", children: "Search templates" }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Input,
                      {
                        id: "postal-template-search",
                        value: templateSearch,
                        onChange: (e) => setTemplateSearch(e.target.value),
                        placeholder: "Search by template, event, or purpose"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Button,
                      {
                        type: "button",
                        size: "small",
                        variant: "secondary",
                        onClick: () => setTemplateSearch(""),
                        disabled: !templateSearch,
                        className: "w-full sm:w-auto",
                        children: "Clear"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Button,
                      {
                        type: "button",
                        size: "small",
                        variant: "transparent",
                        onClick: () => {
                          setTemplateAudienceFilter("all");
                          setTemplateSearch("");
                        },
                        disabled: templateAudienceFilter === "all" && !templateSearch.trim(),
                        className: "w-full sm:w-auto",
                        children: "Reset filters"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: [
                    filteredTemplateRows.length,
                    " templates match the current filter."
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-3 overflow-x-auto rounded-lg border border-ui-border-base bg-white", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table, { className: "min-w-[920px]", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Body, { children: filteredTemplateRows.length ? filteredTemplateRows.map((row) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: row.template }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: row.purpose
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: "Required" }),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", children: row.required })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: "Optional" }),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", children: row.optional })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: "Source" }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Text,
                      {
                        size: "small",
                        leading: "compact",
                        className: "text-ui-fg-subtle",
                        children: row.source
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ui.Badge,
                      {
                        size: "small",
                        color: row.audience === "auth" ? "blue" : row.audience === "commerce" ? "green" : row.audience === "ops" ? "orange" : "grey",
                        className: "w-fit",
                        children: row.audience
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Code, { className: "block whitespace-pre-wrap break-words", children: row.event })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Text,
                    {
                      size: "small",
                      leading: "compact",
                      className: "text-ui-fg-subtle",
                      children: row.notes
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { className: "text-right", children: /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Button,
                    {
                      type: "button",
                      size: "small",
                      variant: "secondary",
                      onClick: () => {
                        setTestForm((prev) => ({
                          ...prev,
                          template: row.template
                        }));
                        setPreviewMode("rendered");
                      },
                      className: "whitespace-nowrap",
                      children: "Use template"
                    }
                  ) })
                ] }, row.template)) : /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Row, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { ...{ colSpan: 7 }, children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "py-6 text-center", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", weight: "plus", children: "No templates match the current filter." }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Text,
                    {
                      size: "small",
                      leading: "compact",
                      className: "mt-1 text-ui-fg-subtle",
                      children: "Clear or reset the filters to see the full Postal template set."
                    }
                  )
                ] }) }) }) }) }) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          PluginSection,
          {
            title: t("postal.test_connectivity"),
            description: t("postal.test_connectivity_hint"),
            bodyClassName: "flex flex-col gap-4",
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2 md:col-span-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-to", children: t("postal.recipient_address") }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Input,
                    {
                      id: "postal-test-to",
                      type: "email",
                      placeholder: t("postal.placeholder.customer_email"),
                      value: testForm.to,
                      onChange: (e) => setTestForm((prev) => ({ ...prev, to: e.target.value })),
                      disabled
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2 md:col-span-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-subject", children: t("postal.template_subject") }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ui.Input,
                    {
                      id: "postal-test-subject",
                      placeholder: t("postal.template_subject"),
                      value: testForm.subject,
                      onChange: (e) => setTestForm((prev) => ({
                        ...prev,
                        subject: e.target.value
                      })),
                      disabled
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntime.jsxs("details", { className: "rounded-xl border border-ui-border-base bg-ui-bg-subtle", children: [
                /* @__PURE__ */ jsxRuntime.jsx("summary", { className: "cursor-pointer px-4 py-3 text-sm font-medium text-ui-fg-base", children: "Advanced payload" }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4 border-t border-ui-border-base p-4", children: [
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-from-name", children: t("postal.sender_name") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        ui.Input,
                        {
                          id: "postal-test-from-name",
                          placeholder: t("postal.placeholder.sender_name"),
                          value: testForm.from_name,
                          onChange: (e) => setTestForm((prev) => ({
                            ...prev,
                            from_name: e.target.value
                          })),
                          disabled
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-reply-to", children: t("postal.reply_to") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        ui.Input,
                        {
                          id: "postal-test-reply-to",
                          type: "email",
                          placeholder: t("postal.placeholder.reply_to"),
                          value: testForm.reply_to,
                          onChange: (e) => setTestForm((prev) => ({
                            ...prev,
                            reply_to: e.target.value
                          })),
                          disabled
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-cc", children: t("postal.cc") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        ui.Input,
                        {
                          id: "postal-test-cc",
                          placeholder: t("postal.placeholder.recipients_list"),
                          value: testForm.cc,
                          onChange: (e) => setTestForm((prev) => ({ ...prev, cc: e.target.value })),
                          disabled
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-bcc", children: t("postal.bcc") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        ui.Input,
                        {
                          id: "postal-test-bcc",
                          placeholder: t("postal.placeholder.recipients_list"),
                          value: testForm.bcc,
                          onChange: (e) => setTestForm((prev) => ({ ...prev, bcc: e.target.value })),
                          disabled
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-text", children: t("postal.template_text") }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "textarea",
                      {
                        id: "postal-test-text",
                        placeholder: t("postal.template_text"),
                        value: testForm.text,
                        onChange: (e) => setTestForm((prev) => ({
                          ...prev,
                          text: e.target.value
                        })),
                        disabled,
                        rows: 4,
                        className: toTextareaClassName
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-html", children: t("postal.template_html") }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "textarea",
                      {
                        id: "postal-test-html",
                        placeholder: t("postal.template_html"),
                        value: testForm.html,
                        onChange: (e) => setTestForm((prev) => ({
                          ...prev,
                          html: e.target.value
                        })),
                        disabled,
                        rows: 8,
                        className: toTextareaClassName
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-headers", children: t("postal.headers") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        "textarea",
                        {
                          id: "postal-test-headers",
                          placeholder: t("postal.headers_placeholder"),
                          value: testForm.headers_json,
                          onChange: (e) => setTestForm((prev) => ({
                            ...prev,
                            headers_json: e.target.value
                          })),
                          disabled,
                          rows: 6,
                          className: toTextareaClassName
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                      /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-custom-args", children: t("postal.custom_args") }),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        "textarea",
                        {
                          id: "postal-test-custom-args",
                          placeholder: t("postal.custom_args_placeholder"),
                          value: testForm.custom_args_json,
                          onChange: (e) => setTestForm((prev) => ({
                            ...prev,
                            custom_args_json: e.target.value
                          })),
                          disabled,
                          rows: 6,
                          className: toTextareaClassName
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "postal-test-metadata", children: t("postal.metadata") }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "textarea",
                      {
                        id: "postal-test-metadata",
                        placeholder: t("postal.metadata_placeholder"),
                        value: testForm.metadata_json,
                        onChange: (e) => setTestForm((prev) => ({
                          ...prev,
                          metadata_json: e.target.value
                        })),
                        disabled,
                        rows: 6,
                        className: toTextareaClassName
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [
                /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", leading: "compact", className: "text-ui-fg-subtle", children: selectedTemplate == null ? void 0 : selectedTemplate.description }),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  ui.Button,
                  {
                    variant: "secondary",
                    size: "small",
                    onClick: sendTestEmail,
                    isLoading: testMutation.isPending,
                    disabled,
                    className: "w-full md:w-auto",
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(icons.PaperPlane, {}),
                      t("postal.send_test_email")
                    ]
                  }
                )
              ] })
            ]
          }
        )
      ] })
    ] })
  ] });
};
const PostalPluginSettingsRedirect = () => /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Navigate, { to: "/settings/postal", replace: true });
const config = adminSdk.defineRouteConfig({
  label: "Postal",
  icon: function PostalRouteIcon2() {
    return /* @__PURE__ */ jsxRuntime.jsxs("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "15", height: "15", fill: "#F43F5E" }),
      /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "15", height: "15", fill: "url(#postal-settings-icon-gradient)", fillOpacity: "0.2" }),
      /* @__PURE__ */ jsxRuntime.jsxs("g", { transform: "translate(2 2) scale(0.7)", stroke: "white", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M11.829 4.398a2.82 2.82 0 0 1 1.511 2.498v4.028c0 .444-.36.805-.805.805H6.493M4.48 4.077h4.832" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.48 4.077a2.82 2.82 0 0 1 2.819 2.82v4.027c0 .444-.361.805-.806.805H2.465a.806.806 0 0 1-.805-.805V6.896a2.82 2.82 0 0 1 2.82-2.82M7.299 11.528v1.812M4.48 6.896v1.208" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { fill: "white", d: "M11.73.854H9.311v1.209h2.417z" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M9.313 5.285V1.86" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("defs", { children: /* @__PURE__ */ jsxRuntime.jsxs("linearGradient", { id: "postal-settings-icon-gradient", x1: "7.5", y1: "0", x2: "7.5", y2: "15", gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxRuntime.jsx("stop", { stopColor: "white" }),
        /* @__PURE__ */ jsxRuntime.jsx("stop", { offset: "1", stopColor: "white", stopOpacity: "0" })
      ] }) })
    ] });
  }
});
const widgetModule = { widgets: [] };
const routeModule = {
  routes: [
    {
      Component: PostalAdminPage,
      path: "/postal"
    },
    {
      Component: PostalPluginSettingsRedirect,
      path: "/plugin-settings/postal"
    },
    {
      Component: PostalSettingsPage,
      path: "/settings/postal"
    }
  ]
};
const menuItemModule = {
  menuItems: [
    {
      label: config$1.label,
      icon: config$1.icon,
      path: "/postal",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    },
    {
      label: config.label,
      icon: config.icon,
      path: "/settings/postal",
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
const i18nModule = { resources: i18nTranslations0 };
const plugin = {
  widgetModule,
  routeModule,
  menuItemModule,
  formModule,
  displayModule,
  i18nModule
};
module.exports = plugin;

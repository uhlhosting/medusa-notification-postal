import {
  Badge,
  Button,
  Code,
  Input,
  Label,
  Select,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { PaperPlane } from "@medusajs/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import {
  PluginHeader,
  PluginSection,
  PluginSidebarSection,
  PluginShell,
} from "../../../components/admin-ui";
import { sdk } from "../../../lib/client";
import { ensurePostalAdminTranslations } from "../../../lib/i18n";
import {
  getPostalTemplateExample,
  getPostalTemplateOptions,
  getPostalTemplatePreview,
  type PostalTemplateName,
} from "../../../../providers/postal/templates";

type PostalSettingsForm = {
  auth_type: "smtp-api";
  from: string;
  base_url: string;
  api_key: string;
  test_to: string;
};

type PostalTestForm = {
  to: string;
  cc: string;
  bcc: string;
  from_name: string;
  reply_to: string;
  template: string;
  subject: string;
  text: string;
  html: string;
  headers_json: string;
  custom_args_json: string;
  metadata_json: string;
};

type PreviewMode = "rendered" | "source" | "example";

const emptyForm: PostalSettingsForm = {
  auth_type: "smtp-api",
  from: "",
  base_url: "",
  api_key: "",
  test_to: "",
};

const emptyTestForm: PostalTestForm = {
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
  metadata_json: "{}",
};

const toTextareaClassName =
  "min-h-[160px] rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive";

type PostalTemplateReferenceRow = {
  template: PostalTemplateName | "default";
  purpose: string;
  audience: "auth" | "commerce" | "ops" | "shared";
  source: "Medusa native event" | "Postal plugin native" | "Project workflow";
  required: string;
  optional: string;
  event: string;
  notes: string;
};

type PostalTemplateAudienceFilter = "all" | PostalTemplateReferenceRow["audience"];

type SummaryCardProps = {
  label: string;
  value: string;
};

const SummaryCard = ({ label, value }: SummaryCardProps) => (
  <div className="min-w-0 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="small" leading="compact" weight="plus" className="break-words">
      {value}
    </Text>
  </div>
)

type SettingsFieldProps = {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled: boolean;
  hint?: string;
  id: string;
}

const SettingsField = ({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
  disabled,
  hint,
  id,
}: SettingsFieldProps) => (
  <div className="flex flex-col gap-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
    {hint ? (
      <Text size="small" leading="compact" className="break-words text-ui-fg-subtle">
        {hint}
      </Text>
    ) : null}
  </div>
)

const postalTemplateReferenceRows: PostalTemplateReferenceRow[] = [
  {
    template: "default",
    purpose: "Generic fallback preview",
    audience: "shared",
    source: "Postal plugin native",
    required: "subject, html or text",
    optional: "template-specific content",
    event: "Any custom template",
    notes: "Used when a workflow provides custom content but no known template key.",
  },
  {
    template: "postal-test",
    purpose: "Provider transport validation",
    audience: "ops",
    source: "Postal plugin native",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "postal.example.test",
    notes: "Use for live transport checks and operator testing.",
  },
  {
    template: "postal-admin-test",
    purpose: "Admin settings validation",
    audience: "ops",
    source: "Postal plugin native",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "admin.postal.test",
    notes: "Used by the admin test-send panel.",
  },
  {
    template: "order-placed",
    purpose: "Order confirmation",
    audience: "commerce",
    source: "Medusa native event",
    required: "order id, customer, items, currency, storefront URL",
    optional: "billing/shipping address, support URL, metadata, custom_args",
    event: "order.placed",
    notes: "Shared customer order notification.",
  },
  {
    template: "password-reset",
    purpose: "Password reset",
    audience: "auth",
    source: "Medusa native event",
    required: "reset token or reset link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.password_reset",
    notes: "Shared auth flow email.",
  },
  {
    template: "email-verification",
    purpose: "Email verification",
    audience: "auth",
    source: "Medusa native event",
    required: "verification token or verification link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.email_verification",
    notes: "Shared auth flow email.",
  },
  {
    template: "welcome",
    purpose: "Customer onboarding",
    audience: "commerce",
    source: "Medusa native event",
    required: "customer name or customer context, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.welcome",
    notes: "Shared first-contact and onboarding mail.",
  },
  {
    template: "abandoned-cart",
    purpose: "Cart recovery",
    audience: "commerce",
    source: "Project workflow",
    required: "cart id, cart items, recovery link, subject, html/text",
    optional: "locale, customer name, total, currency, support URL, metadata, custom_args",
    event: "cart.abandoned",
    notes: "Shared recovery reminder.",
  },
  {
    template: "restock-available",
    purpose: "Back-in-stock alert",
    audience: "commerce",
    source: "Project workflow",
    required: "product title, product link, subject, html/text",
    optional: "customer name, product handle, locale, metadata, custom_args",
    event: "restock.available",
    notes: "Shared inventory notification.",
  },
];

export const PostalSettingsPage = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();
  const [form, setForm] = useState<PostalSettingsForm>(emptyForm);
  const [testForm, setTestForm] = useState<PostalTestForm>(emptyTestForm);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("rendered");
  const [templateAudienceFilter, setTemplateAudienceFilter] =
    useState<PostalTemplateAudienceFilter>("all");
  const [templateSearch, setTemplateSearch] = useState("");

  const templateOptions = getPostalTemplateOptions();
  const selectedTemplate = templateOptions.find(
    (option) => option.value === testForm.template,
  );
  const templateExample = getPostalTemplateExample(
    (testForm.template || "postal-admin-test") as PostalTemplateName,
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
    metadata: {},
  };
  const templatePreview = getPostalTemplatePreview(
    (testForm.template || "postal-admin-test") as PostalTemplateName,
  );
  const renderedTemplateHtml = (testForm.html || templatePreview.html || "").trim();
  const webhookCallbackPath = "/postal/webhooks";
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase();
  const filteredTemplateRows = postalTemplateReferenceRows.filter((row) => {
    const audienceMatches =
      templateAudienceFilter === "all" || row.audience === templateAudienceFilter;
    const searchMatches = normalizedTemplateSearch
      ? [
          row.template,
          row.purpose,
          row.audience,
          row.source,
          row.required,
          row.optional,
          row.event,
          row.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedTemplateSearch)
      : true;

    return audienceMatches && searchMatches;
  });

  const checklistRows = [
    {
      key: "from",
      label: "Sender email",
      value: form.from || "",
    },
    {
      key: "base_url",
      label: "Postal base URL",
      value: form.base_url || "",
    },
    {
      key: "api_key",
      label: "API key",
      value: data?.configured?.api_key ? "Set" : "Missing",
    },
  ];

  const parseJsonObject = (value: string, fieldLabel: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through below
    }

    throw new Error(fieldLabel);
  };

  const parseEmailList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  const copyTemplateExample = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(templateExampleForUi, null, 2),
      );
      toast.success(t("postal.template_example_copied"));
    } catch {
      toast.error(t("postal.template_example_copy_failed"));
    }
  };

  const loadTemplateExample = () => {
    setTestForm({
      to: "",
      cc: "",
      bcc: "",
      from_name: "",
      reply_to: "",
      template: (testForm.template || "postal-admin-test") as PostalTemplateName,
      subject: templateExampleForUi.subject,
      text: templateExampleForUi.text,
      html: templateExampleForUi.html,
      headers_json: "{}",
      custom_args_json: "{}",
      metadata_json: "{}",
    });
  };

  const { data, refetch } = useQuery<any>({
    queryKey: ["plugin-settings-postal"],
    queryFn: () => sdk.client.fetch("/admin/plugin-settings/postal"),
  });

  const { data: webhookUrlData } = useQuery<any>({
    queryKey: ["plugin-settings-postal-webhook-url"],
    queryFn: () => sdk.client.fetch("/admin/postal/webhook-url"),
    enabled: Boolean(data),
  });
  const webhookCallbackUrl =
    webhookUrlData?.callback_url || webhookCallbackPath;

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      auth_type: "smtp-api",
      from: data.from || "",
      base_url: data.base_url || "",
      api_key: "",
      test_to: data.test_to || "",
    });
    setTestForm((prev) => ({
      ...prev,
      to: data.test_to || "",
    }));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: { action: "save"; settings: PostalSettingsForm }) =>
      sdk.client.fetch("/admin/plugin-settings/postal", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res: any) => {
      const next = res?.settings;
      setForm((prev) => ({
        ...prev,
        auth_type: "smtp-api",
        from: next?.from || "",
        base_url: next?.base_url || "",
        test_to: next?.test_to || "",
        api_key: "",
      }));
      toast.success(t("postal.toast.saved"));
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || t("postal.toast.save_failed"));
    },
  });

  const testMutation = useMutation({
    mutationFn: (payload: {
      action: "test";
      to?: string;
      cc?: string[];
      bcc?: string[];
      from_name?: string;
      reply_to?: string;
      template?: string;
      subject?: string;
      text?: string;
      html?: string;
      headers?: Record<string, string>;
      custom_args?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      settings: PostalSettingsForm;
    }) =>
      sdk.client.fetch("/admin/plugin-settings/postal", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res: any) => {
      toast.success(
        `${t("postal.toast.test_queued_prefix")} ${res?.to || t("postal.recipient_fallback")}`,
      );
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || t("postal.toast.test_failed"));
    },
  });

  const isConfigured =
    data?.configured && Object.values(data.configured).includes(true);
  const hasSavedApiKey =
    Boolean(data?.configured?.api_key) || Boolean(data?.secret_hints?.api_key_masked);
  const disabled = saveMutation.isPending || testMutation.isPending;

  const sendTestEmail = () => {
    try {
      const headers = parseJsonObject(
        testForm.headers_json,
        t("postal.invalid_headers_json"),
      ) as Record<string, string>;
      const customArgs = parseJsonObject(
        testForm.custom_args_json,
        t("postal.invalid_custom_args_json"),
      );
      const metadata = parseJsonObject(
        testForm.metadata_json,
        t("postal.invalid_metadata_json"),
      );

      testMutation.mutate({
        action: "test",
        to: testForm.to.trim() || undefined,
        template: testForm.template || undefined,
        subject: testForm.subject.trim() || undefined,
        text: testForm.text.trim() || undefined,
        html: testForm.html.trim() || undefined,
        cc: parseEmailList(testForm.cc),
        bcc: parseEmailList(testForm.bcc),
        from_name: testForm.from_name.trim() || undefined,
        reply_to: testForm.reply_to.trim() || undefined,
        headers,
        custom_args: customArgs,
        metadata,
        settings: form,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("postal.invalid_example_json"),
      );
    }
  };

  return (
    <PluginShell>
      <PluginHeader
        title={t("postal.title")}
        description={t("postal.subtitle")}
        statusColor={isConfigured ? "green" : "grey"}
        statusLabel={
          isConfigured ? t("postal.configured") : t("postal.not_configured")
        }
        lastSuccessfulExecution={t("postal.settings.runtime_notice")}
        helpLinks={[
          {
            label: t("postal.settings.help_postal"),
            href: "https://docs.postalserver.io/",
          },
          {
            label: t("postal.activity.help_webhooks"),
            href: "https://docs.postalserver.io/developer/webhooks",
          },
        ]}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <PluginSection
            title={t("postal.configuration")}
            description="Postal API credentials, sender identity, and test recipient."
            bodyClassName="flex flex-col gap-4"
          >
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              <SummaryCard label="Delivery mode" value="Postal API only" />
              <SummaryCard
                label="Default test recipient"
                value={form.test_to || t("postal.recipient_fallback")}
              />
              <SummaryCard label="Webhook URL" value={webhookCallbackUrl} />
            </div>
            <SettingsField
              id="postal-from"
              label={t("postal.from_email")}
              type="email"
              placeholder={t("postal.placeholder.from_email")}
              value={form.from}
              onChange={(value) => setForm((prev) => ({ ...prev, from: value }))}
              disabled={disabled}
            />
            <div className="grid gap-4">
              <SettingsField
                id="postal-base-url"
                label={t("postal.base_url")}
                placeholder={t("postal.placeholder.base_url")}
                value={form.base_url}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, base_url: value }))
                }
                disabled={disabled}
              />
              <SettingsField
                id="postal-api-key"
                label={t("postal.api_key")}
                type="password"
                placeholder={
                  data?.secret_hints?.api_key_masked || t("postal.masked_long")
                }
                value={form.api_key}
                onChange={(value) => setForm((prev) => ({ ...prev, api_key: value }))}
                disabled={disabled}
                hint={
                  data?.secret_hints?.api_key_masked
                    ? `${t("postal.saved_key_prefix")} ${data.secret_hints.api_key_masked}. ${t("postal.saved_key_suffix")}`
                    : hasSavedApiKey
                      ? t("postal.api_key_saved_no_hint")
                    : t("postal.no_api_key_saved")
                }
              />
            </div>
            <SettingsField
              id="postal-test-to-default"
              label={t("postal.default_test_recipient")}
              type="email"
              placeholder={t("postal.placeholder.test_recipient")}
              value={form.test_to}
              onChange={(value) => setForm((prev) => ({ ...prev, test_to: value }))}
              disabled={disabled}
              hint={t("postal.default_test_recipient_hint")}
            />

            <div className="flex justify-stretch border-t pt-4 sm:justify-end">
              <Button
                variant="primary"
                size="small"
                onClick={() =>
                  saveMutation.mutate({ action: "save", settings: form })
                }
                isLoading={saveMutation.isPending}
                disabled={disabled}
                className="w-full sm:w-auto"
              >
                {t("postal.save_changes")}
              </Button>
            </div>
          </PluginSection>

          <PluginSidebarSection title={t("postal.webhook_callback")}>
            <div className="flex flex-col gap-y-3">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Postal should POST delivery and tracking events to this exact URL.
              </Text>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="postal-webhook-callback">
                  {t("postal.webhook_callback_url")}
                </Label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <Code
                    id="postal-webhook-callback"
                    className="block min-w-0 flex-1 whitespace-normal break-all"
                  >
                    {webhookCallbackUrl}
                  </Code>
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(webhookCallbackUrl);
                      toast.success(t("postal.webhook_callback_copied"));
                    }}
                    disabled={disabled}
                    className="w-full sm:w-auto"
                  >
                    {t("postal.copy_callback_url")}
                  </Button>
                </div>
              </div>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Keep this URL in Postal and do not paste it into the settings form.
              </Text>
            </div>
          </PluginSidebarSection>

          {data?.configured && (
            <PluginSidebarSection title={t("postal.active_config_checklist")}>
              <div className="flex flex-col gap-y-3">
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  The following values are saved and used by the provider at runtime.
                </Text>
                <div className="overflow-x-auto">
                <Table>
                  <Table.Body>
                    {checklistRows.map((row) => (
                      <Table.Row key={row.key}>
                          <Table.Cell>
                            <Text size="small" leading="compact" weight="plus">
                              {row.label}
                            </Text>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            {row.key === "api_key" ? (
                              <StatusBadge color={data.configured.api_key ? "green" : "red"}>
                                {data.configured.api_key ? t("postal.set") : t("postal.missing")}
                              </StatusBadge>
                            ) : (
                              <Text size="small" leading="compact" className="break-all">
                                {row.value || t("postal.missing")}
                              </Text>
                            )}
                          </Table.Cell>
                        </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
                </div>
              </div>
            </PluginSidebarSection>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4">
          <PluginSection
            title={t("postal.template_preview")}
            description={templatePreview.description}
            bodyClassName="flex flex-col gap-4"
          >
            <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-y-1">
                <Text size="small" leading="compact" weight="plus">
                  {templatePreview.label}
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="max-w-2xl text-ui-fg-subtle"
                >
                  {templatePreview.description}
                </Text>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={copyTemplateExample}
                  disabled={disabled}
                  className="w-full sm:w-auto"
                >
                  {t("postal.copy_example_values")}
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={loadTemplateExample}
                  disabled={disabled}
                  className="w-full sm:w-auto"
                >
                  {t("postal.load_example_values")}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="postal-test-template">{t("postal.template")}</Label>
                <Select
                  value={testForm.template}
                  onValueChange={(v) =>
                    setTestForm((prev) => ({
                      ...prev,
                      template: v,
                    }))
                  }
                  disabled={disabled}
                >
                <Select.Trigger id="postal-test-template">
                  <Select.Value placeholder={t("postal.template")} />
                </Select.Trigger>
                <Select.Content>
                  {templateOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="grid grid-cols-3 rounded-full border border-ui-border-base bg-ui-bg-subtle p-1 sm:inline-flex sm:w-fit">
              {(["rendered", "source", "example"] as PreviewMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="small"
                  variant={previewMode === mode ? "primary" : "transparent"}
                  onClick={() => setPreviewMode(mode)}
                  className="rounded-full"
                >
                  {mode === "rendered" ? "Rendered" : mode === "source" ? "Source" : "Example"}
                </Button>
              ))}
            </div>

            {previewMode === "rendered" && (
              <div className="overflow-hidden rounded-xl border border-ui-border-base bg-white shadow-sm">
                <div className="flex min-w-0 flex-col gap-3 border-b border-ui-border-base bg-ui-bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-y-1">
                    <Text size="small" leading="compact" weight="plus">
                      {t("postal.template_rendered_preview")}
                    </Text>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {t("postal.template_rendered_preview_hint")}
                    </Text>
                  </div>
                  <Badge size="small" color="grey" className="shrink-0">
                    {templatePreview.label}
                  </Badge>
                </div>
                <div className="border-b border-ui-border-base bg-ui-bg-subtle px-4 py-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3">
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {t("postal.template_subject")}
                      </Text>
                      <Text size="small" leading="compact" weight="plus" className="break-words">
                        {templatePreview.subject}
                      </Text>
                    </div>
                    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3">
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {t("postal.template_text")}
                      </Text>
                      <Text size="small" leading="compact" className="break-words">
                        {templatePreview.text || t("postal.template_empty")}
                      </Text>
                    </div>
                    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3">
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {t("postal.default_test_recipient")}
                      </Text>
                      <Text size="small" leading="compact" weight="plus" className="break-all">
                        {form.test_to || t("postal.recipient_fallback")}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="bg-white">
                  {renderedTemplateHtml ? (
                    <iframe
                      title={t("postal.template_rendered_preview")}
                      srcDoc={renderedTemplateHtml}
                      className="h-[min(72vh,860px)] w-full bg-white"
                      sandbox=""
                    />
                  ) : (
                    <div className="flex h-[420px] items-center justify-center p-6 text-center">
                      <Text size="small" className="text-ui-fg-subtle">
                        {t("postal.template_empty")}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}

            {previewMode === "source" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text size="small" leading="compact" weight="plus">
                    {t("postal.template_subject")}
                  </Text>
                  <Code className="mt-2 block whitespace-pre-wrap break-words">
                    {templatePreview.subject}
                  </Code>
                </div>
                <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text size="small" leading="compact" weight="plus">
                    {t("postal.template_text")}
                  </Text>
                  <Code className="mt-2 block whitespace-pre-wrap break-words">
                    {templatePreview.text || t("postal.template_empty")}
                  </Code>
                </div>
                <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text size="small" leading="compact" weight="plus">
                    {t("postal.template_html")}
                  </Text>
                  <Code className="mt-2 block max-h-[480px] overflow-auto whitespace-pre-wrap break-all">
                    {templatePreview.html || t("postal.template_empty")}
                  </Code>
                </div>
              </div>
            )}

            {previewMode === "example" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text size="small" leading="compact" weight="plus">
                    {t("postal.template_example")}
                  </Text>
                  <Code className="mt-2 block max-h-[720px] overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(templateExampleForUi, null, 2)}
                  </Code>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
              <div className="flex flex-col gap-y-1">
                <Text size="small" leading="compact" weight="plus">
                  Template contract
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Required fields, optional fields, and source for each built-in template.
                </Text>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge size="small" color="blue" className="w-fit">
                  auth only
                </Badge>
                <Badge size="small" color="green" className="w-fit">
                  commerce only
                </Badge>
                <Badge size="small" color="orange" className="w-fit">
                  ops only
                </Badge>
                <Badge size="small" color="grey" className="w-fit">
                  shared fallback
                </Badge>
              </div>
              <div className="mt-3 flex max-w-sm flex-col gap-y-2">
                <Label htmlFor="postal-template-audience-filter">
                  Filter by audience
                </Label>
                <Select
                  value={templateAudienceFilter}
                  onValueChange={(value) =>
                    setTemplateAudienceFilter(value as PostalTemplateAudienceFilter)
                  }
                >
                  <Select.Trigger id="postal-template-audience-filter">
                    <Select.Value placeholder="All templates" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="all">All templates</Select.Item>
                    <Select.Item value="auth">Auth</Select.Item>
                    <Select.Item value="commerce">Commerce</Select.Item>
                    <Select.Item value="ops">Ops</Select.Item>
                    <Select.Item value="shared">Shared</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="mt-3 flex max-w-xl flex-col gap-y-2">
                <Label htmlFor="postal-template-search">Search templates</Label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="postal-template-search"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search by template, event, or purpose"
                  />
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={() => setTemplateSearch("")}
                    disabled={!templateSearch}
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant="transparent"
                    onClick={() => {
                      setTemplateAudienceFilter("all");
                      setTemplateSearch("");
                    }}
                    disabled={
                      templateAudienceFilter === "all" && !templateSearch.trim()
                    }
                    className="w-full sm:w-auto"
                  >
                    Reset filters
                  </Button>
                </div>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {filteredTemplateRows.length} templates match the current filter.
                </Text>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-ui-border-base bg-white">
                <Table className="min-w-[920px]">
                  <Table.Body>
                    {filteredTemplateRows.length ? (
                      filteredTemplateRows.map((row) => (
                        <Table.Row key={row.template}>
                          <Table.Cell>
                            <div className="flex flex-col gap-y-1">
                              <Text size="small" leading="compact" weight="plus">
                                {row.template}
                              </Text>
                              <Text
                                size="small"
                                leading="compact"
                                className="text-ui-fg-subtle"
                              >
                                {row.purpose}
                              </Text>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-col gap-y-1">
                              <Text size="small" leading="compact" weight="plus">
                                Required
                              </Text>
                              <Text size="small" leading="compact">
                                {row.required}
                              </Text>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-col gap-y-1">
                              <Text size="small" leading="compact" weight="plus">
                                Optional
                              </Text>
                              <Text size="small" leading="compact">
                                {row.optional}
                              </Text>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-col gap-y-1">
                              <Text size="small" leading="compact" weight="plus">
                                Source
                              </Text>
                              <Text
                                size="small"
                                leading="compact"
                                className="text-ui-fg-subtle"
                              >
                                {row.source}
                              </Text>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-col gap-y-1">
                              <Badge
                                size="small"
                                color={
                                  row.audience === "auth"
                                    ? "blue"
                                    : row.audience === "commerce"
                                      ? "green"
                                      : row.audience === "ops"
                                        ? "orange"
                                        : "grey"
                                }
                                className="w-fit"
                              >
                                {row.audience}
                              </Badge>
                              <Code className="block whitespace-pre-wrap break-words">
                                {row.event}
                              </Code>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Text
                              size="small"
                              leading="compact"
                              className="text-ui-fg-subtle"
                            >
                              {row.notes}
                            </Text>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <Button
                              type="button"
                              size="small"
                              variant="secondary"
                              onClick={() => {
                                setTestForm((prev) => ({
                                  ...prev,
                                  template: row.template,
                                }));
                                setPreviewMode("rendered");
                              }}
                              className="whitespace-nowrap"
                            >
                              Use template
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell {...({ colSpan: 7 } as { colSpan?: number })}>
                          <div className="py-6 text-center">
                            <Text size="small" leading="compact" weight="plus">
                              No templates match the current filter.
                            </Text>
                            <Text
                              size="small"
                              leading="compact"
                              className="mt-1 text-ui-fg-subtle"
                            >
                              Clear or reset the filters to see the full Postal template set.
                            </Text>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </PluginSection>

          <PluginSection
            title={t("postal.test_connectivity")}
            description={t("postal.test_connectivity_hint")}
            bodyClassName="flex flex-col gap-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-y-2 md:col-span-2">
                <Label htmlFor="postal-test-to">{t("postal.recipient_address")}</Label>
                <Input
                  id="postal-test-to"
                  type="email"
                  placeholder={t("postal.placeholder.customer_email")}
                  value={testForm.to}
                  onChange={(e) =>
                    setTestForm((prev) => ({ ...prev, to: e.target.value }))
                  }
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-y-2 md:col-span-2">
                <Label htmlFor="postal-test-subject">
                  {t("postal.template_subject")}
                </Label>
                <Input
                  id="postal-test-subject"
                  placeholder={t("postal.template_subject")}
                  value={testForm.subject}
                  onChange={(e) =>
                    setTestForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
            </div>

            <details className="rounded-xl border border-ui-border-base bg-ui-bg-subtle">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ui-fg-base">
                Advanced payload
              </summary>
              <div className="grid gap-4 border-t border-ui-border-base p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-from-name">
                      {t("postal.sender_name")}
                    </Label>
                    <Input
                      id="postal-test-from-name"
                      placeholder={t("postal.placeholder.sender_name")}
                      value={testForm.from_name}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          from_name: e.target.value,
                        }))
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-reply-to">
                      {t("postal.reply_to")}
                    </Label>
                    <Input
                      id="postal-test-reply-to"
                      type="email"
                      placeholder={t("postal.placeholder.reply_to")}
                      value={testForm.reply_to}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          reply_to: e.target.value,
                        }))
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-cc">{t("postal.cc")}</Label>
                    <Input
                      id="postal-test-cc"
                      placeholder={t("postal.placeholder.recipients_list")}
                      value={testForm.cc}
                      onChange={(e) =>
                        setTestForm((prev) => ({ ...prev, cc: e.target.value }))
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-bcc">{t("postal.bcc")}</Label>
                    <Input
                      id="postal-test-bcc"
                      placeholder={t("postal.placeholder.recipients_list")}
                      value={testForm.bcc}
                      onChange={(e) =>
                        setTestForm((prev) => ({ ...prev, bcc: e.target.value }))
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-text">{t("postal.template_text")}</Label>
                  <textarea
                    id="postal-test-text"
                    placeholder={t("postal.template_text")}
                    value={testForm.text}
                    onChange={(e) =>
                      setTestForm((prev) => ({
                        ...prev,
                        text: e.target.value,
                      }))
                    }
                    disabled={disabled}
                    rows={4}
                    className={toTextareaClassName}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-html">{t("postal.template_html")}</Label>
                  <textarea
                    id="postal-test-html"
                    placeholder={t("postal.template_html")}
                    value={testForm.html}
                    onChange={(e) =>
                      setTestForm((prev) => ({
                        ...prev,
                        html: e.target.value,
                      }))
                    }
                    disabled={disabled}
                    rows={8}
                    className={toTextareaClassName}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-headers">
                      {t("postal.headers")}
                    </Label>
                    <textarea
                      id="postal-test-headers"
                      placeholder={t("postal.headers_placeholder")}
                      value={testForm.headers_json}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          headers_json: e.target.value,
                        }))
                      }
                      disabled={disabled}
                      rows={6}
                      className={toTextareaClassName}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="postal-test-custom-args">
                      {t("postal.custom_args")}
                    </Label>
                    <textarea
                      id="postal-test-custom-args"
                      placeholder={t("postal.custom_args_placeholder")}
                      value={testForm.custom_args_json}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          custom_args_json: e.target.value,
                        }))
                      }
                      disabled={disabled}
                      rows={6}
                      className={toTextareaClassName}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-metadata">{t("postal.metadata")}</Label>
                  <textarea
                    id="postal-test-metadata"
                    placeholder={t("postal.metadata_placeholder")}
                    value={testForm.metadata_json}
                    onChange={(e) =>
                      setTestForm((prev) => ({
                        ...prev,
                        metadata_json: e.target.value,
                      }))
                    }
                    disabled={disabled}
                    rows={6}
                    className={toTextareaClassName}
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {selectedTemplate?.description}
              </Text>
              <Button
                variant="secondary"
                size="small"
                onClick={sendTestEmail}
                isLoading={testMutation.isPending}
                disabled={disabled}
                className="w-full md:w-auto"
              >
                <PaperPlane />
                {t("postal.send_test_email")}
              </Button>
            </div>
          </PluginSection>
        </div>
      </div>
    </PluginShell>
  );
};

const PostalPluginSettingsRedirect = () => <Navigate to="/settings/postal" replace />;

export default PostalPluginSettingsRedirect;

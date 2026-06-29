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
  auth_type: "smtp-api" | "smtp-ip" | "smtp";
  from: string;
  base_url: string;
  api_key: string;
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
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
  smtp_host: "",
  smtp_port: "",
  smtp_secure: "false",
  smtp_user: "",
  smtp_pass: "",
  test_to: "",
};

const defaultPostalTemplateExample = getPostalTemplateExample("postal-admin-test");

const emptyTestForm: PostalTestForm = {
  to: defaultPostalTemplateExample.to,
  cc: defaultPostalTemplateExample.cc.join(", "),
  bcc: defaultPostalTemplateExample.bcc.join(", "),
  from_name: defaultPostalTemplateExample.from_name,
  reply_to: defaultPostalTemplateExample.reply_to,
  template: defaultPostalTemplateExample.value,
  subject: defaultPostalTemplateExample.subject,
  text: defaultPostalTemplateExample.text,
  html: defaultPostalTemplateExample.html,
  headers_json: JSON.stringify(defaultPostalTemplateExample.headers, null, 2),
  custom_args_json: JSON.stringify(defaultPostalTemplateExample.custom_args, null, 2),
  metadata_json: JSON.stringify(defaultPostalTemplateExample.metadata, null, 2),
};

const activeConfigKeys = (authType: PostalSettingsForm["auth_type"]) => {
  if (authType === "smtp-api") {
    return ["from", "base_url", "api_key"];
  }

  if (authType === "smtp-ip") {
    return ["from", "smtp_host"];
  }

  return ["from", "smtp_host", "smtp_port", "smtp_user", "smtp_pass"];
};

const toTextareaClassName =
  "min-h-[160px] rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive";

type PostalTemplateReferenceRow = {
  template: PostalTemplateName | "default";
  purpose: string;
  audience: "auth" | "commerce" | "ops" | "shared";
  required: string;
  optional: string;
  event: string;
  notes: string;
};

type PostalTemplateAudienceFilter = "all" | PostalTemplateReferenceRow["audience"];

const postalTemplateReferenceRows: PostalTemplateReferenceRow[] = [
  {
    template: "default",
    purpose: "Generic fallback preview",
    audience: "shared",
    required: "subject, html or text",
    optional: "template-specific content",
    event: "Any custom template",
    notes: "Used when a workflow provides custom content but no known template key.",
  },
  {
    template: "postal-test",
    purpose: "Provider transport validation",
    audience: "ops",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "postal.example.test",
    notes: "Use for live transport checks and operator testing.",
  },
  {
    template: "postal-admin-test",
    purpose: "Admin settings validation",
    audience: "ops",
    required: "subject, html/text, workflow_event, workflow_run_id",
    optional: "cc, bcc, headers, custom_args, metadata, from_name, reply_to",
    event: "admin.postal.test",
    notes: "Used by the admin test-send panel.",
  },
  {
    template: "order-placed",
    purpose: "Order confirmation",
    audience: "commerce",
    required: "order id, customer, items, currency, storefront URL",
    optional: "billing/shipping address, support URL, metadata, custom_args",
    event: "order.placed",
    notes: "Shared customer order notification.",
  },
  {
    template: "password-reset",
    purpose: "Password reset",
    audience: "auth",
    required: "reset token or reset link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.password_reset",
    notes: "Shared auth flow email.",
  },
  {
    template: "email-verification",
    purpose: "Email verification",
    audience: "auth",
    required: "verification token or verification link, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.email_verification",
    notes: "Shared auth flow email.",
  },
  {
    template: "welcome",
    purpose: "Customer onboarding",
    audience: "commerce",
    required: "customer name or customer context, subject, html/text",
    optional: "locale, metadata, custom_args, reply_to",
    event: "customer.welcome",
    notes: "Shared first-contact and onboarding mail.",
  },
  {
    template: "abandoned-cart",
    purpose: "Cart recovery",
    audience: "commerce",
    required: "cart id, cart items, recovery link, subject, html/text",
    optional: "locale, customer name, total, currency, support URL, metadata, custom_args",
    event: "cart.abandoned",
    notes: "Shared recovery reminder.",
  },
  {
    template: "restock-available",
    purpose: "Back-in-stock alert",
    audience: "commerce",
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
  const templatePreview = getPostalTemplatePreview(
    (testForm.template || "postal-admin-test") as PostalTemplateName,
  );
  const renderedTemplateHtml = (testForm.html || templatePreview.html || "").trim();
  const webhookCallbackPath = "/store/postal/webhooks";
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase();
  const filteredTemplateRows = postalTemplateReferenceRows.filter((row) => {
    const audienceMatches =
      templateAudienceFilter === "all" || row.audience === templateAudienceFilter;
    const searchMatches = normalizedTemplateSearch
      ? [
          row.template,
          row.purpose,
          row.audience,
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
      await navigator.clipboard.writeText(JSON.stringify(templateExample, null, 2));
      toast.success(t("postal.template_example_copied"));
    } catch {
      toast.error(t("postal.template_example_copy_failed"));
    }
  };

  const loadTemplateExample = () => {
    const example = getPostalTemplateExample(
      (testForm.template || "postal-admin-test") as PostalTemplateName,
    );

    setTestForm({
      to: example.to,
      cc: example.cc.join(", "),
      bcc: example.bcc.join(", "),
      from_name: example.from_name,
      reply_to: example.reply_to,
      template: example.value,
      subject: example.subject,
      text: example.text,
      html: example.html,
      headers_json: JSON.stringify(example.headers, null, 2),
      custom_args_json: JSON.stringify(example.custom_args, null, 2),
      metadata_json: JSON.stringify(example.metadata, null, 2),
    });
  };

  const { data, refetch } = useQuery<any>({
    queryKey: ["plugin-settings-postal"],
    queryFn: () => sdk.client.fetch("/admin/plugin-settings/postal"),
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      auth_type: data.auth_type || "smtp-api",
      from: data.from || "",
      base_url: data.base_url || "",
      api_key: "",
      smtp_host: data.smtp_host || "",
      smtp_port: data.smtp_port || "",
      smtp_secure: data.smtp_secure || "false",
      smtp_user: data.smtp_user || "",
      smtp_pass: "",
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
        auth_type: next?.auth_type || prev.auth_type,
        from: next?.from || "",
        base_url: next?.base_url || "",
        smtp_host: next?.smtp_host || "",
        smtp_port: next?.smtp_port || "",
        smtp_secure: next?.smtp_secure || "false",
        smtp_user: next?.smtp_user || "",
        test_to: next?.test_to || "",
        api_key: "",
        smtp_pass: "",
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

  const showApiFields = form.auth_type === "smtp-api";
  const showSmtpFields =
    form.auth_type === "smtp-ip" || form.auth_type === "smtp";
  const isConfigured =
    data?.configured && Object.values(data.configured).some((v) => v === true);
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
        <div className="flex flex-col gap-4">
          <PluginSection
            title={t("postal.configuration")}
            description={t("postal.subtitle")}
            bodyClassName="flex flex-col gap-4"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {t("postal.auth_type")}
                </Text>
                <Text size="small" leading="compact" weight="plus">
                  {t(`postal.auth.${form.auth_type.replace("-", "_")}`)}
                </Text>
              </div>
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {t("postal.default_test_recipient")}
                </Text>
                <Text size="small" leading="compact" weight="plus">
                  {form.test_to || t("postal.recipient_fallback")}
                </Text>
              </div>
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {t("postal.webhook_callback_path")}
                </Text>
                <Code className="mt-1 block truncate">{webhookCallbackPath}</Code>
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="postal-auth-type">{t("postal.auth_type")}</Label>
              <Select
                value={form.auth_type}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    auth_type: v as PostalSettingsForm["auth_type"],
                  }))
                }
                disabled={disabled}
              >
                <Select.Trigger id="postal-auth-type">
                  <Select.Value placeholder={t("postal.select_auth_type")} />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="smtp-api">
                    {t("postal.auth.smtp_api")}
                  </Select.Item>
                  <Select.Item value="smtp-ip">
                    {t("postal.auth.smtp_ip")}
                  </Select.Item>
                  <Select.Item value="smtp">
                    {t("postal.auth.smtp")}
                  </Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="postal-from">{t("postal.from_email")}</Label>
              <Input
                id="postal-from"
                type="email"
                placeholder={t("postal.placeholder.from_email")}
                value={form.from}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, from: e.target.value }))
                }
                disabled={disabled}
              />
            </div>

            {showApiFields && (
              <div className="grid gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-base-url">
                    {t("postal.base_url")}
                  </Label>
                  <Input
                    id="postal-base-url"
                    placeholder={t("postal.placeholder.base_url")}
                    value={form.base_url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, base_url: e.target.value }))
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-api-key">{t("postal.api_key")}</Label>
                  <Input
                    id="postal-api-key"
                    type="password"
                    placeholder={
                      data?.secret_hints?.api_key_masked ||
                      t("postal.masked_long")
                    }
                    value={form.api_key}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, api_key: e.target.value }))
                    }
                    disabled={disabled}
                  />
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {data?.secret_hints?.api_key_masked
                      ? `${t("postal.saved_key_prefix")} ${data.secret_hints.api_key_masked}. ${t("postal.saved_key_suffix")}`
                      : t("postal.no_api_key_saved")}
                  </Text>
                </div>
              </div>
            )}

            {showSmtpFields && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-y-2 md:col-span-2">
                  <Label htmlFor="postal-smtp-host">
                    {t("postal.smtp_host")}
                  </Label>
                  <Input
                    id="postal-smtp-host"
                    placeholder={t("postal.placeholder.smtp_host")}
                    value={form.smtp_host}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        smtp_host: e.target.value,
                      }))
                    }
                    disabled={disabled}
                  />
                </div>
                {form.auth_type === "smtp" && (
                  <>
                    <div className="flex flex-col gap-y-2 md:col-span-2">
                      <Label htmlFor="postal-smtp-port">
                        {t("postal.smtp_port")}
                      </Label>
                      <Input
                        id="postal-smtp-port"
                        placeholder={t("postal.placeholder.smtp_port")}
                        value={form.smtp_port}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            smtp_port: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex flex-col gap-y-2 md:col-span-2">
                      <Label htmlFor="postal-smtp-user">
                        {t("postal.smtp_user")}
                      </Label>
                      <Input
                        id="postal-smtp-user"
                        placeholder={t("postal.placeholder.smtp_user")}
                        value={form.smtp_user}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            smtp_user: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex flex-col gap-y-2 md:col-span-2">
                      <Label htmlFor="postal-smtp-pass">
                        {t("postal.smtp_pass")}
                      </Label>
                      <Input
                        id="postal-smtp-pass"
                        type="password"
                        placeholder={
                          data?.secret_hints?.smtp_pass_masked ||
                          t("postal.masked_short")
                        }
                        value={form.smtp_pass}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            smtp_pass: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {data?.secret_hints?.smtp_pass_masked
                          ? `${t("postal.saved_password_prefix")} ${data.secret_hints.smtp_pass_masked}. ${t("postal.saved_password_suffix")}`
                          : t("postal.no_smtp_pass_saved")}
                      </Text>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="postal-test-to-default">
                {t("postal.default_test_recipient")}
              </Label>
              <Input
                id="postal-test-to-default"
                type="email"
                placeholder={t("postal.placeholder.test_recipient")}
                value={form.test_to}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, test_to: e.target.value }))
                }
                disabled={disabled}
              />
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {t("postal.default_test_recipient_hint")}
              </Text>
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button
                variant="primary"
                size="small"
                onClick={() =>
                  saveMutation.mutate({ action: "save", settings: form })
                }
                isLoading={saveMutation.isPending}
                disabled={disabled}
              >
                {t("postal.save_changes")}
              </Button>
            </div>
          </PluginSection>

          <PluginSidebarSection title={t("postal.webhook_callback")}>
            <div className="flex flex-col gap-y-3">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {t("postal.webhook_callback_hint")}
              </Text>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="postal-webhook-callback">
                  {t("postal.webhook_callback_path")}
                </Label>
                <div className="flex items-center gap-2">
                  <Code
                    id="postal-webhook-callback"
                    className="min-w-0 flex-1 truncate"
                  >
                    {webhookCallbackPath}
                  </Code>
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(webhookCallbackPath);
                      toast.success(t("postal.webhook_callback_copied"));
                    }}
                    disabled={disabled}
                  >
                    {t("postal.copy_callback_path")}
                  </Button>
                </div>
              </div>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {t("postal.webhook_callback_hint_suffix")}
              </Text>
            </div>
          </PluginSidebarSection>

          {data?.configured && (
            <PluginSidebarSection title={t("postal.active_config_checklist")}>
              <div className="flex flex-col gap-y-3">
                <Badge size="small" color="blue" className="w-fit">
                  {form.auth_type.replace("-", " ")}
                </Badge>
                <Table>
                  <Table.Body>
                    {Object.entries(data.configured)
                      .filter(([key]) =>
                        activeConfigKeys(form.auth_type).includes(key),
                      )
                      .map(([key, val]) => (
                        <Table.Row key={key}>
                          <Table.Cell>
                            <Text size="small" leading="compact" weight="plus">
                              {key.replace("_", " ")}
                            </Text>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <StatusBadge color={val ? "green" : "red"}>
                              {val ? t("postal.set") : t("postal.missing")}
                            </StatusBadge>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table>
              </div>
            </PluginSidebarSection>
          )}
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <PluginSection
            title={t("postal.template_preview")}
            description={templatePreview.description}
            bodyClassName="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={copyTemplateExample}
                  disabled={disabled}
                >
                  {t("postal.copy_example_values")}
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={loadTemplateExample}
                  disabled={disabled}
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

            <div className="inline-flex w-fit rounded-full border border-ui-border-base bg-ui-bg-subtle p-1">
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
                <div className="flex items-center justify-between gap-3 border-b border-ui-border-base bg-ui-bg-subtle px-4 py-3">
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
                      <Text size="small" leading="compact" weight="plus">
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
                      <Text size="small" leading="compact">
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
                      <Text size="small" leading="compact" weight="plus">
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
                  <Code className="mt-2 block max-h-[480px] overflow-auto whitespace-pre-wrap break-words">
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
                  <Code className="mt-2 block max-h-[720px] overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(templateExample, null, 2)}
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
                  Required fields, optional fields, and audience grouping for each built-in template.
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
                <div className="flex items-center gap-2">
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
                  >
                    Reset filters
                  </Button>
                </div>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {filteredTemplateRows.length} templates match the current filter.
                </Text>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-ui-border-base bg-white">
                <Table>
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
                            >
                              Use template
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={6}>
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
                <Label htmlFor="postal-test-reply-to">{t("postal.reply_to")}</Label>
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

import {
  Text,
  Input,
  Label,
  Button,
  toast,
  Code,
  Badge,
  StatusBadge,
  Select,
  Table,
} from "@medusajs/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PaperPlane } from "@medusajs/icons";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import {
  PluginHeader,
  PluginSection,
  PluginShell,
  PluginSidebarSection,
  TwoColumnLayout,
} from "../../../components/admin-ui";
import { sdk } from "../../../lib/client";
import { ensurePostalAdminTranslations } from "../../../lib/i18n";
import {
  getPostalTemplateOptions,
  getPostalTemplateExample,
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

const defaultPostalTemplateExample = getPostalTemplateExample(
  "postal-admin-test",
);

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

export const PostalSettingsPage = () => {
  ensurePostalAdminTranslations();
  const { t } = useTranslation();
  const [testForm, setTestForm] = useState<PostalTestForm>(emptyTestForm);
  const [form, setForm] = useState<PostalSettingsForm>(emptyForm);
  const webhookCallbackPath = "/store/postal/webhooks";
  const webhookCallbackUrl =
    typeof window === "undefined"
      ? webhookCallbackPath
      : new URL(webhookCallbackPath, window.location.origin).toString();
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
      // Fall through to the shared error below.
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
        JSON.stringify(templateExample, null, 2),
      );
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
        ]}
      />
      <TwoColumnLayout
        firstCol={
          <PluginSection
            title={t("postal.configuration")}
            bodyClassName="flex max-w-[720px] flex-col gap-y-4"
          >
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
              <>
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
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {data?.secret_hints?.api_key_masked
                      ? `${t("postal.saved_key_prefix")} ${data.secret_hints.api_key_masked}. ${t("postal.saved_key_suffix")}`
                      : t("postal.no_api_key_saved")}
                  </Text>
                </div>
              </>
            )}

            {showSmtpFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, test_to: e.target.value }));
                  }}
                  disabled={disabled}
                />
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
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
        }
        secondCol={
          <>
            <PluginSidebarSection title={t("postal.webhook_callback")}>
              <div className="flex flex-col gap-y-3">
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {t("postal.webhook_callback_hint")}
                </Text>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-webhook-callback">
                    {t("postal.webhook_callback_url")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Code
                      id="postal-webhook-callback"
                      className="min-w-0 flex-1 truncate"
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
                    >
                      {t("postal.copy_callback_url")}
                    </Button>
                  </div>
                </div>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  <Code>{webhookCallbackPath}</Code>
                </Text>
              </div>
            </PluginSidebarSection>

            <PluginSidebarSection title={t("postal.test_connectivity")}>
              <div className="flex flex-col gap-y-4">
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {t("postal.test_connectivity_hint")}
                </Text>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-to">
                    {t("postal.recipient_address")}
                  </Label>
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
                  <Label htmlFor="postal-test-template">
                    {t("postal.template")}
                  </Label>
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
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {selectedTemplate?.description}
                  </Text>
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

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-text">
                    {t("postal.template_text")}
                  </Label>
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
                    className="min-h-[96px] rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive"
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-html">
                    {t("postal.template_html")}
                  </Label>
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
                    rows={6}
                    className="min-h-[140px] rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive"
                  />
                </div>

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
                    rows={4}
                    className="min-h-[120px] rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive"
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
                    className="min-h-[140px] rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive"
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postal-test-metadata">
                    {t("postal.metadata")}
                  </Label>
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
                    className="min-h-[140px] rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 font-mono text-sm text-ui-fg-base outline-none transition-colors placeholder:text-ui-fg-muted focus:border-ui-border-interactive"
                  />
                </div>

                <PluginSection
                  title={t("postal.template_preview")}
                  bodyClassName="flex flex-col gap-y-3"
                >
                  <div className="flex flex-col gap-y-1">
                    <Text size="small" weight="plus">
                      {templatePreview.label}
                    </Text>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {templatePreview.description}
                    </Text>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                      <Text size="small" weight="plus">
                        {t("postal.template_subject")}
                      </Text>
                      <Text size="small" className="mt-1 break-words">
                        {templatePreview.subject}
                      </Text>
                    </div>
                    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                      <Text size="small" weight="plus">
                        {t("postal.template_text")}
                      </Text>
                      <Text size="small" className="mt-1 break-words">
                        {templatePreview.text || t("postal.template_empty")}
                      </Text>
                    </div>
                  </div>
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                    <Text size="small" weight="plus">
                      {t("postal.template_html")}
                    </Text>
                    <Code className="mt-1 block overflow-x-auto whitespace-pre-wrap break-words">
                      {templatePreview.html || t("postal.template_empty")}
                    </Code>
                  </div>
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                    <Text size="small" weight="plus">
                      {t("postal.template_example")}
                    </Text>
                    <Code className="mt-1 block overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(templateExample, null, 2)}
                    </Code>
                  </div>
                  <div className="flex justify-end">
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
                </PluginSection>

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
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
                        error instanceof Error
                          ? error.message
                          : t("postal.invalid_example_json"),
                      );
                    }
                  }}
                  isLoading={testMutation.isPending}
                  disabled={disabled}
                >
                  <PaperPlane />
                  {t("postal.send_test_email")}
                </Button>
              </div>
            </PluginSidebarSection>

            {data?.configured && (
              <PluginSidebarSection
                title={t("postal.active_config_checklist")}
                className="mt-3"
              >
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
                              <Text
                                size="small"
                                leading="compact"
                                weight="plus"
                              >
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
          </>
        }
      />
    </PluginShell>
  );
};

const PostalPluginSettingsRedirect = () => (
  <Navigate to="/settings/postal" replace />
);

export default PostalPluginSettingsRedirect;

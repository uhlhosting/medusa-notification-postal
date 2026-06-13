import {
  Text,
  Input,
  Label,
  Button,
  toast,
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
  const [to, setTo] = useState("");
  const [form, setForm] = useState<PostalSettingsForm>(emptyForm);

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
    setTo(data.test_to || "");
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
                  setTo(e.target.value);
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
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    testMutation.mutate({
                      action: "test",
                      to: to.trim() || undefined,
                      settings: form,
                    })
                  }
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

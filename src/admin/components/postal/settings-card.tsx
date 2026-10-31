import { Alert, Button, Input, Skeleton, toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField, PluginSection } from "../admin-ui";
import { sdk } from "../../lib/client";
import { toPostalSettingsPayload } from "../../lib/postal-payloads";
import { postalSettingsKey, usePostalSettings } from "../../lib/postal-queries";

type EditableKey = "from" | "base_url" | "test_to";
type SettingsDraft = Partial<Record<EditableKey, string>>;

export const PostalSettingsCard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = usePostalSettings();
  const [draft, setDraft] = useState<SettingsDraft>({});
  const [savedThisSession, setSavedThisSession] = useState(false);

  // Form values are the saved value with the user's unsaved edits on top. They
  // are derived on render, not copied into state from an effect, so a
  // background refetch can never overwrite what someone is typing.
  const valueOf = (key: EditableKey) => draft[key] ?? data?.[key] ?? "";
  const isDirty = (Object.keys(draft) as EditableKey[]).some(
    (key) => draft[key] !== (data?.[key] ?? ""),
  );

  const save = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/plugin-settings/postal", {
        method: "POST",
        // The API key is deliberately absent: secrets come from the
        // environment and are never accepted from the admin UI.
        body: {
          action: "save",
          settings: toPostalSettingsPayload({
            auth_type: "smtp-api",
            from: valueOf("from"),
            base_url: valueOf("base_url"),
            test_to: valueOf("test_to"),
          }),
        },
      }),
    onSuccess: async () => {
      toast.success(t("postal.toast.saved"));
      setDraft({});
      setSavedThisSession(true);
      await queryClient.invalidateQueries({ queryKey: postalSettingsKey });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("postal.toast.save_failed"));
    },
  });

  const restartPending = savedThisSession || Boolean(data?.pending_restart);
  const edit = (key: EditableKey) => (event: { target: { value: string } }) =>
    setDraft((previous) => ({ ...previous, [key]: event.target.value }));

  if (isLoading) {
    return (
      <PluginSection
        title={t("postal.configuration")}
        description={t("postal.configuration_description")}
        bodyClassName="flex flex-col gap-y-4"
      >
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </PluginSection>
    );
  }

  return (
    <PluginSection
      title={t("postal.configuration")}
      description={t("postal.configuration_description")}
      bodyClassName="flex flex-col gap-y-4"
    >
      {isError && (
        <Alert variant="error">{t("postal.settings.load_failed")}</Alert>
      )}
      {restartPending && (
        <Alert variant="warning">{t("postal.settings.restart_notice")}</Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="postal-from" label={t("postal.from_email")}>
          <Input
            id="postal-from"
            type="email"
            placeholder={t("postal.placeholder.from_email")}
            value={valueOf("from")}
            onChange={edit("from")}
            disabled={save.isPending}
          />
        </FormField>
        <FormField id="postal-base-url" label={t("postal.base_url")}>
          <Input
            id="postal-base-url"
            placeholder={t("postal.placeholder.base_url")}
            value={valueOf("base_url")}
            onChange={edit("base_url")}
            disabled={save.isPending}
          />
        </FormField>
      </div>

      <FormField
        id="postal-api-key"
        label={t("postal.api_key")}
        hint={
          data?.secret_hints?.api_key_masked
            ? `${t("postal.saved_key_prefix")} ${data.secret_hints.api_key_masked}. ${t("postal.api_key_env_managed")}`
            : t("postal.api_key_env_managed")
        }
      >
        <Input
          id="postal-api-key"
          type="password"
          placeholder={t("postal.masked_long")}
          value=""
          readOnly
          disabled
        />
      </FormField>

      <FormField
        id="postal-test-to-default"
        label={t("postal.default_test_recipient")}
        hint={t("postal.default_test_recipient_hint")}
      >
        <Input
          id="postal-test-to-default"
          type="email"
          placeholder={t("postal.placeholder.test_recipient")}
          value={valueOf("test_to")}
          onChange={edit("test_to")}
          disabled={save.isPending}
        />
      </FormField>

      <div className="flex justify-end border-t border-ui-border-base pt-4">
        <Button
          size="small"
          onClick={() => save.mutate()}
          isLoading={save.isPending}
          disabled={!isDirty || save.isPending}
        >
          {t("postal.save_changes")}
        </Button>
      </div>
    </PluginSection>
  );
};

import { Button, Code, Skeleton, StatusBadge, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PluginSection } from "../admin-ui";
import { usePostalSettings } from "../../lib/postal-queries";

// The callback URL embeds the webhook token, which is a secret. The settings
// surface therefore only names the path and points at the Activity page, the
// one place that reveals the full URL (AGENTS.md invariant 8).
const WEBHOOK_CALLBACK_PATH = "/postal/webhooks";

export const PostalWebhookCard = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePostalSettings();
  const hasToken = Boolean(data?.configured?.webhook_token);

  return (
    <PluginSection
      title={t("postal.webhook_callback")}
      description={t("postal.webhook_callback_settings_hint")}
      bodyClassName="flex flex-col gap-y-4"
    >
      <div className="flex flex-col gap-y-2">
        <Text size="small" leading="compact" weight="plus">
          {t("postal.webhook_callback_path")}
        </Text>
        <Code className="block w-fit max-w-full whitespace-normal break-all">
          {WEBHOOK_CALLBACK_PATH}/&lt;token&gt;
        </Code>
      </div>

      <div className="flex items-center justify-between gap-x-2">
        <Text size="small" leading="compact" weight="plus">
          {t("postal.webhook_token")}
        </Text>
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <StatusBadge color={hasToken ? "green" : "red"}>
            {hasToken ? t("postal.set") : t("postal.missing")}
          </StatusBadge>
        )}
      </div>

      <Button size="small" variant="secondary" asChild>
        <Link to="/postal">{t("postal.open_activity")}</Link>
      </Button>
    </PluginSection>
  );
};

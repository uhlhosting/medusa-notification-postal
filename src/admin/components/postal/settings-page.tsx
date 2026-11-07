import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PluginHeader,
  PluginShell,
  TwoColumnLayout,
} from "../admin-ui";
import { isPostalConfigured, usePostalSettings } from "../../lib/postal-queries";
import type { PostalTemplateName } from "../../../providers/postal/templates";
import { PostalSettingsCard } from "./settings-card";
import { PostalTemplatePreview } from "./template-preview";
import { PostalTemplateReference } from "./template-reference";
import { PostalTestSend } from "./test-send";
import { PostalWebhookCard } from "./webhook-card";

export const PostalSettingsPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePostalSettings();
  const [template, setTemplate] = useState<PostalTemplateName>("postal-admin-test");

  // While the settings request is in flight nothing is known yet, so the
  // badge must not claim "Not Configured".
  const statusLabel = isLoading
    ? t("postal.activity.checking")
    : isPostalConfigured(data)
      ? t("postal.configured")
      : t("postal.not_configured");
  const statusColor = isLoading
    ? "grey"
    : isPostalConfigured(data)
      ? "green"
      : "orange";

  return (
    <PluginShell>
      <PluginHeader
        title={t("postal.title")}
        description={t("postal.subtitle")}
        statusLabel={statusLabel}
        statusColor={statusColor}
        helpMenuLabel={t("postal.help_menu")}
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

      <TwoColumnLayout
        firstCol={<PostalSettingsCard />}
        secondCol={<PostalWebhookCard />}
      />

      <PostalTemplatePreview template={template} onTemplateChange={setTemplate} />
      <PostalTestSend template={template} />
      <PostalTemplateReference selected={template} onUseTemplate={setTemplate} />
    </PluginShell>
  );
};

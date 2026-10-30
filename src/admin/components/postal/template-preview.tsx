import { CodeBlock, Select, Tabs, Text } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FormField, PluginSection } from "../admin-ui";
import {
  getPostalTemplateExample,
  getPostalTemplateOptions,
  getPostalTemplatePreview,
  type PostalTemplateName,
} from "../../../providers/postal/templates";

type PostalTemplatePreviewProps = {
  template: PostalTemplateName;
  onTemplateChange: (template: PostalTemplateName) => void;
};

export const PostalTemplatePreview = ({
  template,
  onTemplateChange,
}: PostalTemplatePreviewProps) => {
  const { t } = useTranslation();
  const options = getPostalTemplateOptions();
  const preview = useMemo(() => getPostalTemplatePreview(template), [template]);

  // The example is shown (and copied) without the operator-specific fields, so
  // it reads as a payload contract rather than as someone's saved values.
  const exampleJson = useMemo(() => {
    const example: Record<string, unknown> = {
      ...getPostalTemplateExample(template),
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

    // `value`, `label` and `description` describe the template in this
    // selector; they are not fields of a notification payload.
    delete example.value;
    delete example.label;
    delete example.description;

    return JSON.stringify(example, null, 2);
  }, [template]);

  const empty = t("postal.template_empty");
  const html = preview.html.trim();

  return (
    <PluginSection
      title={t("postal.template_preview")}
      description={preview.description}
      bodyClassName="flex flex-col gap-y-4"
    >
      <div className="max-w-sm">
        <FormField id="postal-preview-template" label={t("postal.template")}>
          <Select
            value={template}
            onValueChange={(value) =>
              onTemplateChange(value as PostalTemplateName)
            }
          >
            <Select.Trigger id="postal-preview-template">
              <Select.Value placeholder={t("postal.template")} />
            </Select.Trigger>
            <Select.Content>
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FormField>
      </div>

      <Tabs defaultValue="rendered">
        <Tabs.List>
          <Tabs.Trigger value="rendered">
            {t("postal.preview.rendered")}
          </Tabs.Trigger>
          <Tabs.Trigger value="source">{t("postal.preview.source")}</Tabs.Trigger>
          <Tabs.Trigger value="example">
            {t("postal.preview.example")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="rendered" className="flex flex-col gap-y-3 pt-4">
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {t("postal.template_subject")}
            </Text>
            <Text size="small" leading="compact" weight="plus">
              {preview.subject}
            </Text>
          </div>
          {/* Email HTML is authored for a light canvas, so the frame stays
              white in dark mode on purpose; the sandbox blocks scripts. */}
          <div className="overflow-hidden rounded-lg border border-ui-border-base bg-white">
            {html ? (
              <iframe
                title={t("postal.template_rendered_preview")}
                srcDoc={html}
                sandbox=""
                className="h-[480px] w-full"
              />
            ) : (
              <div className="flex h-[240px] items-center justify-center p-6">
                <Text size="small" className="text-ui-fg-subtle">
                  {empty}
                </Text>
              </div>
            )}
          </div>
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            {t("postal.template_rendered_preview_hint")}
          </Text>
        </Tabs.Content>

        <Tabs.Content value="source" className="pt-4">
          <CodeBlock
            snippets={[
              {
                label: t("postal.template_html"),
                language: "html",
                code: preview.html || empty,
              },
              {
                label: t("postal.template_text"),
                language: "text",
                code: preview.text || empty,
              },
              {
                label: t("postal.template_subject"),
                language: "text",
                code: preview.subject,
              },
            ]}
          >
            <CodeBlock.Header />
            <CodeBlock.Body className="max-h-[420px] overflow-auto" />
          </CodeBlock>
        </Tabs.Content>

        <Tabs.Content value="example" className="pt-4">
          <CodeBlock
            snippets={[
              {
                label: t("postal.template_example"),
                language: "json",
                code: exampleJson,
              },
            ]}
          >
            <CodeBlock.Header />
            <CodeBlock.Body className="max-h-[420px] overflow-auto" />
          </CodeBlock>
        </Tabs.Content>
      </Tabs>
    </PluginSection>
  );
};

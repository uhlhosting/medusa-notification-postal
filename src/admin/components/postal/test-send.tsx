import { PaperPlane } from "@medusajs/icons";
import {
  Badge,
  Button,
  Input,
  Label,
  Switch,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField, PluginSection } from "../admin-ui";
import { sdk } from "../../lib/client";
import { usePostalSettings } from "../../lib/postal-queries";
import {
  getPostalTemplateExample,
  getPostalTemplateOptions,
  type PostalTemplateName,
} from "../../../providers/postal/templates";

type TestForm = {
  // `undefined` means "use the saved default recipient".
  to?: string;
  subject: string;
  text: string;
  html: string;
  cc: string;
  bcc: string;
  from_name: string;
  reply_to: string;
  headers_json: string;
  custom_args_json: string;
  metadata_json: string;
};

type JsonField = "headers_json" | "custom_args_json" | "metadata_json";

const emptyForm: TestForm = {
  subject: "",
  text: "",
  html: "",
  cc: "",
  bcc: "",
  from_name: "",
  reply_to: "",
  headers_json: "{}",
  custom_args_json: "{}",
  metadata_json: "{}",
};

const parseJsonObject = (value: string): Record<string, unknown> | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const parseEmailList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

type PostalTestSendProps = {
  template: PostalTemplateName;
};

export const PostalTestSend = ({ template }: PostalTestSendProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settings } = usePostalSettings();
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const to = form.to ?? settings?.test_to ?? "";
  const option = getPostalTemplateOptions().find(
    (candidate) => candidate.value === template,
  );

  const set =
    (key: keyof TestForm) =>
    (event: { target: { value: string } }) =>
      setForm((previous) => ({ ...previous, [key]: event.target.value }));

  // Validated as the operator types so a mistake is visible next to the field
  // and the button simply stays disabled, rather than failing after a click.
  const jsonErrors = useMemo(() => {
    const labels: Record<JsonField, string> = {
      headers_json: t("postal.invalid_headers_json"),
      custom_args_json: t("postal.invalid_custom_args_json"),
      metadata_json: t("postal.invalid_metadata_json"),
    };

    return (Object.keys(labels) as JsonField[]).reduce<
      Partial<Record<JsonField, string>>
    >((errors, key) => {
      if (parseJsonObject(form[key]) === null) {
        errors[key] = labels[key];
      }
      return errors;
    }, {});
  }, [form.headers_json, form.custom_args_json, form.metadata_json, t]);
  const hasJsonError = Object.keys(jsonErrors).length > 0;

  const loadExample = () => {
    const example = getPostalTemplateExample(template);

    setForm((previous) => ({
      ...emptyForm,
      to: previous.to,
      subject: example.subject,
      text: example.text,
      html: example.html,
    }));
  };

  const send = useMutation({
    mutationFn: () => {
      const cc = parseEmailList(form.cc);
      const bcc = parseEmailList(form.bcc);

      return sdk.client.fetch<{ to?: string }>("/admin/postal/send-test", {
        method: "POST",
        body: {
          to: to.trim() || undefined,
          template,
          subject: form.subject.trim() || undefined,
          text: form.text.trim() || undefined,
          html: form.html.trim() || undefined,
          cc: cc.length ? cc : undefined,
          bcc: bcc.length ? bcc : undefined,
          from_name: form.from_name.trim() || undefined,
          reply_to: form.reply_to.trim() || undefined,
          headers: parseJsonObject(form.headers_json) ?? {},
          custom_args: parseJsonObject(form.custom_args_json) ?? {},
          metadata: parseJsonObject(form.metadata_json) ?? {},
        },
      });
    },
    onSuccess: async (response) => {
      toast.success(
        t("postal.toast.test_sent", {
          to: response?.to || to || t("postal.recipient_fallback"),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: ["postal-notifications"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("postal.toast.test_failed"));
    },
  });

  return (
    <PluginSection
      title={t("postal.test_connectivity")}
      description={t("postal.test_connectivity_hint")}
      bodyClassName="flex flex-col gap-y-4"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Label size="small" weight="plus">
          {t("postal.template")}
        </Label>
        <Badge size="2xsmall" color="grey">
          {option?.label ?? template}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="postal-test-to" label={t("postal.recipient_address")}>
          <Input
            id="postal-test-to"
            type="email"
            placeholder={t("postal.placeholder.customer_email")}
            value={to}
            onChange={set("to")}
            disabled={send.isPending}
          />
        </FormField>
        <FormField
          id="postal-test-subject"
          label={t("postal.template_subject")}
          hint={t("postal.test_subject_hint")}
        >
          <Input
            id="postal-test-subject"
            value={form.subject}
            onChange={set("subject")}
            disabled={send.isPending}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-x-2">
        <Switch
          id="postal-test-advanced"
          checked={showAdvanced}
          onCheckedChange={setShowAdvanced}
        />
        <Label htmlFor="postal-test-advanced" size="small" weight="plus">
          {t("postal.test_advanced")}
        </Label>
      </div>

      {showAdvanced && (
        <div className="flex flex-col gap-y-4 border-t border-ui-border-base pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="postal-test-from-name" label={t("postal.sender_name")}>
              <Input
                id="postal-test-from-name"
                placeholder={t("postal.placeholder.sender_name")}
                value={form.from_name}
                onChange={set("from_name")}
                disabled={send.isPending}
              />
            </FormField>
            <FormField id="postal-test-reply-to" label={t("postal.reply_to")}>
              <Input
                id="postal-test-reply-to"
                type="email"
                placeholder={t("postal.placeholder.reply_to")}
                value={form.reply_to}
                onChange={set("reply_to")}
                disabled={send.isPending}
              />
            </FormField>
            <FormField id="postal-test-cc" label={t("postal.cc")}>
              <Input
                id="postal-test-cc"
                placeholder={t("postal.placeholder.recipients_list")}
                value={form.cc}
                onChange={set("cc")}
                disabled={send.isPending}
              />
            </FormField>
            <FormField id="postal-test-bcc" label={t("postal.bcc")}>
              <Input
                id="postal-test-bcc"
                placeholder={t("postal.placeholder.recipients_list")}
                value={form.bcc}
                onChange={set("bcc")}
                disabled={send.isPending}
              />
            </FormField>
          </div>

          <FormField id="postal-test-text" label={t("postal.template_text")}>
            <Textarea
              id="postal-test-text"
              rows={4}
              value={form.text}
              onChange={set("text")}
              disabled={send.isPending}
            />
          </FormField>

          <FormField id="postal-test-html" label={t("postal.template_html")}>
            <Textarea
              id="postal-test-html"
              rows={8}
              className="font-mono"
              value={form.html}
              onChange={set("html")}
              disabled={send.isPending}
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              id="postal-test-headers"
              label={t("postal.headers")}
              error={jsonErrors.headers_json}
            >
              <Textarea
                id="postal-test-headers"
                rows={6}
                className="font-mono"
                placeholder={t("postal.headers_placeholder")}
                value={form.headers_json}
                onChange={set("headers_json")}
                aria-invalid={Boolean(jsonErrors.headers_json)}
                disabled={send.isPending}
              />
            </FormField>
            <FormField
              id="postal-test-custom-args"
              label={t("postal.custom_args")}
              error={jsonErrors.custom_args_json}
            >
              <Textarea
                id="postal-test-custom-args"
                rows={6}
                className="font-mono"
                placeholder={t("postal.custom_args_placeholder")}
                value={form.custom_args_json}
                onChange={set("custom_args_json")}
                aria-invalid={Boolean(jsonErrors.custom_args_json)}
                disabled={send.isPending}
              />
            </FormField>
            <FormField
              id="postal-test-metadata"
              label={t("postal.metadata")}
              error={jsonErrors.metadata_json}
            >
              <Textarea
                id="postal-test-metadata"
                rows={6}
                className="font-mono"
                placeholder={t("postal.metadata_placeholder")}
                value={form.metadata_json}
                onChange={set("metadata_json")}
                aria-invalid={Boolean(jsonErrors.metadata_json)}
                disabled={send.isPending}
              />
            </FormField>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-ui-border-base pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          size="small"
          variant="secondary"
          onClick={loadExample}
          disabled={send.isPending}
        >
          {t("postal.load_example_values")}
        </Button>
        <Button
          size="small"
          onClick={() => send.mutate()}
          isLoading={send.isPending}
          disabled={send.isPending || hasJsonError || !to.trim()}
        >
          <PaperPlane />
          {t("postal.send_test_email")}
        </Button>
      </div>
    </PluginSection>
  );
};

import {
  Badge,
  Button,
  Code,
  DataTable,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  createDataTableFilterHelper,
  useDataTable,
  type DataTableFilteringState,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PluginSection } from "../admin-ui";
import {
  getPostalTemplateReferenceRows,
  type PostalTemplateAudience,
  type PostalTemplateReferenceRow,
} from "../../lib/template-reference";
import type { PostalTemplateName } from "../../../providers/postal/templates";

const AUDIENCES: PostalTemplateAudience[] = [
  "auth",
  "commerce",
  "ops",
  "shared",
];

const AUDIENCE_COLOR: Record<
  PostalTemplateAudience,
  "blue" | "green" | "orange" | "grey"
> = {
  auth: "blue",
  commerce: "green",
  ops: "orange",
  shared: "grey",
};

const columnHelper = createDataTableColumnHelper<PostalTemplateReferenceRow>();
const filterHelper = createDataTableFilterHelper<PostalTemplateReferenceRow>();

const toArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];

type PostalTemplateReferenceProps = {
  selected: PostalTemplateName;
  onUseTemplate: (template: PostalTemplateName) => void;
};

export const PostalTemplateReference = ({
  selected,
  onUseTemplate,
}: PostalTemplateReferenceProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});
  const rows = useMemo(() => getPostalTemplateReferenceRows(), []);

  const audiences = toArray(filtering.audience);
  const needle = search.trim().toLowerCase();
  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (audiences.length && !audiences.includes(row.audience)) {
          return false;
        }

        return needle
          ? [
              row.template,
              row.purpose,
              row.event,
              row.required,
              row.optional,
              row.notes,
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true;
      }),
    [rows, audiences, needle],
  );

  const filters = useMemo(
    () => [
      filterHelper.accessor("audience", {
        type: "select",
        label: t("postal.reference.audience"),
        options: AUDIENCES.map((audience) => ({
          label: t(`postal.audience.${audience}`),
          value: audience,
        })),
      }),
    ],
    [t],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("template", {
        header: t("postal.reference.template"),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-y-0.5 py-1">
            <Text size="small" leading="compact" weight="plus">
              {row.original.template}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {row.original.purpose}
            </Text>
          </div>
        ),
      }),
      columnHelper.accessor("audience", {
        header: t("postal.reference.audience"),
        cell: ({ getValue }) => (
          <Badge size="2xsmall" color={AUDIENCE_COLOR[getValue()]}>
            {t(`postal.audience.${getValue()}`)}
          </Badge>
        ),
      }),
      columnHelper.accessor("event", {
        header: t("postal.reference.event"),
        cell: ({ getValue }) => (
          <Code className="whitespace-normal break-words">{getValue()}</Code>
        ),
      }),
      columnHelper.accessor("required", {
        header: t("postal.reference.required"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="whitespace-normal">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("optional", {
        header: t("postal.reference.optional"),
        cell: ({ getValue }) => (
          <Text
            size="small"
            leading="compact"
            className="whitespace-normal text-ui-fg-subtle"
          >
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("source", {
        header: t("postal.reference.source"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="whitespace-nowrap">
            {t(`postal.source.${getValue()}`)}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "use",
        header: "",
        cell: ({ row }) => {
          // The fallback is documented here but is not a selectable template.
          if (row.original.template === "default") {
            return null;
          }

          return row.original.template === selected ? (
            <StatusBadge color="green">{t("postal.reference.selected")}</StatusBadge>
          ) : (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onUseTemplate(row.original.template)}
            >
              {t("postal.reference.use_template")}
            </Button>
          );
        },
      }),
    ],
    [t, selected, onUseTemplate],
  );

  const table = useDataTable({
    data: visibleRows,
    columns,
    getRowId: (row) => row.template,
    rowCount: visibleRows.length,
    isLoading: false,
    filters,
    filtering: { state: filtering, onFilteringChange: setFiltering },
    search: { state: search, onSearchChange: setSearch },
  });

  return (
    <PluginSection
      title={t("postal.template_contract")}
      description={t("postal.template_contract_description")}
      flush
    >
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between gap-2">
          <DataTable.FilterMenu tooltip={t("postal.reference.filter")} />
          <DataTable.Search placeholder={t("postal.reference.search_placeholder")} />
        </DataTable.Toolbar>
        <DataTable.Table
          emptyState={{
            filtered: {
              heading: t("postal.reference.empty_heading"),
              description: t("postal.reference.empty_description"),
            },
          }}
        />
      </DataTable>
    </PluginSection>
  );
};

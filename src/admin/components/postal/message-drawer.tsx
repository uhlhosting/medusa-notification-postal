import {
  Alert,
  Button,
  Code,
  Drawer,
  Skeleton,
  StatusBadge,
  Text,
} from "@medusajs/ui";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatDateTime, fromEpochSeconds } from "../../lib/format";
import {
  usePostalMessage,
  type PostalMessageDelivery,
} from "../../lib/postal-queries";

type StatusColor = "green" | "red" | "orange" | "blue" | "grey";

// Postal's own vocabulary for messages and delivery attempts, shown as Postal
// reports it so it matches what the operator sees in Postal itself.
const postalStatusColor = (status?: string | null): StatusColor => {
  switch ((status ?? "").toLowerCase()) {
    case "sent":
      return "green";
    case "pending":
    case "softfail":
      return "orange";
    case "held":
      return "blue";
    case "hardfail":
    case "bounced":
      return "red";
    default:
      return "grey";
  }
};

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) => (
  <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-4 py-2">
    <Text
      size="small"
      leading="compact"
      weight="plus"
      className="text-ui-fg-subtle"
    >
      {label}
    </Text>
    <Text as="div" size="small" leading="compact" className="min-w-0 break-words">
      {children || "-"}
    </Text>
  </div>
);

const DeliveryAttempt = ({ delivery }: { delivery: PostalMessageDelivery }) => (
  <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <StatusBadge color={postalStatusColor(delivery.status)}>
        {delivery.status || "-"}
      </StatusBadge>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {formatDateTime(fromEpochSeconds(delivery.timestamp))}
      </Text>
    </div>
    {delivery.details && (
      <Text size="small" leading="compact" className="break-words">
        {delivery.details}
      </Text>
    )}
    {delivery.output && (
      <Code className="block whitespace-pre-wrap break-words">
        {delivery.output}
      </Code>
    )}
  </div>
);

type PostalMessageDrawerProps = {
  // The Postal message to show, or `null` while the drawer is closed.
  messageId: string | null;
  onClose: () => void;
};

export const PostalMessageDrawer = ({
  messageId,
  onClose,
}: PostalMessageDrawerProps) => {
  const { t } = useTranslation();
  // Keep showing the last message while the drawer animates shut, instead of
  // flashing an empty body once `messageId` is cleared.
  const [shownId, setShownId] = useState(messageId);
  if (messageId !== null && messageId !== shownId) {
    setShownId(messageId);
  }

  const { data, isLoading, isError } = usePostalMessage(shownId);
  const details = data?.message.details;
  const status = data?.message.status?.status;

  return (
    <Drawer
      open={messageId !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{t("postal.message.title")}</Drawer.Title>
          <Drawer.Description>
            {t("postal.message.description", { id: shownId ?? "" })}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {isError && (
            <Alert variant="error">{t("postal.message.load_failed")}</Alert>
          )}

          {isLoading && (
            <div className="flex flex-col gap-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}

          {data && (
            <>
              <div className="flex flex-col divide-y divide-ui-border-base">
                <DetailRow label={t("postal.activity.status")}>
                  {status && (
                    <StatusBadge color={postalStatusColor(status)}>
                      {status}
                    </StatusBadge>
                  )}
                </DetailRow>
                <DetailRow label={t("postal.message.subject")}>
                  {details?.subject}
                </DetailRow>
                <DetailRow label={t("postal.message.from")}>
                  {details?.mail_from}
                </DetailRow>
                <DetailRow label={t("postal.message.to")}>
                  {details?.rcpt_to}
                </DetailRow>
                <DetailRow label={t("postal.message.tag")}>
                  {details?.tag}
                </DetailRow>
                <DetailRow label={t("postal.message.sent_at")}>
                  {formatDateTime(fromEpochSeconds(details?.timestamp))}
                </DetailRow>
                <DetailRow label={t("postal.message.message_id")}>
                  {details?.message_id}
                </DetailRow>
              </div>

              <div className="flex flex-col gap-y-3">
                <Text size="small" leading="compact" weight="plus">
                  {t("postal.message.deliveries")}
                </Text>
                {data.deliveries.length === 0 ? (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {t("postal.message.no_deliveries")}
                  </Text>
                ) : (
                  data.deliveries.map((delivery) => (
                    <DeliveryAttempt key={delivery.id} delivery={delivery} />
                  ))
                )}
              </div>
            </>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">
              {t("postal.message.close")}
            </Button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

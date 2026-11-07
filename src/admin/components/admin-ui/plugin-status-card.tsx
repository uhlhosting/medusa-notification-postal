import type { ReactNode } from "react";
import { Container, Skeleton, StatusBadge, Text, clx } from "@medusajs/ui";
import type { PluginIcon, PluginStatusColor } from "./types";
import { statusColorClass } from "./utils";

type PluginStatusCardProps = {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: PluginIcon;
  color?: PluginStatusColor;
  statusLabel?: ReactNode;
  isLoading?: boolean;
  className?: string;
};

export const PluginStatusCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = "grey",
  statusLabel,
  isLoading = false,
  className,
}: PluginStatusCardProps) => {
  return (
    <Container className={clx("p-0", className)}>
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-col gap-y-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={clx("size-4", statusColorClass(color))} />
            )}
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-subtle"
            >
              {title}
            </Text>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <Text as="div" size="xlarge" leading="compact" weight="plus">
              {value}
            </Text>
          )}
          {description && (
            <Text size="small" leading="compact" className="text-ui-fg-muted">
              {description}
            </Text>
          )}
        </div>
        {statusLabel && <StatusBadge color={color}>{statusLabel}</StatusBadge>}
      </div>
    </Container>
  );
};

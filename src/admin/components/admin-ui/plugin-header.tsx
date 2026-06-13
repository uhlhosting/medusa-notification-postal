import type { ReactNode } from "react";
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  clx,
} from "@medusajs/ui";
import type {
  PluginHeaderAction,
  PluginHeaderLink,
  PluginStatusColor,
} from "./types";

type PluginHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  statusLabel?: ReactNode;
  statusColor?: PluginStatusColor;
  lastSuccessfulExecution?: ReactNode;
  actions?: PluginHeaderAction;
  helpLinks?: PluginHeaderLink[];
  className?: string;
};

export const PluginHeader = ({
  title,
  description,
  statusLabel,
  statusColor = "grey",
  lastSuccessfulExecution,
  actions,
  helpLinks = [],
  className,
}: PluginHeaderProps) => {
  return (
    <Container className={clx("divide-y p-0", className)}>
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level="h1">{title}</Heading>
            {statusLabel && (
              <StatusBadge color={statusColor}>{statusLabel}</StatusBadge>
            )}
          </div>
          {description && (
            <Text
              size="small"
              leading="compact"
              className="max-w-3xl text-ui-fg-subtle"
            >
              {description}
            </Text>
          )}
          {lastSuccessfulExecution && (
            <Text size="small" leading="compact" className="text-ui-fg-muted">
              {lastSuccessfulExecution}
            </Text>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {helpLinks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-3">
          {helpLinks.map((link) => (
            <Button key={link.href} asChild size="small" variant="transparent">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      )}
    </Container>
  );
};

export const Header = PluginHeader;

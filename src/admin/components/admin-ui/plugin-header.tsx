import type { ReactNode } from "react";
import { ArrowUpRightOnBox, BookOpen } from "@medusajs/icons";
import {
  Button,
  Container,
  DropdownMenu,
  Heading,
  StatusBadge,
  Text,
  clx,
} from "@medusajs/ui";
import type {
  PluginHeaderLink,
  PluginStatusColor,
} from "./types";

type PluginHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  statusLabel?: ReactNode;
  statusColor?: PluginStatusColor;
  lastSuccessfulExecution?: ReactNode;
  actions?: ReactNode;
  helpLinks?: PluginHeaderLink[];
  helpMenuLabel?: string;
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
  helpMenuLabel,
  className,
}: PluginHeaderProps) => {
  const hasHelp = helpLinks.length > 0 && Boolean(helpMenuLabel);

  return (
    <Container className={clx("p-0", className)}>
      <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-start md:justify-between">
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
              className="max-w-3xl break-words text-ui-fg-subtle"
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
        {(actions || hasHelp) && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {hasHelp && (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button size="small" variant="secondary">
                    <BookOpen />
                    {helpMenuLabel}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  {helpLinks.map((link) => (
                    <DropdownMenu.Item
                      key={link.href}
                      asChild
                      className="gap-x-2"
                    >
                      <a href={link.href} target="_blank" rel="noreferrer">
                        <ArrowUpRightOnBox className="text-ui-fg-subtle" />
                        {link.label}
                      </a>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

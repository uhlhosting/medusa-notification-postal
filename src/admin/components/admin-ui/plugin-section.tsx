import type { ReactNode } from "react";
import { Container, Heading, Text, clx } from "@medusajs/ui";

type PluginSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export const PluginSection = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: PluginSectionProps) => {
  return (
    <Container className={clx("divide-y p-0", className)}>
      <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-y-1">
          <Heading level="h2">{title}</Heading>
          {description && (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {description}
            </Text>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children && (
        <div className={clx("px-6 py-4", bodyClassName)}>{children}</div>
      )}
    </Container>
  );
};

type PluginSidebarSectionProps = {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const PluginSidebarSection = ({
  title,
  icon,
  children,
  className,
}: PluginSidebarSectionProps) => {
  return (
    <Container className={clx("divide-y p-0", className)}>
      <div className="flex items-center gap-x-2 px-6 py-4 text-ui-fg-subtle">
        {icon}
        <Text size="small" leading="compact" weight="plus">
          {title}
        </Text>
      </div>
      <div className="px-6 py-4">{children}</div>
    </Container>
  );
};

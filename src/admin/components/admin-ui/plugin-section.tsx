import type { ReactNode } from "react";
import { Container, Heading, Text, clx } from "@medusajs/ui";

type PluginSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  // Render the body edge to edge, with no padding of its own. Use it for a
  // DataTable, which pads its own toolbar and rows the way Medusa's list pages
  // do. A `p-0` in `bodyClassName` cannot do this: it overrides the base
  // padding but not the `sm:px-6` variant, so the table stays inset on desktop.
  flush?: boolean;
};

export const PluginSection = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: PluginSectionProps) => {
  return (
    <Container className={clx("divide-y p-0", className)}>
      <div className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-y-1">
          <Heading level="h2">{title}</Heading>
          {description && (
            <Text
              size="small"
              leading="compact"
              className="break-words text-ui-fg-subtle"
            >
              {description}
            </Text>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children && (
        <div
          className={clx(
            "min-w-0",
            !flush && "px-4 py-4 sm:px-6",
            bodyClassName
          )}
        >
          {children}
        </div>
      )}
    </Container>
  );
};

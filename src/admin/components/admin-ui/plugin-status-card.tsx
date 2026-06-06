import type { ReactNode } from "react"
import { Container, StatusBadge, Text } from "@medusajs/ui"
import type { PluginIcon, PluginStatusColor } from "./types"
import { classNames, statusColorClass } from "./utils"

type PluginStatusCardProps = {
  title: ReactNode
  value: ReactNode
  description?: ReactNode
  icon?: PluginIcon
  color?: PluginStatusColor
  statusLabel?: ReactNode
  className?: string
}

export const PluginStatusCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = "grey",
  statusLabel,
  className,
}: PluginStatusCardProps) => {
  return (
    <Container className={classNames("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-y-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={classNames("size-4", statusColorClass(color))} />}
            <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
              {title}
            </Text>
          </div>
          <div className="txt-compact-xlarge-plus text-ui-fg-base">
            {value}
          </div>
          {description && (
            <div className="txt-compact-small text-ui-fg-muted">
              {description}
            </div>
          )}
        </div>
        {statusLabel && <StatusBadge color={color}>{statusLabel}</StatusBadge>}
      </div>
    </Container>
  )
}

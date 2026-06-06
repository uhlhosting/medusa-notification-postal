import type { ReactNode } from "react"
import { classNames } from "./utils"

type PluginShellProps = {
  children: ReactNode
  className?: string
}

export const PluginShell = ({ children, className }: PluginShellProps) => {
  return (
    <div className={classNames("flex flex-col gap-y-6 p-8", className)}>
      {children}
    </div>
  )
}

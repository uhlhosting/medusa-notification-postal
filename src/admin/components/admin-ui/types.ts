import type { ComponentType, ReactNode } from "react";

export type PluginStatusColor =
  | "green"
  | "red"
  | "orange"
  | "blue"
  | "grey"
  | "purple";

export type PluginCheckStatus = "success" | "warning" | "error" | "neutral";

export type PluginJobStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type PluginHeaderLink = {
  label: string;
  href: string;
};

export type PluginHeaderAction = ReactNode;

export type PluginIcon = ComponentType<{ className?: string }>;

export type PluginMetric = {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: PluginIcon;
  color?: PluginStatusColor;
};

export type PluginValidationItem = {
  id: string;
  label: ReactNode;
  status: PluginCheckStatus;
  message?: ReactNode;
};

export type PluginJobStep = {
  id: string;
  label: ReactNode;
  status: PluginJobStepStatus;
  detail?: ReactNode;
  duration?: ReactNode;
};

export type PluginTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  className?: string;
};

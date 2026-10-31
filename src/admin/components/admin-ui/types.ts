import type { ComponentType } from "react";

export type PluginStatusColor =
  | "green"
  | "red"
  | "orange"
  | "blue"
  | "grey"
  | "purple";

export type PluginHeaderLink = {
  label: string;
  href: string;
};

export type PluginIcon = ComponentType<{ className?: string }>;

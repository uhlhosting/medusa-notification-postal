import { LayoutComposer } from "@medusajs/dashboard/components";
import type { ReactNode } from "react";

export const SingleColumnLayout = ({ children }: { children?: ReactNode }) => {
  return <LayoutComposer preferredLayoutId="core:single-column" sections={{ main: children }} widgetsZonePrefix="" />;
};

export const TwoColumnLayout = ({ firstCol, secondCol }: { firstCol?: ReactNode; secondCol?: ReactNode }) => {
  return <LayoutComposer preferredLayoutId="core:two-column" sections={{ main: firstCol, side: secondCol }} widgetsZonePrefix="" />;
};

export const PluginShell = SingleColumnLayout;


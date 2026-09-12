import { LayoutComposer } from "@medusajs/dashboard/components";







export const SingleColumnLayout = ({ children }: any) => {
  return <LayoutComposer preferredLayoutId="core:single-column" sections={{ main: children }} widgetsZonePrefix="" />;
};

export const TwoColumnLayout = ({ firstCol, secondCol }: any) => {
  return <LayoutComposer preferredLayoutId="core:two-column" sections={{ main: firstCol, side: secondCol }} widgetsZonePrefix="" />;
};

export const PluginShell = SingleColumnLayout;

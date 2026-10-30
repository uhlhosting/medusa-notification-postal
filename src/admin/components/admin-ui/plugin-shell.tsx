import type { ReactNode } from "react";
import { clx } from "@medusajs/ui";

type PluginShellProps = {
  children?: ReactNode;
  className?: string;
};

// A plain column of Containers, the same structure Medusa's own detail pages
// use. This deliberately does not wrap the page in the dashboard's
// `LayoutComposer`: that is internal to `@medusajs/dashboard` rather than part
// of the public admin API, and with an empty widget-zone prefix it requests
// `/admin/layouts//configuration` (a 404) on every render.
export const PluginShell = ({ children, className }: PluginShellProps) => {
  return (
    <div className={clx("flex flex-col gap-y-3", className)}>{children}</div>
  );
};

export const SingleColumnLayout = PluginShell;

type TwoColumnLayoutProps = {
  firstCol?: ReactNode;
  secondCol?: ReactNode;
};

export const TwoColumnLayout = ({
  firstCol,
  secondCol,
}: TwoColumnLayoutProps) => {
  return (
    <div className="flex flex-col gap-x-4 gap-y-3 xl:flex-row xl:items-start">
      <div className="flex w-full min-w-0 flex-col gap-y-3">{firstCol}</div>
      <div className="flex w-full min-w-0 flex-col gap-y-3 xl:max-w-[440px]">
        {secondCol}
      </div>
    </div>
  );
};

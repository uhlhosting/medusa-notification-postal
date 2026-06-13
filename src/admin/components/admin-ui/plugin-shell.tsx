import type { ReactNode } from "react";
import { clx } from "@medusajs/ui";

type SingleColumnLayoutProps = {
  children: ReactNode;
  className?: string;
};

type TwoColumnLayoutProps = {
  firstCol: ReactNode;
  secondCol: ReactNode;
  className?: string;
};

export const SingleColumnLayout = ({
  children,
  className,
}: SingleColumnLayoutProps) => {
  return (
    <div className={clx("flex flex-col gap-y-3", className)}>{children}</div>
  );
};

export const TwoColumnLayout = ({
  firstCol,
  secondCol,
  className,
}: TwoColumnLayoutProps) => {
  return (
    <div
      className={clx(
        "flex flex-col gap-x-4 gap-y-3 xl:flex-row xl:items-start",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-y-3">{firstCol}</div>
      <div className="flex w-full max-w-full flex-col gap-y-3 xl:max-w-[440px]">
        {secondCol}
      </div>
    </div>
  );
};

export const PluginShell = SingleColumnLayout;

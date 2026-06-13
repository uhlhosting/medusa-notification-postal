export const classNames = (
  ...values: Array<string | false | null | undefined>
) => values.filter(Boolean).join(" ");

export const statusColorClass = (color?: string) => {
  if (color === "green") return "text-ui-fg-success";
  if (color === "red") return "text-ui-fg-error";
  if (color === "orange") return "text-ui-fg-warning";
  if (color === "blue" || color === "purple") return "text-ui-fg-interactive";
  return "text-ui-fg-subtle";
};

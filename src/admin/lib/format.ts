// Postal reports times as float seconds since the epoch, Medusa as ISO strings.
export const fromEpochSeconds = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

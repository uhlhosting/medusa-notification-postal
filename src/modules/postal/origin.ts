// Origin normalization for the webhook-url route. Kept dependency-free.
export const toAbsoluteOrigin = (value: unknown): string | null => {
  const candidate = typeof value === "string" ? value.trim() : String(value || "").trim()

  if (!candidate) {
    return null
  }

  try {
    return new URL(candidate).origin.replace(/\/+$/, "")
  } catch {
    return null
  }
}

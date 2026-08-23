// Origin normalization shared by the server (webhook-url route) and the admin
// bundle (backend-url helper). Kept dependency-free so it is safe to import
// from both sides.
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

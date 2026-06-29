const DEFAULT_BACKEND_ORIGIN = "http://localhost:9000";

export const toAbsoluteOrigin = (
  value: string | undefined | null,
): string | null => {
  const candidate = typeof value === "string" ? value.trim() : "";

  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate).origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
};

export const resolveBackendBaseUrl = (
  candidate: string | undefined | null,
  fallbackOrigin?: string | undefined | null,
) => {
  const absoluteCandidate = toAbsoluteOrigin(candidate);

  if (absoluteCandidate) {
    return absoluteCandidate;
  }

  const absoluteFallback = toAbsoluteOrigin(fallbackOrigin);
  if (absoluteFallback) {
    return absoluteFallback;
  }

  return DEFAULT_BACKEND_ORIGIN;
};

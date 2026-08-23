import { toAbsoluteOrigin } from "../../modules/postal/origin";

const DEFAULT_BACKEND_ORIGIN = "/";

export { toAbsoluteOrigin };

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

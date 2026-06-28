import Medusa from "@medusajs/js-sdk";

const runtimeEnv =
  (globalThis as { __VITE_ENV__?: Record<string, string | boolean> })
    .__VITE_ENV__ ?? {};
const backendUrl =
  ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined) ??
  (typeof runtimeEnv.VITE_BACKEND_URL === "string"
    ? runtimeEnv.VITE_BACKEND_URL
    : undefined) ??
  "/";

const isDev =
  ((import.meta as any).env?.NODE_ENV === "development" || (import.meta as any).env?.MODE === "development") ||
  runtimeEnv.DEV === true ||
  runtimeEnv.DEV === "true";

const toAbsoluteOrigin = (value: string | undefined | null) => {
  const candidate = typeof value === "string" ? value.trim() : ""
  if (!candidate) {
    return null
  }

  try {
    return new URL(candidate).origin.replace(/\/+$/, "")
  } catch {
    return null
  }
}

export const sdk = new Medusa({
  baseUrl: backendUrl,
  debug: Boolean(isDev),
  auth: {
    type: "session",
  },
});

export const getBackendBaseUrl = () => backendUrl;

export const getPublicBackendBaseUrl = () => {
  const absoluteBackend = toAbsoluteOrigin(backendUrl)
  if (absoluteBackend) {
    return absoluteBackend
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const absoluteWindow = toAbsoluteOrigin(window.location.origin)
    if (absoluteWindow) {
      return absoluteWindow
    }
  }

  return "http://localhost:9000"
}

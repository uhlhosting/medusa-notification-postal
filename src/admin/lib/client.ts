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

export const sdk = new Medusa({
  baseUrl: backendUrl,
  debug: Boolean(isDev),
  auth: {
    type: "session",
  },
});

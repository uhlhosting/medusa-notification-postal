import Medusa from "@medusajs/js-sdk";

// The dashboard session is shared with the plugin (AGENTS.md invariant 17), so
// every request carries the admin's own credentials.
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
});

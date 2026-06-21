import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Envelope } from "@medusajs/icons";

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope as any,
});

export { PostalSettingsPage as default } from "../../plugin-settings/postal/page";

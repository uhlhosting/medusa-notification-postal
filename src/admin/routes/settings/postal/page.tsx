import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Envelope } from "@medusajs/icons";
import { PostalSettingsPage } from "../../../components/postal/settings-page";

export const config = defineRouteConfig({
  label: "Postal",
  icon: Envelope,
});

export default PostalSettingsPage;

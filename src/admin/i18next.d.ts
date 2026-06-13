import type { Resources } from "@medusajs/dashboard";
import en from "./i18n/json/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    fallbackNS: "translation";
    defaultNS: "translation";
    resources: {
      translation: typeof en & Resources["translation"];
    };
  }
}

// A checked .ts file, not a .d.ts: skipLibCheck skips every declaration file,
// so an unresolvable "@medusajs/dashboard" there silently turned Resources into
// `any` and typecheck:admin passed without checking any translation keys.
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

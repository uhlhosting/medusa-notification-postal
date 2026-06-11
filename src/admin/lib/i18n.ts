import i18n from "i18next"

import resources from "../i18n"

let registered = false

export const ensurePostalAdminTranslations = () => {
  if (registered) {
    return
  }

  for (const [locale, bundle] of Object.entries(resources)) {
    const translation = (bundle as { translation?: Record<string, string> }).translation
    if (translation) {
      i18n.addResourceBundle(locale, "translation", translation, true, true)
    }
  }

  registered = true
}

/**
 * Options passed to the plugin entry in `medusa-config`:
 *
 * ```ts
 * plugins: [
 *   {
 *     resolve: "@uhlhosting/medusa-notification-postal",
 *     options: {
 *       notification_retention_days: 90,
 *       webhook_event_retention_days: 90,
 *       ignore_engagement_webhooks: true,
 *     },
 *   },
 * ]
 * ```
 *
 * Medusa hands a plugin's options to every module inside it, so the
 * `postalPlugin` module service receives them and the scheduled jobs and the
 * webhook step read them from there at run time. Every option is off unless
 * set, so a store that upgrades without configuring anything behaves exactly
 * as before.
 */
export type PostalPluginOptions = {
  /**
   * Hard-delete every row in Medusa's core `notification` table created more
   * than this many days ago, whatever its provider, channel, template or
   * resource. Unset (or not a positive whole number) = off.
   */
  notification_retention_days?: number | string | null
  /**
   * Hard-delete `postal_webhook_events` rows (recipient address and raw
   * payload) created more than this many days ago. Unset = off.
   */
  webhook_event_retention_days?: number | string | null
  /**
   * Do not record or emit `MessageLinkClicked` and `MessageLoaded` callbacks.
   * They describe what a recipient did with a message, not whether it was
   * delivered. Default false.
   */
  ignore_engagement_webhooks?: boolean | string | null
}

export type ResolvedRetentionOption = {
  /** Whole days, or null when the option is off. */
  days: number | null
  /** True when a value was given but could not be used, so it is off. */
  invalid: boolean
}

export type ResolvedPostalPluginOptions = {
  notification_retention_days: ResolvedRetentionOption
  webhook_event_retention_days: ResolvedRetentionOption
  ignore_engagement_webhooks: boolean
}

// Twenty years. Anything longer is almost certainly a unit mistake (for
// example milliseconds), and treating it as "off" is the safer reading than
// computing a cutoff before the epoch.
export const MAX_RETENTION_DAYS = 7300

const TRUTHY = new Set(["1", "true", "yes", "on"])

export const resolveRetentionDays = (
  value: unknown
): ResolvedRetentionOption => {
  if (value === undefined || value === null || value === "") {
    return { days: null, invalid: false }
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\s*\d+\s*$/.test(value)
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_RETENTION_DAYS
  ) {
    return { days: null, invalid: true }
  }

  return { days: parsed, invalid: false }
}

const resolveFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  return TRUTHY.has(String(value ?? "").trim().toLowerCase())
}

export const resolvePostalPluginOptions = (
  options: PostalPluginOptions | Record<string, unknown> | null | undefined
): ResolvedPostalPluginOptions => {
  const raw = (options ?? {}) as PostalPluginOptions

  return {
    notification_retention_days: resolveRetentionDays(
      raw.notification_retention_days
    ),
    webhook_event_retention_days: resolveRetentionDays(
      raw.webhook_event_retention_days
    ),
    ignore_engagement_webhooks: resolveFlag(raw.ignore_engagement_webhooks),
  }
}

/**
 * The part of the plugin module service the jobs and the webhook step read.
 * Callers treat a missing method as "every option off", which is what an
 * older module service or an unregistered module means.
 */
export type PostalPluginOptionsReader = {
  getPluginOptions?: () => ResolvedPostalPluginOptions
}

export const readPostalPluginOptions = (
  service: PostalPluginOptionsReader | null | undefined
): ResolvedPostalPluginOptions =>
  typeof service?.getPluginOptions === "function"
    ? service.getPluginOptions()
    : resolvePostalPluginOptions(undefined)

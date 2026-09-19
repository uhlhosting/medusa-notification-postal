import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../modules/postal/constants"
import {
  readPostalPluginOptions,
  type PostalPluginOptionsReader,
  type ResolvedPostalPluginOptions,
  type ResolvedRetentionOption,
} from "../modules/postal/options"
import type {
  RetentionStepInput,
  RetentionStepResult,
} from "../workflows/steps/retention"

type RetentionLogger = {
  info: (message: string) => void
  warn: (message: string) => void
}

export type RunRetentionJobInput = {
  container: MedusaContainer
  /** Plugin option this job is governed by; also used in log lines. */
  option: "notification_retention_days" | "webhook_event_retention_days"
  /** What the log line calls the deleted rows. */
  label: string
  run: (input: RetentionStepInput) => Promise<{ result: RetentionStepResult }>
  now?: () => Date
}

/**
 * Shared body of the retention jobs. Inert unless the governing option is a
 * positive whole number: a store that has not opted in never runs the
 * workflow, so upgrading changes nothing for it. Logs counts and cutoffs only,
 * never recipients or content.
 */
export const runRetentionJob = async ({
  container,
  option,
  label,
  run,
  now = () => new Date(),
}: RunRetentionJobInput): Promise<RetentionStepResult | null> => {
  const service = resolvePostalModule<PostalPluginOptionsReader>(container)
  const options: ResolvedPostalPluginOptions = readPostalPluginOptions(service)
  const setting: ResolvedRetentionOption = options[option]

  if (setting.days === null) {
    if (setting.invalid) {
      const logger = container.resolve(
        ContainerRegistrationKeys.LOGGER
      ) as RetentionLogger
      logger.warn(
        `[postal] Plugin option ${option} is not a whole number of days between 1 and 7300, so ${label} are not being purged.`
      )
    }
    return null
  }

  const { result } = await run({
    now: now().toISOString(),
    retention_days: setting.days,
  })

  if (result.deleted > 0) {
    const logger = container.resolve(
      ContainerRegistrationKeys.LOGGER
    ) as RetentionLogger
    logger.info(
      `[postal] Deleted ${result.deleted} ${label} created before ${result.cutoff}.`
    )
  }

  return result
}

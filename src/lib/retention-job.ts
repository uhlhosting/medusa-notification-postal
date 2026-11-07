import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolvePostalModule } from "../modules/postal/constants"
import {
  readPostalPluginOptions,
  type PostalPluginOptionsReader,
  type ResolvedPostalPluginOptions,
  type ResolvedRetentionOption,
} from "../modules/postal/options"
import {
  RETENTION_BATCH_SIZE,
  RETENTION_MAX_BATCHES,
  type RetentionStepInput,
  type RetentionStepResult,
} from "../workflows/steps/retention"

// A run deletes at most this many rows; reaching it means expired rows may
// remain for later runs.
const RETENTION_RUN_LIMIT = RETENTION_BATCH_SIZE * RETENTION_MAX_BATCHES

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
  const options: ResolvedPostalPluginOptions = await readPostalPluginOptions(service)
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
    if (result.deleted >= RETENTION_RUN_LIMIT) {
      logger.warn(
        `[postal] Stopped at the per-run limit of ${RETENTION_RUN_LIMIT} ${label}; older rows created before ${result.cutoff} may remain and are deleted by later runs.`
      )
    }
  }

  return result
}

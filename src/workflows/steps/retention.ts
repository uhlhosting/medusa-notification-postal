import { MedusaError } from "@medusajs/framework/utils"

const DAY_MS = 24 * 60 * 60 * 1000

/** Rows listed and deleted per round trip. */
export const RETENTION_BATCH_SIZE = 500
/**
 * A ceiling on rounds per run, so a delete that silently removes nothing
 * cannot loop forever. 200 x 500 = 100,000 rows a night; anything left over is
 * picked up by the next run.
 */
export const RETENTION_MAX_BATCHES = 200

export type RetentionStepInput = {
  /** ISO timestamp the retention period is measured back from. */
  now: string
  /** Whole days to keep; older rows are deleted. */
  retention_days: number
}

export type RetentionStepResult = {
  deleted: number
  cutoff: string
}

export const retentionCutoff = (now: Date, retentionDays: number): Date =>
  new Date(now.getTime() - retentionDays * DAY_MS)

/**
 * Validates the input and returns the cutoff. Throws, rather than guessing,
 * on a timestamp or period it cannot measure from: a wrong cutoff would
 * delete rows that are still inside their retention period.
 */
export const resolveRetentionCutoff = (input: RetentionStepInput): Date => {
  const now = new Date(input.now)
  if (Number.isNaN(now.getTime())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "now must be an ISO timestamp"
    )
  }

  if (!Number.isInteger(input.retention_days) || input.retention_days < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "retention_days must be a positive whole number"
    )
  }

  return retentionCutoff(now, input.retention_days)
}

/**
 * Lists ids created before the cutoff and deletes them, batch by batch, until
 * a short batch shows nothing older is left.
 */
export const deleteCreatedBefore = async (
  cutoff: Date,
  list: (
    filters: Record<string, unknown>,
    config: { select: string[]; take: number }
  ) => Promise<Array<{ id: string }>>,
  remove: (ids: string[]) => Promise<unknown>
): Promise<number> => {
  let deleted = 0

  for (let batchIndex = 0; batchIndex < RETENTION_MAX_BATCHES; batchIndex += 1) {
    const batch = await list(
      { created_at: { $lt: cutoff } },
      { select: ["id"], take: RETENTION_BATCH_SIZE }
    )

    if (!batch.length) {
      break
    }

    await remove(batch.map((row) => row.id))
    deleted += batch.length

    if (batch.length < RETENTION_BATCH_SIZE) {
      break
    }
  }

  return deleted
}

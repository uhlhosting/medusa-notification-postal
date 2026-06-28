import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ContainerLike = {
  resolve: (key: string) => unknown
}

const PG_CONNECTION_KEYS = [
  ContainerRegistrationKeys.PG_CONNECTION,
  "pgConnection",
  "__pg_connection__",
  "manager",
] as const

export const resolveOptionalPgConnection = (container: ContainerLike) => {
  for (const key of PG_CONNECTION_KEYS) {
    try {
      const connection = container.resolve(key)
      if (
        connection &&
        (typeof (connection as any).raw === "function" ||
          typeof (connection as any).query === "function")
      ) {
        return connection
      }
    } catch {
      // Try the next registered connection alias.
    }
  }

  return null
}

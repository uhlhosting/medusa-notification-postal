import type PostalPluginModuleService from "../service"
import { Migration20261102112047 } from "../migrations/Migration20261102112047"

// 1.0.0 shipped its replay migration under a name the Mautic plugin also uses.
// Where Mautic migrated first, Medusa recorded the name and skipped this schema.
// The renamed migration must repair that state, and must not mark current
// unpublished receipts as published where the old name did run.
const upSql = async () => {
  const sql: string[] = []
  const migration = Object.create(Migration20261102112047.prototype) as Migration20261102112047
  ;(migration as unknown as { addSql: (statement: string) => void }).addSql = (statement) => {
    sql.push(statement)
  }
  await migration.up()
  return sql
}

/** Share the existing module boot: Medusa's registry is process-global. */
export function registerMigrationCollisionCases(service: PostalPluginModuleService) {
  const manager = () => (service as any).baseRepository_.getFreshManager()
  const insertEvent = (id: string, columns = "", values = "") =>
    manager().execute(`insert into postal_webhook_events (id, event_type, status, payload${columns}) values ('${id}', 'MessageSent', 'sent', '{}'${values})`)

  it("leaves current unpublished receipts unpublished where the schema already exists", async () => {
    await insertEvent("evt_current_unpublished", ", replay_key", ", 'replay-current'")
    for (const sql of await upSql()) await manager().execute(sql)
    const [row] = await manager().execute(`select published_at from postal_webhook_events where id = 'evt_current_unpublished'`)
    expect(row.published_at).toBeNull()
  })

  it("builds the skipped schema and marks historical callbacks published", async () => {
    await manager().execute(`drop index "IDX_postal_webhook_replay_unique"; alter table postal_webhook_events drop column replay_key, drop column published_at, drop column publication_owner, drop column publication_expires_at;`)
    await insertEvent("evt_historical")
    for (const sql of await upSql()) await manager().execute(sql)
    const [row] = await manager().execute(`select published_at, created_at from postal_webhook_events where id = 'evt_historical'`)
    expect(row.published_at).toEqual(row.created_at)
    const columns = await manager().execute(`select column_name from information_schema.columns where table_name = 'postal_webhook_events' and column_name in ('replay_key', 'published_at', 'publication_owner', 'publication_expires_at') order by column_name`)
    expect(columns).toHaveLength(4)
    const [index] = await manager().execute(`select indexname from pg_indexes where indexname = 'IDX_postal_webhook_replay_unique'`)
    expect(index).toBeDefined()
  })
}

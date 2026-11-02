import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { Migration20261102112047 } from "./migrations/Migration20261102112047"

const upSql = async () => {
  const sql: string[] = []
  const migration = Object.create(Migration20261102112047.prototype) as Migration20261102112047
  ;(migration as unknown as { addSql: (statement: string) => void }).addSql = (statement) => {
    sql.push(statement)
  }
  await migration.up()
  return sql
}

test("marks historical callbacks published only while replay_key is absent", async () => {
  const sql = await upSql()
  assert.equal(sql.length, 5)
  assert.match(sql[0], /attname = 'replay_key'/)
  assert.match(sql[0], /set published_at = created_at/)
  for (const statement of sql.slice(1)) {
    assert.match(statement, /if (not )?exists/)
    assert.doesNotMatch(statement, /\bupdate\b|\bdelete\b/i)
  }
})

test("never ships the migration name another first-party plugin already recorded", () => {
  const names = readdirSync(join(__dirname, "migrations"))
    .filter((file) => /^Migration\d+\.ts$/.test(file))
    .map((file) => file.replace(/\.ts$/, ""))
  // Recorded by @uhlhosting/medusa-plugin-marketing-mautic 2.0.0 in the shared
  // mikro_orm_migrations table; reusing it silently skips one of the two.
  assert.ok(!names.includes("Migration20261011120000"))
})

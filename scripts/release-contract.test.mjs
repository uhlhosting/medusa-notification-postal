import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
const require = createRequire(import.meta.url)
const semanticRequire = createRequire(require.resolve("semantic-release"))
const { analyzeCommits } = await import(pathToFileURL(semanticRequire.resolve("@semantic-release/commit-analyzer")))
const { generateNotes } = await import(pathToFileURL(semanticRequire.resolve("@semantic-release/release-notes-generator")))
const config = JSON.parse(readFileSync(new URL("../.releaserc.json", import.meta.url)))
const analyzer = config.plugins.find(p => Array.isArray(p) && p[0] === "@semantic-release/commit-analyzer")[1]
const notes = config.plugins.find(p => Array.isArray(p) && p[0] === "@semantic-release/release-notes-generator")[1]
const cases = [["fix(postal)!: change module contract", "major"], ["fix!: change contract", "major"], ["fix(postal): change contract\n\nBREAKING CHANGE: Requires module locking and journal migration.", "major"], ["fix(postal): repair retry", "patch"], ["feat(postal): add support", "minor"], ["chore(deps): update compatible dependency", "patch"], ["perf(postal): bound work", "patch"], ["chore: preserve release contract", null], ["ci: enforce scanner gate", null], ["refactor: clarify helper", null], ["docs: clarify setup", null]]
for (const [message, expected] of cases) {
  test(`actual semantic-release contract: ${message.split("\n")[0]}`, async () => {
    const context = { cwd: process.cwd(), commits: [{ hash: "0123456789abcdef", message }], logger: { log() {} }, options: { repositoryUrl: config.repositoryUrl }, lastRelease: { version: "1.0.0", gitTag: "v1.0.0" }, nextRelease: { version: "1.0.0", gitTag: "v1.0.0" } }
    assert.equal(await analyzeCommits(analyzer, context), expected)
    if (expected === "major") assert.match(await generateNotes(notes, context), /BREAKING CHANGES/)
  })
}

test("reproduces legacy Angular parser ignoring the merged breaking header", async () => {
  const message = "fix(postal)!: harden native sync and module boundaries"
  const context = { cwd: process.cwd(), commits: [{ hash: "synthetic", message }], logger: { log() {} } }
  assert.equal(await analyzeCommits({ releaseRules: analyzer.releaseRules }, context), null)
  assert.equal(await analyzeCommits(analyzer, context), "major")
})

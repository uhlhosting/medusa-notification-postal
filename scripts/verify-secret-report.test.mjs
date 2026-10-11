import { test } from "node:test"
import assert from "node:assert/strict"
import { verifySecretReport } from "./verify-secret-report.mjs"
const valid = { version: "15.2.1", scan: { type: "secret_detection", status: "success" }, vulnerabilities: [] }
test("accepts successful empty scanner report", () => assert.equal(verifySecretReport(valid), 0))
for (const invalid of [undefined, {}, { ...valid, vulnerabilities: null }, { ...valid, vulnerabilities: [{}] }, { ...valid, scan: { type: "secret_detection", status: "failure" } }, { ...valid, version: null }]) {
  test("rejects missing, malformed, unsuccessful or nonempty scanner report", () => assert.throws(() => verifySecretReport(invalid)))
}

test("fixed-path CLI fails closed without leaking report content", async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const { join } = await import("node:path")
  const { fileURLToPath } = await import("node:url")
  const { spawnSync } = await import("node:child_process")
  const directory = mkdtempSync(join(tmpdir(), "postal-secret-gate-"))
  const checker = fileURLToPath(new URL("./verify-secret-report.mjs", import.meta.url))
  const run = () => spawnSync(process.execPath, [checker, "alternate.json"], { cwd: directory, encoding: "utf8" })
  try {
    writeFileSync(join(directory, "alternate.json"), JSON.stringify(valid))
    assert.equal(run().status, 1)
    for (const report of ["not-json-SYNTHETIC_SENTINEL", JSON.stringify({ ...valid, scan: { type: "secret_detection", status: "failure" } }), JSON.stringify({ ...valid, vulnerabilities: [{ raw_source_code_extract: "SYNTHETIC_SENTINEL" }] })]) {
      writeFileSync(join(directory, "gl-secret-detection-report.json"), report)
      const result = run()
      assert.equal(result.status, 1)
      assert.doesNotMatch(result.stdout + result.stderr, /SYNTHETIC_SENTINEL/)
    }
    writeFileSync(join(directory, "gl-secret-detection-report.json"), JSON.stringify(valid))
    assert.equal(run().status, 0)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

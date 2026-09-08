import test from "node:test"
import assert from "node:assert/strict"
import { normalizeRecipients } from "./send-postal-email"

test("normalizeRecipients", async (t) => {
  await t.test("handles single valid string", () => {
    assert.deepEqual(normalizeRecipients("test@example.com"), ["test@example.com"])
  })

  await t.test("handles single valid string with whitespace", () => {
    assert.deepEqual(normalizeRecipients("  test@example.com  "), ["test@example.com"])
  })

  await t.test("handles single empty string", () => {
    assert.deepEqual(normalizeRecipients(""), [])
  })

  await t.test("handles single whitespace string", () => {
    assert.deepEqual(normalizeRecipients("   "), [])
  })

  await t.test("handles array of valid strings", () => {
    assert.deepEqual(
      normalizeRecipients(["test1@example.com", "test2@example.com"]),
      ["test1@example.com", "test2@example.com"]
    )
  })

  await t.test("handles array of strings with whitespace", () => {
    assert.deepEqual(
      normalizeRecipients([" test1@example.com ", "  test2@example.com"]),
      ["test1@example.com", "test2@example.com"]
    )
  })

  await t.test("handles array with mixed valid and empty/whitespace strings", () => {
    assert.deepEqual(
      normalizeRecipients(["test1@example.com", "", "   ", "test2@example.com"]),
      ["test1@example.com", "test2@example.com"]
    )
  })
})

import test from "node:test"
import assert from "node:assert/strict"
import { toAbsoluteOrigin } from "./origin"

test("toAbsoluteOrigin", async (t) => {
  await t.test("returns valid origin for standard URLs", () => {
    assert.equal(toAbsoluteOrigin("http://example.com"), "http://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com"), "https://example.com")
    assert.equal(toAbsoluteOrigin("http://localhost:3000"), "http://localhost:3000")
  })

  await t.test("strips paths, queries, and fragments", () => {
    assert.equal(toAbsoluteOrigin("https://example.com/path"), "https://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com/path?query=1"), "https://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com/path#fragment"), "https://example.com")
  })

  await t.test("strips trailing slashes from the origin", () => {
    assert.equal(toAbsoluteOrigin("https://example.com/"), "https://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com//"), "https://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com///"), "https://example.com")
  })

  await t.test("handles non-string inputs", () => {
    assert.equal(toAbsoluteOrigin(null), null)
    assert.equal(toAbsoluteOrigin(undefined), null)
    assert.equal(toAbsoluteOrigin({}), null)
    assert.equal(toAbsoluteOrigin(123), null)
  })

  await t.test("handles invalid URL strings", () => {
    assert.equal(toAbsoluteOrigin("not-a-url"), null)
    assert.equal(toAbsoluteOrigin("http//example.com"), null)
    assert.equal(toAbsoluteOrigin(""), null)
    assert.equal(toAbsoluteOrigin("   "), null)
  })
})

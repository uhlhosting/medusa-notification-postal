import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { toAbsoluteOrigin } from "./origin"

describe("toAbsoluteOrigin", () => {
  it("should return the origin for a valid http url", () => {
    assert.equal(toAbsoluteOrigin("http://localhost:9000"), "http://localhost:9000")
  })

  it("should return the origin for a valid https url", () => {
    assert.equal(toAbsoluteOrigin("https://example.com"), "https://example.com")
  })

  it("should remove paths and query parameters", () => {
    assert.equal(toAbsoluteOrigin("https://example.com/foo/bar?baz=qux"), "https://example.com")
  })

  it("should remove trailing slashes", () => {
    assert.equal(toAbsoluteOrigin("https://example.com/"), "https://example.com")
    assert.equal(toAbsoluteOrigin("https://example.com///"), "https://example.com")
  })

  it("should trim leading and trailing spaces", () => {
    assert.equal(toAbsoluteOrigin("  https://example.com  "), "https://example.com")
  })

  it("should handle non-string inputs that stringify to a valid URL", () => {
    assert.equal(toAbsoluteOrigin({ toString: () => "https://example.com" }), "https://example.com")
  })

  it("should return null for invalid URLs", () => {
    assert.equal(toAbsoluteOrigin("not-a-url"), null)
    assert.equal(toAbsoluteOrigin("http://"), null)
  })

  it("should return null for empty string", () => {
    assert.equal(toAbsoluteOrigin(""), null)
    assert.equal(toAbsoluteOrigin("   "), null)
  })

  it("should return null for null or undefined", () => {
    assert.equal(toAbsoluteOrigin(null), null)
    assert.equal(toAbsoluteOrigin(undefined), null)
  })

  it("should return null for an object", () => {
    assert.equal(toAbsoluteOrigin({}), null)
  })
})

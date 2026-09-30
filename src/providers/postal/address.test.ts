import test from "node:test"
import assert from "node:assert/strict"
import { isSingleEmailAddress } from "./address"

test("accepts one bare printable-ASCII address", () => {
  for (const value of [
    "reply@example.com",
    "first.last+tag@sub.example.co.uk",
    "o'brien@example.ch",
  ]) {
    assert.equal(isSingleEmailAddress(value), true, value)
  }
})

test("refuses lists, display names, injections and invisible characters", () => {
  for (const value of [
    undefined,
    null,
    42,
    "",
    "reply",
    "reply@example",
    "reply@example.",
    "Reply <reply@example.com>",
    "a@example.com, b@example.com",
    "a@example.com;b@example.com",
    "reply@example.com\r\nBcc: victim@example.com",
    "reply@example.com\n",
    " reply@example.com",
    "rep ly@example.com",
    "réply@example.com",
    "reply​@example.com",
    "reply@example.com ",
    "\"quoted\"@example.com",
    `${"a".repeat(250)}@example.com`,
  ]) {
    assert.equal(isSingleEmailAddress(value), false, JSON.stringify(value))
  }
})

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { statusColorClass } from "./utils";

describe("admin-ui utils", () => {
  describe("statusColorClass", () => {
    it("should return the correct class for mapped colors", () => {
      assert.equal(statusColorClass("green"), "text-ui-fg-success");
      assert.equal(statusColorClass("red"), "text-ui-fg-error");
      assert.equal(statusColorClass("orange"), "text-ui-fg-warning");
      assert.equal(statusColorClass("blue"), "text-ui-fg-interactive");
      assert.equal(statusColorClass("purple"), "text-ui-fg-interactive");
    });

    it("should return the default class for unmapped colors", () => {
      assert.equal(statusColorClass("yellow"), "text-ui-fg-subtle");
      assert.equal(statusColorClass("unknown"), "text-ui-fg-subtle");
    });

    it("should return the default class for undefined", () => {
      assert.equal(statusColorClass(), "text-ui-fg-subtle");
      assert.equal(statusColorClass(undefined), "text-ui-fg-subtle");
    });
  });
});

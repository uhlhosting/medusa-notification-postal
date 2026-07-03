import test from "node:test";
import assert from "node:assert/strict";
import { resolveBackendBaseUrl, toAbsoluteOrigin } from "./backend-url";

test("toAbsoluteOrigin strips the path from an absolute URL", () => {
  assert.equal(
    toAbsoluteOrigin("https://api.tabaklaedeli.uhl.site/app"),
    "https://api.tabaklaedeli.uhl.site",
  );
});

test("resolveBackendBaseUrl falls back to the browser origin for relative input", () => {
  assert.equal(
    resolveBackendBaseUrl("/", "https://api.tabaklaedeli.uhl.site"),
    "https://api.tabaklaedeli.uhl.site",
  );
});

test("resolveBackendBaseUrl uses the default fallback when no absolute origin exists", () => {
  assert.equal(resolveBackendBaseUrl("/", null), "/");
});

test("resolveBackendBaseUrl prefers an absolute candidate over fallback", () => {
  assert.equal(
    resolveBackendBaseUrl("https://api.example.com/app", "https://fallback.example.test"),
    "https://api.example.com"
  );
});

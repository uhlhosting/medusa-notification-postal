import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_SDK_AUTH_TYPE } from "./client";

test("admin SDK uses the Medusa session shared by the dashboard", () => {
  assert.equal(ADMIN_SDK_AUTH_TYPE, "session");
});

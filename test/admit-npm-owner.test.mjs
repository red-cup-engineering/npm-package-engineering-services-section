import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { admitNpmOwner } from "@red-cup-engineering/npm-owner-admission-service";

test("the command maps the same admission over NDJSON", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/admit-npm-owner.mjs", import.meta.url))], {
    input: `${JSON.stringify("red-cup-engineering")}\n`,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout), admitNpmOwner("red-cup-engineering"));
});

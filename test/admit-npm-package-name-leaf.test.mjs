import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { admitNpmPackageNameLeaf } from "@red-cup-engineering/npm-package-name-leaf-admission-service";

test("the command maps the same admission over NDJSON", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/admit-npm-package-name-leaf.mjs", import.meta.url))], {
    input: `${JSON.stringify("thing-service")}\n`,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout), admitNpmPackageNameLeaf("thing-service"));
});

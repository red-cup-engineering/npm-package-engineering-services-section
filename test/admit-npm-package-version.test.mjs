import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { admitNpmPackageVersion } from "@red-cup-engineering/npm-package-version-admission-service";

test("the command maps the same admission over NDJSON", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/admit-npm-package-version.mjs", import.meta.url))], {
    input: `${JSON.stringify("12.3.0")}\n`,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout), admitNpmPackageVersion("12.3.0"));
});

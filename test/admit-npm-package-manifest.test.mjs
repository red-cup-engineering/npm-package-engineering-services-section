import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { admitNpmPackageManifest } from "@red-cup-engineering/npm-package-manifest-admission-service";

const manifest = {
  name: "@scope/example",
  version: "1.2.3",
  private: false,
  scripts: { test: "node --test" },
};
const candidate = { type: "NpmPackageManifestCandidate", version: 1, manifest };

test("the command maps the same admission over NDJSON", () => {
  const script = fileURLToPath(new URL("../scripts/admit-npm-package-manifest.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script], {
    input: `${JSON.stringify(candidate)}\n`,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), admitNpmPackageManifest(candidate));
});

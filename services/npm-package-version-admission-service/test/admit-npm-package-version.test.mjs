import assert from "node:assert/strict";
import test from "node:test";

import { admitNpmPackageVersion } from "@red-cup-engineering/npm-package-version-admission-service";

test("admits exact numeric and prerelease SemVer versions unchanged", () => {
  assert.equal(admitNpmPackageVersion("12.3.0"), "12.3.0");
  assert.equal(admitNpmPackageVersion("0.5.0-dev.0"), "0.5.0-dev.0");
  assert.equal(admitNpmPackageVersion("1.2.3-rc.1+build.7"), "1.2.3-rc.1+build.7");
});

test("refuses missing, inferred, padded, ranged, and malformed versions", () => {
  for (const value of [undefined, "", "1.2", "01.2.3", "1.2.3-01", "1.2.3+", "^1.2.3", "workspace:*"]) {
    assert.throws(() => admitNpmPackageVersion(value), TypeError);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { admitNpmPackageVersion } from "@red-cup-engineering/npm-package-version-admission-service";
import {
  compareVersions, exactVersion, highestSatisfying, isBoundedRange, isExactVersion, parseVersion, rangeNamesPrerelease, satisfies,
} from "@red-cup-engineering/npm-package-version-admission-service/semver-range";

test("admission accepts exact npm versions only within the parser's real limits", () => {
  for (const version of ["0.0.0", "0.2.5-dev.0", "4.2.1+source.07", "9007199254740991.0.0", "1.2.3+" + "x".repeat(250)]) {
    assert.equal(isExactVersion(version), true);
    assert.ok(parseVersion(version));
    assert.equal(exactVersion(version), version);
    assert.equal(admitNpmPackageVersion(version), version);
  }
  for (const version of ["9007199254740992.0.0", "0.9007199254740992.0", "0.0.9007199254740992",
    "1.2.3+" + "x".repeat(251), "01.2.3", "1.2.3-01", "1.2.x", "latest", "v1.2.3", "1.2.3\n", " 1.2.3", null]) {
    assert.equal(isExactVersion(version), false, String(version));
    assert.throws(() => admitNpmPackageVersion(version), TypeError);
  }
});

test("the npm range reader retains bounded syntax and explicit prerelease behavior", () => {
  assert.equal(exactVersion("= v0.2.4"), "0.2.4");
  assert.equal(compareVersions("0.2.4", "0.2.4+build.1"), 0);
  assert.ok(compareVersions("0.2.5-dev.2", "0.2.5-dev.10") < 0);
  assert.equal(isBoundedRange("^0.2.3"), true);
  assert.equal(isBoundedRange("* || ^0.2.3"), false);
  assert.equal(isBoundedRange("file:../admission"), false);
  assert.equal(satisfies("0.2.5-dev.0", "^0.2.3"), false);
  assert.equal(satisfies("0.2.5-dev.0", "^0.2.3 || 0.2.5-dev.0"), true);
  assert.equal(satisfies("0.3.0", "^0.2.3"), false);
  assert.equal(highestSatisfying(["0.3.0", "0.2.5-dev.0", "0.2.3", "0.2.4"], "^0.2.3"), "0.2.4");
});

test("only an authored prerelease on a valid range endpoint counts", () => {
  for (const range of [">=1.0.0--preview", "1.2.3 - 2.0.0-dev.1", "^0.2.3 || 0.2.5-dev.0",
    "= v1.2.3-0", ">=2.0.0-rc.1+build.42 <3.0.0"]) {
    assert.equal(rangeNamesPrerelease(range), true, range);
  }
  for (const range of ["^1.2.3+2.3.4-foo", ">=1.0.0 <2.0", "1.2.x", "0.2.x-dev.0",
    "file:./1.2.3-rc.1", "1.2.3-rc.1 || not-a-range", 1.2]) {
    assert.equal(rangeNamesPrerelease(range), false, String(range));
  }
});

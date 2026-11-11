import assert from "node:assert/strict";
import test from "node:test";

import { admitNpmPackageNameLeaf } from "@red-cup-engineering/npm-package-name-leaf-admission-service";

test("admits a valid lowercase npm package-name leaf", () => {
  assert.equal(admitNpmPackageNameLeaf("thing-service"), "thing-service");
});

test("refuses package-name leaves that would require repair", () => {
  for (const candidate of ["Thing", "", "-thing", "thing-"]) {
    assert.throws(() => admitNpmPackageNameLeaf(candidate), /canonical lowercase/u);
  }
});

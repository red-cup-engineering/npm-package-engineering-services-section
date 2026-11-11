import assert from "node:assert/strict";
import test from "node:test";

import { admitNpmOwner } from "@red-cup-engineering/npm-owner-admission-service";

test("admits a canonical npm owner unchanged", () => {
  assert.equal(admitNpmOwner("red-cup-engineering"), "red-cup-engineering");
});

test("refuses values that would need normalization", () => {
  for (const value of ["@red-cup-engineering", "Red-Cup", "two words", "-owner"]) {
    assert.throws(() => admitNpmOwner(value), TypeError);
  }
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { formNpmScopedPackageName } from "@red-cup-engineering/npm-scoped-package-name-formation-service";

const requestError = {
  name: "TypeError",
  message: "request must be an exact NpmScopedPackageNameFormationRequest@1",
};

test("forms a scoped package name from admitted owner and leaf inputs", () => {
  assert.equal(
    formNpmScopedPackageName({
      leaf: "package.name_1-x",
      owner: "red-cup-engineering",
      type: "NpmScopedPackageNameFormationRequest",
      version: 1,
    }),
    "@red-cup-engineering/package.name_1-x",
  );
});

test("admits one-character owner and leaf boundary inputs", () => {
  assert.equal(
    formNpmScopedPackageName({
      type: "NpmScopedPackageNameFormationRequest",
      version: 1,
      owner: "0",
      leaf: "a",
    }),
    "@0/a",
  );
});

test("refuses values that are not exact request envelopes", async (t) => {
  const cases = [
    ["undefined", undefined],
    ["null", null],
    ["a primitive", "request"],
    ["an array", []],
    ["an object with missing keys", {
      type: "NpmScopedPackageNameFormationRequest",
      version: 1,
      owner: "owner",
    }],
    ["an object with an extra key", {
      type: "NpmScopedPackageNameFormationRequest",
      version: 1,
      owner: "owner",
      leaf: "leaf",
      extra: true,
    }],
    ["the wrong request type", {
      type: "OtherRequest",
      version: 1,
      owner: "owner",
      leaf: "leaf",
    }],
    ["the wrong request version", {
      type: "NpmScopedPackageNameFormationRequest",
      version: 2,
      owner: "owner",
      leaf: "leaf",
    }],
  ];

  for (const [description, candidate] of cases) {
    await t.test(description, () => {
      assert.throws(() => formNpmScopedPackageName(candidate), requestError);
    });
  }
});

test("propagates owner refusal with its exact error", async (t) => {
  const cases = [
    ["a missing owner", undefined],
    ["an empty owner", ""],
    ["an owner with an at-sign", "@owner"],
    ["an uppercase owner", "Owner"],
    ["an owner beginning with a hyphen", "-owner"],
    ["an owner ending with a hyphen", "owner-"],
  ];

  for (const [description, owner] of cases) {
    await t.test(description, () => {
      assert.throws(
        () => formNpmScopedPackageName({
          type: "NpmScopedPackageNameFormationRequest",
          version: 1,
          owner,
          leaf: "leaf",
        }),
        {
          name: "TypeError",
          message: "candidate must be a canonical lowercase npm owner without an at-sign",
        },
      );
    });
  }
});

test("propagates package-name leaf refusal with its exact error", async (t) => {
  const cases = [
    ["a missing leaf", undefined],
    ["an empty leaf", ""],
    ["an uppercase leaf", "Leaf"],
    ["a leaf beginning with punctuation", ".leaf"],
    ["a leaf ending with punctuation", "leaf_"],
    ["a leaf containing a slash", "nested/leaf"],
  ];

  for (const [description, leaf] of cases) {
    await t.test(description, () => {
      assert.throws(
        () => formNpmScopedPackageName({
          type: "NpmScopedPackageNameFormationRequest",
          version: 1,
          owner: "owner",
          leaf,
        }),
        {
          name: "TypeError",
          message: "candidate must be a canonical lowercase npm package-name leaf",
        },
      );
    });
  }
});

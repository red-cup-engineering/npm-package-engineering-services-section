import assert from "node:assert/strict";
import { test } from "node:test";

import { admitNpmPackageManifest } from "@red-cup-engineering/npm-package-manifest-admission-service";

const candidateWith = (manifest) => ({
  type: "NpmPackageManifestCandidate",
  version: 1,
  manifest,
});

test("admits a manifest without changing its fields and returns an immutable result", () => {
  const manifest = {
    name: "@red-cup-engineering/example-package",
    version: "1.2.3-alpha.1+build.5",
    private: false,
    scripts: { test: "node --test" },
    dependencies: { dependency: "1.0.0" },
    devDependencies: {},
    peerDependencies: { peer: "^2.0.0" },
    optionalDependencies: { optional: "latest" },
    metadata: { values: [null, true, 3, "unchanged"] },
  };

  const admitted = admitNpmPackageManifest(candidateWith(manifest));

  assert.deepStrictEqual(admitted, {
    type: "NpmPackageManifest",
    version: 1,
    manifest: {
      name: "@red-cup-engineering/example-package",
      version: "1.2.3-alpha.1+build.5",
      private: false,
      scripts: { test: "node --test" },
      dependencies: { dependency: "1.0.0" },
      devDependencies: {},
      peerDependencies: { peer: "^2.0.0" },
      optionalDependencies: { optional: "latest" },
      metadata: { values: [null, true, 3, "unchanged"] },
    },
  });
  assert.ok(Object.isFrozen(admitted));
  assert.ok(Object.isFrozen(admitted.manifest));
  assert.ok(Object.isFrozen(admitted.manifest.metadata));
  assert.ok(Object.isFrozen(admitted.manifest.metadata.values));
  assert.throws(
    () => {
      admitted.manifest.metadata.values.push("changed");
    },
    TypeError,
  );
});

test("admits the empty manifest boundary", () => {
  assert.deepStrictEqual(admitNpmPackageManifest(candidateWith({})), {
    type: "NpmPackageManifest",
    version: 1,
    manifest: {},
  });
});

test("refuses candidates that are not exact NpmPackageManifestCandidate@1 envelopes", async (t) => {
  const cases = [
    ["undefined", undefined],
    ["null", null],
    ["a primitive", "candidate"],
    ["an array", []],
    ["a missing field", { type: "NpmPackageManifestCandidate", version: 1 }],
    ["an extra field", { ...candidateWith({}), extra: true }],
    ["the wrong type", { ...candidateWith({}), type: "NpmPackageManifest" }],
    ["the wrong version", { ...candidateWith({}), version: 2 }],
  ];

  for (const [description, candidate] of cases) {
    await t.test(description, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidate),
        {
          name: "TypeError",
          message: "candidate must be an exact NpmPackageManifestCandidate@1",
        },
      );
    });
  }
});

test("refuses manifests that are not JSON records", async (t) => {
  const cases = [
    ["null", null],
    ["an array", []],
    ["a primitive", "manifest"],
    ["an object with a null prototype", Object.create(null)],
    ["an object with a custom prototype", new (class Manifest {})()],
  ];

  for (const [description, manifest] of cases) {
    await t.test(description, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith(manifest)),
        {
          name: "TypeError",
          message: "candidate.manifest must be a JSON record",
        },
      );
    });
  }
});

test("admits canonical unscoped and scoped package names", async (t) => {
  for (const name of ["a", "package.name-with_parts9", "@o/p", "@red-cup/package-name"]) {
    await t.test(name, () => {
      assert.equal(admitNpmPackageManifest(candidateWith({ name })).manifest.name, name);
    });
  }
});

test("refuses a non-string manifest name", () => {
  assert.throws(
    () => admitNpmPackageManifest(candidateWith({ name: 1 })),
    { name: "TypeError", message: "manifest.name must be a string" },
  );
});

test("refuses a noncanonical unscoped package-name leaf", () => {
  assert.throws(
    () => admitNpmPackageManifest(candidateWith({ name: "Package" })),
    {
      name: "TypeError",
      message: "candidate must be a canonical lowercase npm package-name leaf",
    },
  );
});

test("refuses malformed scoped package-name structure", async (t) => {
  for (const name of ["@owner", "@owner/", "@owner/package/extra"]) {
    await t.test(name, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith({ name })),
        {
          name: "TypeError",
          message: "manifest.name must be a canonical npm package name",
        },
      );
    });
  }
});

test("refuses a noncanonical scoped-package owner", () => {
  assert.throws(
    () => admitNpmPackageManifest(candidateWith({ name: "@Owner/package" })),
    {
      name: "TypeError",
      message: "candidate must be a canonical lowercase npm owner without an at-sign",
    },
  );
});

test("refuses a noncanonical scoped-package leaf", () => {
  assert.throws(
    () => admitNpmPackageManifest(candidateWith({ name: "@owner/Package" })),
    {
      name: "TypeError",
      message: "candidate must be a canonical lowercase npm package-name leaf",
    },
  );
});

test("admits exact stable, prerelease, and build SemVer versions", async (t) => {
  for (const version of ["0.0.0", "1.2.3", "1.2.3-alpha.1", "1.2.3+build.5"]) {
    await t.test(version, () => {
      assert.equal(admitNpmPackageManifest(candidateWith({ version })).manifest.version, version);
    });
  }
});

test("refuses values that are not explicit exact SemVer versions", async (t) => {
  for (const version of [1, "^1.2.3", "01.2.3", "1.2"]) {
    await t.test(String(version), () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith({ version })),
        {
          name: "TypeError",
          message: "candidate must be an explicit exact SemVer npm package version",
        },
      );
    });
  }
});

test("admits both private boolean boundaries and refuses other values", () => {
  assert.equal(admitNpmPackageManifest(candidateWith({ private: true })).manifest.private, true);
  assert.equal(admitNpmPackageManifest(candidateWith({ private: false })).manifest.private, false);
  assert.throws(
    () => admitNpmPackageManifest(candidateWith({ private: "false" })),
    { name: "TypeError", message: "manifest.private must be a boolean" },
  );
});

test("admits empty and populated string records for every supported record field", async (t) => {
  const fields = [
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ];

  for (const field of fields) {
    await t.test(field, () => {
      const value = { first: "", second: "value" };
      assert.deepStrictEqual(
        admitNpmPackageManifest(candidateWith({ [field]: value })).manifest[field],
        value,
      );
      assert.deepStrictEqual(
        admitNpmPackageManifest(candidateWith({ [field]: {} })).manifest[field],
        {},
      );
    });
  }
});

test("refuses non-string entries in every supported record field", async (t) => {
  const fields = [
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ];

  for (const field of fields) {
    await t.test(field, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith({ [field]: { invalid: 1 } })),
        {
          name: "TypeError",
          message: `manifest.${field} must be a string record`,
        },
      );
    });
  }
});

test("refuses supported record fields that are not JSON records", async (t) => {
  const cases = [
    ["null", null],
    ["an array", []],
    ["a primitive", "script"],
    ["an object with a null prototype", Object.create(null)],
  ];

  for (const [description, value] of cases) {
    await t.test(description, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith({ scripts: value })),
        {
          name: "TypeError",
          message: "manifest.scripts must be a string record",
        },
      );
    });
  }
});

test("refuses non-JSON values in otherwise unconstrained manifest fields", async (t) => {
  const cases = [
    [undefined, "value: not a JSON value (undefined at $.manifest.metadata)"],
    [Number.NaN, "value: not a JSON value (NaN at $.manifest.metadata)"],
    [() => {}, "value: not a JSON value (function at $.manifest.metadata)"],
  ];

  for (const [metadata, message] of cases) {
    await t.test(message, () => {
      assert.throws(
        () => admitNpmPackageManifest(candidateWith({ metadata })),
        { name: "TypeError", message },
      );
    });
  }
});

test("refuses cycles in a manifest", () => {
  const manifest = {};
  manifest.self = manifest;

  assert.throws(
    () => admitNpmPackageManifest(candidateWith(manifest)),
    {
      name: "TypeError",
      message: "value: not a JSON value (a cycle at $.manifest.self)",
    },
  );
});

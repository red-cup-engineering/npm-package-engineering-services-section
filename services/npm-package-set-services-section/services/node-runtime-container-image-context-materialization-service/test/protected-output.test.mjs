import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { projectedOutputDestination, refuseProtectedOutput } from "../src/protected-output.mjs";

test("an output symlink cannot create a child inside the original immutable runtime catalog", async () => {
  const root = await mkdtemp(join(tmpdir(), "context-custody-catalog-"));
  try {
    const catalog = join(root, "catalog"), release = join(root, "release");
    await mkdir(catalog); await mkdir(release);
    const alias = join(root, "catalog-alias");
    await symlink(catalog, alias);
    await assert.rejects(projectedOutputDestination(join(alias, "unwanted"), [catalog, release]),
      /aliases protected runtime catalog or release territory/u);
    await assert.rejects(lstat(join(catalog, "unwanted")), { code: "ENOENT" });
    assert.throws(() => refuseProtectedOutput(join(catalog, "x"), [catalog, release]),
      /protected runtime/u);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("even missing parents beneath a symlinked release refuse BEFORE directory creation", async () => {
  const root = await mkdtemp(join(tmpdir(), "context-custody-release-"));
  try {
    const catalog = join(root, "catalog"), release = join(root, "release");
    await mkdir(catalog); await mkdir(release);
    const alias = join(root, "release-alias");
    await symlink(release, alias);
    await assert.rejects(projectedOutputDestination(
      join(alias, "new", "subdir", "unwanted"), [catalog, release]
    ), /aliases protected runtime catalog or release territory/u);
    await assert.rejects(lstat(join(release, "new")), { code: "ENOENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("safe aliases normalize to the actual destination without rejecting valid build outputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "context-custody-safe-"));
  try {
    const catalog = join(root, "catalog"), release = join(root, "release");
    const ordinary = join(root, "output"), alias = join(root, "output-alias");
    await mkdir(catalog); await mkdir(release); await mkdir(ordinary);
    await symlink(ordinary, alias);
    const destination = await projectedOutputDestination(
      join(alias, "new", "context"), [catalog, release]
    );
    assert.equal(destination, join(await realpath(ordinary), "new", "context"));
    refuseProtectedOutput(destination, [catalog, release]);
    await assert.rejects(lstat(destination), { code: "ENOENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

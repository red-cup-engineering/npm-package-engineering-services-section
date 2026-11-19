import { freezeJson } from "@red-cup-engineering/json-engine/freeze-json";
/**
 * Restored 2026-09-21 as this service's own module (recovered from the
 * pnpm-package-manager-declaration-normalization-service package deleted
 * 2026-08-14, commit ef78d5c41): drops a manifest's `packageManager` field
 * when it names pnpm, without touching any other declaration.
 *
 * Its own stdin/stdout CLI entry point moved to
 * scripts/normalize-pnpm-package-manager-declaration.mjs -- see
 * normalize-npm-package-lifecycle-scripts.mjs's header comment for why.
 */
import { validateNpmPackageManifest } from "@red-cup-engineering/npm-package-manifest-admission-service";


function validatedManifestOf(manifest) {
  return validateNpmPackageManifest({ type: "NpmPackageManifestCandidate", version: 1, manifest }).manifest;
}

export function normalizePnpmPackageManagerDeclaration(manifest) {
  const validatedManifest = validatedManifestOf(manifest);
  if (!validatedManifest.packageManager?.startsWith("pnpm@")) return validatedManifest;
  const { packageManager: _removedPackageManager, ...normalizedManifest } = validatedManifest;
  return freezeJson(normalizedManifest);
}

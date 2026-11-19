import { freezeJson } from "@red-cup-engineering/json-engine/freeze-json";
/**
 * Restored 2026-09-21 as this service's own module (recovered from the
 * pnpm-engine-declaration-normalization-service package deleted 2026-08-14,
 * commit ef78d5c41): drops a manifest's `engines.pnpm` declaration (and the
 * whole `engines` field when pnpm was its only entry), without touching any
 * other engine constraint.
 *
 * Its own stdin/stdout CLI entry point moved to
 * scripts/normalize-pnpm-engine-declaration.mjs -- see
 * normalize-npm-package-lifecycle-scripts.mjs's header comment for why.
 */
import { validateNpmPackageManifest } from "@red-cup-engineering/npm-package-manifest-admission-service";


function validatedManifestOf(manifest) {
  return validateNpmPackageManifest({ type: "NpmPackageManifestCandidate", version: 1, manifest }).manifest;
}

export function normalizePnpmEngineDeclaration(manifest) {
  const validatedManifest = validatedManifestOf(manifest);
  if (!validatedManifest.engines?.pnpm) return validatedManifest;
  const { pnpm: _removedPnpmEngine, ...engines } = validatedManifest.engines;
  const { engines: _previousEngines, ...manifestWithoutEngines } = validatedManifest;
  return freezeJson(Object.keys(engines).length === 0
    ? manifestWithoutEngines
    : { ...manifestWithoutEngines, engines });
}

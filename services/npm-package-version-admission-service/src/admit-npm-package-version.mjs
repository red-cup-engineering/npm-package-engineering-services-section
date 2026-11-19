import { isExactVersion } from "./semver-range.mjs";

/**
 * Admits one explicit exact SemVer npm package version.
 *
 * @param {string} candidate - The candidate version.
 * @returns {string} The unchanged admitted version.
 * @throws {TypeError} When the candidate is not exact.
 */
export function validateNpmPackageVersion(candidate) {
  if (!isExactVersion(candidate)) {
    throw new TypeError("candidate must be an explicit exact SemVer npm package version");
  }
  return candidate;
}

#!/usr/bin/env node
import { runJavascriptNodeOperation } from "@red-cup-engineering/node-js-function-engineering-services-section/operation";
import { validateTextFileCreationProjection } from "@red-cup-engineering/computer-file-engineering-services-section/admit-text-file-creation-projection";

function requireSpecification(value) {
  if (value?.type !== "JsnodeOperationPackageSpecification" || value.version !== 1) {
    throw new TypeError("input must be an admitted JsnodeOperationPackageSpecification@1");
  }
  return value;
}

/**
 * Projects the npm manifest face of one admitted JSNode operation package.
 *
 * @param {object} specification An admitted JsnodeOperationPackageSpecification.
 * @returns {object} A package.json TextFileCreationProjection.
 */
export function projectNpmPackageManifestFromJsnodeOperation(specification) {
  const validated = requireSpecification(specification);
  const operationTarget = `./${validated.operation.path}`;
  const manifest = {
    name: validated.packageName,
    version: validated.packageVersion,
    description: validated.operation.documentation.description,
    type: "module",
    private: false,
    license: validated.license,
    exports: operationTarget,
    bin: { [validated.operation.commandName]: validated.operation.path },
    files: ["scripts", "README.md", "package.json"],
    dependencies: validated.dependencies,
    devDependencies: validated.devDependencies,
    scripts: {
      check: `node --check ${validated.operation.path}`,
      test: "node --test test/*.test.mjs",
      "pack:dry-run": "npm pack --dry-run --ignore-scripts",
    },
    engines: { node: ">=24.2.0" },
  };
  const projection = validateTextFileCreationProjection({
    type: "TextFileCreationProjection",
    version: 1,
    path: "package.json",
    text: `${JSON.stringify(manifest, null, 2)}\n`,
    mode: 0o644,
  });
  if (projection.type !== "TextFileCreationProjection") {
    throw new TypeError(`admitted manifest produced ${projection.code}: ${projection.message}`);
  }
  return projection;
}

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({
    name: "project-npm-package-manifest-from-jsnode-operation",
    description: "Projects the npm manifest face of one admitted JSNode operation package.",
    operation: projectNpmPackageManifestFromJsnodeOperation,
  }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}

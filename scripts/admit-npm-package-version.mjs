#!/usr/bin/env node
import { validateNpmPackageVersion } from "@red-cup-engineering/npm-package-version-admission-service";
import { runJavascriptNodeOperation } from "@red-cup-engineering/node-js-function-engineering-services-section/operation";

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "admit-npm-package-version", description: "Admits one explicit exact SemVer npm package version.", operation: validateNpmPackageVersion }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}

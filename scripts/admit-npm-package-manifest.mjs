#!/usr/bin/env node
import { validateNpmPackageManifest } from "@red-cup-engineering/npm-package-manifest-admission-service";
import { runJavascriptNodeOperation } from "@red-cup-engineering/node-js-function-engineering-services-section/operation";

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "admit-npm-package-manifest", description: "Admits one npm package manifest candidate without changing its fields.", operation: validateNpmPackageManifest }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}

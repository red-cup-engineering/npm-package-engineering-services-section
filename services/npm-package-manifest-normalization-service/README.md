# Normalize an npm package manifest

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

This library composes the pure npm manifest and version admissions with identity,
engine, package-manager and lifecycle normalization. Its runtime dependencies name
exact registry releases. A caller supplies its explicit identity and exact version;
the normal form preserves other meaningful manifest fields.

The command accepts MANIFEST_PATH IDENTITY_NAME and emits canonical JSON. The
additional stdin commands in scripts retain the individual source operations.

The containing npm-package-services-section owns the shared development tooling
for this source family. Its check-package-syntax and run-package-tests supplier
remains an explicit section-level receiving obligation. The runtime package does
not hire the development actor platform. Native packing needs no generation or
lifecycle execution. Source changes and artifact receiving remain separate.

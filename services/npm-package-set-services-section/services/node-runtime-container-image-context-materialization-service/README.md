# Node runtime container image context materialization service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

This service maps a completely verified `NodeRuntimeReleaseCatalogReceipt` to
one new, credential-free container build context. A declarative layout policy
maps every catalog entry identity to one relative context mount. Static files
or directories may be added explicitly; they never overlay a runtime release
or one another.

The service copies no workspace and runs no package manager. It invokes the
Node runtime release materialization owner again, requires its fresh catalog
observation to equal the supplied observation, and recomputes every mounted
`app/` artifact identity after copying. Thus an admitted release cannot be
changed by a customer-specific context adapter.

The resulting `NodeRuntimeContainerImageContextReceipt` binds the runtime
catalog, exact verification observation, normalized layout policy, each
mounted artifact, each static carrier, and every final regular file's relative
path, bytes, SHA-256 digest, and permission mode. Directory metadata is not an
identity input. Its receipt digest and regular-file tree are reproducible
across output paths.
Cloud providers may subsequently admit this context and form their own build
manifest; this package contains no cloud API, registry, credential, image, or
deployment policy.

```json
{
  "type": "NodeRuntimeContainerImageLayoutPolicy",
  "version": 1,
  "entries": [
    { "id": "worker", "mount": "services/worker" }
  ]
}
```

Static carrier declarations contain a relative destination `path` and exactly
one of `sourcePath`, `utf8`, or `base64`. A `sourcePath` may name one regular
file or directory tree. Symbolic links, special files, traversal, overlapping
destinations, credential-shaped filenames, and secret material are refused.
Every file is opened without following its final path component, measured once
through that descriptor, and copied from those admitted bytes. Secret scanning
covers the complete byte carrier regardless of file size or embedded NULs.

The library accepts the release verification owner explicitly. The packaged
CLI supplies `@red-cup-engineering/node-runtime-release-materialization-service`:

```bash
materialize-node-runtime-container-image-context \
  --catalog-directory /admission/catalogs/DIGEST \
  --catalog-receipt /admission/runtime-release-catalog.json \
  --verification-observation /admission/catalog-verification.json \
  --layout-policy /admission/layout.json \
  --static-carriers /admission/static-carriers.json \
  --output /tmp/new-context
```


## Independent receiving: upstream file identity, stored receipt and destination custody

For portable, externally hireable compute, distinguish an immutable **source file
tree** from a printed SHA address, container build context, actual executable
image, running leased compute and customer-accepted paid Work. Source-owned
[upstream Node release PR #7](https://github.com/red-cup-engineering/node-runtime-materialization-engineering-services-section/pull/7)
preserves legacy addresses but adds `fileTreeDigest`: a domain-tagged
unambiguous commitment to every relative path, mode, length and file SHA-256.
This original context consumer accepts new catalogs carrying that claim only
when the actual upstream release verifier returns **`fileTreeVerified:true`**
and exactly that digest. In its materialized `entries` readout, it distinguishes
`domain-separated-file-tree` from explicitly `legacy-unframed`; neither
means a running container, OCI certification or settled customer contract.
An installed older release edition must **not** silently be promoted by
dropping its new catalog file-tree claim.

The original `verifyNodeRuntimeContainerImageContext` now reads and
validates the actual **stored** context receipt even when its caller supplies
an otherwise valid separate receipt. A missing or mismatched local receipt
refuses rather than accepting a source-free file list. The input file
identities are still independently remeasured; an unsigned, locally edited
record is not a trustworthy external party's signature.

Context output paths are projected from the closest existing real filesystem
ancestor **before** making even an empty directory, and the real output
parent is checked again after parent creation. Output under the exact
original immutable catalog or any of the catalog's materialized releases
must refuse even when reached via symbolic-link aliases. The output may
still use an ordinary alias to a safe build destination. These checks
protect cooperating host operators from accidental or untrusted path
selection; a hostile concurrent process mutating filesystem ancestors
requires stronger operating-system directory-handle confinement not
provided by this library.

The existing Node package `npm test` remains the full release-source and
container-context native suite. `npm run test:protected-output` is a small,
**dependency-free exact source** test for catalog aliases, nested release
aliases and ordinary approved build paths. Native Node 22 isolated receiving
of the exact GitHub helper blob
`fc3e2675bb9791b7388846b62a564dff3576f3bf` and test blob
`23a29079fb3a9e9f02963ecaf0b2c46967e62c69`
passed 3/3; both blobs were checked byte-for-byte by Git blob SHA before
execution. This is not a green original full private runtime dependency
closure. The existing original `test/materialize-context.test.mjs` retains
the end-to-end release/catalog/receipt/refusal suite and adds two owner
tests that are still awaiting the exact installed upstream edition and
full dependency-backed execution. No new registry, cloud, wallet, paid
deploy, worker, job or customer receipt was created.

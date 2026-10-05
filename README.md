# srelens extension catalog

Discovery metadata for **native srelens extensions**. Extension implementations,
tests, documentation and releases live in their own repositories, including
community-owned repositories. This repository does not host an extension runtime.

- [Flux](https://github.com/srelens/extension-flux)
- [Argo CD](https://github.com/srelens/extension-argocd)
- [cert-manager](https://github.com/srelens/extension-cert-manager)

`catalog.source.json` is the generated source for the signed catalog; `entries/<extension-id>.json` files
are the reviewed sources. Each entry declares an ID, name, description, source
repository, license, versioned manifest URL, SHA-256 digest, extension API range,
preview status and the exact tested host revision.

## Current status

Flux and Argo CD are previews for extension API `^0.3`; cert-manager requires
`^0.7` for its configurable expiry card. They provide native resource views and
explicitly granted, host-confirmed actions. Each entry records the exact tested
host commit. Install through a compatible desktop host's app catalog and review
the requested read and write permissions.

Released manifests carry detached Ed25519 publisher signatures. The host checks
the catalog checksum, the publisher key the catalog delegates the app's namespace
to, and API compatibility before installation. Catalog metadata itself does not
authorize actions.

## Add or update an extension

1. Publish a versioned manifest in the extension's own repository and validate it
   with the matching srelens host. Never reuse a published version for new bytes.
2. Add or update its entry under `entries/`, preserving the stable extension ID.
3. Record the release asset URL, SHA-256 and tested host commit. Repository owners
   may differ from srelens; hosting here is not a requirement.
4. Run `python3 scripts/catalog.py`, `python3 scripts/catalog.py --check`, and
   `python3 -m unittest discover -s tests`.
5. Submit a PR with validation evidence and any compatibility/permission changes.
   Leave `catalog.signed.json` alone: CI signs it once the PR merges.

Catalog validation is offline and does not download or execute contributor code.
Reviewers must verify repository ownership, release provenance, permissions and
asset contents before accepting an entry. A checksum identifies exact bytes; it
is not a signature or an automatic trust decision. Catalog inclusion never grants
permissions, connects clusters, or bypasses app installation consent.

## Signed catalog

srelens hosts from [srelens/srelens#559](https://github.com/srelens/srelens/issues/559)
on read `catalog.signed.json`, not `catalog.json`. It is a
[DSSE](https://github.com/secure-systems-lab/dsse) envelope over the same entries,
signed with the catalog key, and it carries the publisher delegations: which key may
sign which app-ID namespace. A host trusts it only when the catalog key named by the
root it pins signed it, before its `expires`, and at a `version` higher than any it
has seen. Otherwise it keeps the last catalog it verified.

- `trust/root.json` is a copy of the root the host pins
  (`crates/registry/src/extensions/trust/root.json` in srelens/srelens). It names the
  catalog key; nothing here can change which key that is.
- `publishers/<id>.json` are the delegations, each signed once with the catalog key.
  `publishers/srelens.json` delegates `org.srelens` to the srelens release keys.
- `scripts/trust.mjs` is the host's signing script
  (`scripts/extensions/trust.mjs` in srelens/srelens), copied here.
- `.github/workflows/sign-catalog.yml` signs `catalog.source.json` into
  `catalog.signed.json` whenever the catalog, a delegation, the root or the scripts
  change on `main`, and every Monday, with the signing time as the version and a
  30-day expiry. It checks the result with `scripts/verify-catalog.mjs` before
  committing it and publishes nothing that check refuses. The catalog key is the
  `CATALOG_SIGNING_PRIVATE_KEY` secret; the root keys are never in CI.

`catalog.json` stays for hosts released before #559, which read only it and only
release signatures in the bare 64-byte form. Every release it lists today is signed
that way. A release whose `manifest.json.sig` names its key (`{"keyid","sig"}`) is
readable only by #559 hosts. `catalog.json` is now frozen byte for byte; new entries
and updates change `catalog.source.json`, which only the signed catalog consumes.

Adding a publisher, the key ceremony and the formats are in
[`docs/extensions/trust.md`](https://github.com/srelens/srelens/blob/dev/docs/extensions/trust.md)
in srelens/srelens.

## Ownership boundaries

- `srelens/srelens`: runtime, manifest API, host UI, permission enforcement and backend settings.
- This repository: discovery JSON and catalog validation.
- Extension repositories: manifests, integration tests, documentation and releases.

Key rotation, revocation and permission-diff consent on updates are tracked in the
host's extension-platform roadmap.

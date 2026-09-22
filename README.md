# srelens extension catalog

Discovery metadata for **native srelens extensions**. Extension implementations,
tests, documentation and releases live in their own repositories, including
community-owned repositories. This repository does not host an extension runtime.

- [Flux](https://github.com/srelens/extension-flux)
- [Argo CD](https://github.com/srelens/extension-argocd)

`catalog.json` is the generated entry point; `entries/<extension-id>.json` files
are the reviewed sources. Each entry declares an ID, name, description, source
repository, license, versioned manifest URL, SHA-256 digest, extension API range,
preview status and the exact tested host revision.

## Current status

Flux and Argo CD are previews for extension API `^0.3`, with native resource
views and explicitly granted, host-confirmed actions. Each entry records the
exact tested host commit. Install through a compatible desktop host's app catalog
and review the requested read and write permissions.

Released manifests carry detached Ed25519 publisher signatures. The host checks
the catalog checksum, trusted publisher key and API compatibility before
installation. Catalog metadata itself does not authorize actions.

## Add or update an extension

1. Publish a versioned manifest in the extension's own repository and validate it
   with the matching srelens host. Never reuse a published version for new bytes.
2. Add or update its entry under `entries/`, preserving the stable extension ID.
3. Record the release asset URL, SHA-256 and tested host commit. Repository owners
   may differ from srelens; hosting here is not a requirement.
4. Run `python3 scripts/catalog.py`, `python3 scripts/catalog.py --check`, and
   `python3 -m unittest discover -s tests`.
5. Submit a PR with validation evidence and any compatibility/permission changes.

Catalog validation is offline and does not download or execute contributor code.
Reviewers must verify repository ownership, release provenance, permissions and
asset contents before accepting an entry. A checksum identifies exact bytes; it
is not a signature or an automatic trust decision. Catalog inclusion never grants
permissions, connects clusters, or bypasses app installation consent.

## Ownership boundaries

- `srelens/srelens`: runtime, manifest API, host UI, permission enforcement and backend settings.
- This repository: discovery JSON and catalog validation.
- Extension repositories: manifests, integration tests, documentation and releases.

Publisher-key delegation, rotation and permission-diff consent on updates are
tracked in the host's extension-platform roadmap.

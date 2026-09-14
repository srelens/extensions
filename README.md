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

Both initial entries are unsigned, read-only previews requiring the native
extension-platform build from [PR #508](https://github.com/srelens/srelens/pull/508).
The desktop app does not yet browse or install this catalog automatically.
Follow installation instructions in each extension repository.

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

Next: a backend-owned catalog fetch/cache and verified installer in the app,
followed by signed updates with permission-diff review. No Lens compatibility layer.

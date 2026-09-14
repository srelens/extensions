# Native extension roadmap

## Repository boundaries

- `srelens/extensions`: JSON discovery entries, generated catalog and metadata validation.
- `srelens/extension-flux`: Flux manifests, fixtures, tests, docs and independent releases.
- `srelens/extension-argocd`: Argo CD manifests, fixtures, tests, docs and independent releases.
- Community extensions may live under any maintainer's repository; submit a catalog PR.
- `srelens/srelens` continues to own the runtime, manifest contract, permission broker,
  host rendering, credential access and backend-owned settings.

## Phase 1: Read-only native previews

Publish the existing Flux and Argo CD manifests with stable IDs and versioned
release assets/checksums. Validate using a pinned app commit and the actual native
manifest parser and broker. Mark previews as requiring the extension-platform
build until an app release containing that platform exists.

Flux covers its dashboard, Kustomizations, Helm releases, Sources, Image Automation
and Notifications. Argo CD starts with Applications; add ApplicationSets as a
separately validated extension update. Exercise supported API versions, namespace
restrictions, empty/error states, themes and both designs before broad release.

## Phase 2: Useful native details

Extend the app's declarative contract for typed metadata, conditions, selected
spec/status fields and related-resource navigation. Flux needs reconciliation and
source details; Argo CD needs sync/health details and application relationships.
Use host components and exact group/kind identities. Do not add extension CSS
runtimes or recreate the removed ungated full-object/Secret read path.

## Phase 3: Catalog integration and verified distribution

Implement catalog retrieval and caching in the backend, with explicit load/error
states in Settings. Match extension API requirements and expose preview status.
Verify asset checksums and introduce publisher signing before trusted automatic
updates. Preserve explicit installation grants and permission-diff consent. Catalog
inclusion itself never enables code or connects a cluster. Keep manifests and
release assets in their source repositories.

## Phase 4: Guarded actions and additional extensions

Add explicit, confirmation-gated Sync/Refresh/Reconcile/Suspend/Resume capabilities
with RBAC errors, pinned cluster identity and identical MCP consent behavior.
Then consider cert-manager (certificate/issuer state and expiry) and Trivy Operator
(vulnerability/configuration reports), each in its own repository. Confirm their
supported APIs and required permissions before implementation.

Executable native SDKs and custom renderers remain later work. The initial
extensions are declarative JSON and do not require third-party JavaScript.

# Remove public Gallery — implementation plan

Approved chat plan: remove public Gallery and preserve the current Practice & community sections and Gallery admin compatibility. The coordinator owns this coupled change directly; no workers are needed.

1. Preserve the initial working files and add regression tests for routes/navigation, public payloads, guide fallback, Gallery-only/shared uploads, reused builds, and older-release/preview URLs. Observe failures before changing production code.
2. Remove public Gallery route/data/rendering and its client/CSS behavior. Keep existing draft schemas, seed Gallery records, and admin endpoints. Stop resolving Gallery-only uploaded assets.
3. Prune obsolete Gallery output and extend the server's retired-route handling to Gallery and descendants without changing retained routes.
4. Update affected tests and the current product/design/readme/sidecar references. Preserve integration coverage for Gallery admin CRUD while moving public upload checks to Credentials.
5. Run focused tests, the full suite, syntax checks, and a seven-page build; verify desktop/mobile navigation, community links, guide fallback, and overflow using the installed browser. Record results and delivery limitations in the project handoff.

Delivery is source plus a verified local build. Publication and hosted deployment are separate actions.

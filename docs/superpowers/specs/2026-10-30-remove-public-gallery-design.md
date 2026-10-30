# Remove public Gallery

Approved in chat on 2026-10-30. Remove Gallery from the public portfolio and retain the existing Practice & community content and layout: Hackathons, Leadership, and Organizations.

- Public navigation, generated routes, rendered content, and Portfolio guide data omit Gallery. Seven public routes remain. The Home profile photograph stays part of the introduction.
- Gallery's grid, placeholders, lightbox, styles, and client behavior are removed. Photo questions use the guide's existing fallback.
- Fresh/reused builds omit Gallery; reused builds prune its old folder. Public and authenticated-preview Gallery URLs return 404 even when older release files exist.
- Existing Gallery admin records, validation, API support, and release snapshots remain compatible. Gallery-only uploaded assets are neither resolved nor copied into new builds; retained sections still enforce asset approval.
- Preserve unrelated working-tree changes. No database migration, content deletion, active-release publication, repository push, or hosted deployment is included.

Acceptance: seven working public destinations; unchanged community pages and Home links; no public Gallery UI/data; retained admin compatibility and upload checks; passing automated and desktop/mobile checks.

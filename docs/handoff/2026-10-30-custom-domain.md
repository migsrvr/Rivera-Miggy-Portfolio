# Public domain update — October 30 2026

The owner supplied `https://www.miggyrivera.tech/` as the new Vercel domain and asked to update the portfolio. The earlier instruction to keep work local remains in effect; no hosted deployment, domain assignment or DNS write was attempted.

Added `src/site.mjs` as the single public URL configuration. The page renderer now emits a canonical link and Open Graph URL for each public route using the new origin. Local/private preview prefixes are excluded from those public identity URLs, while navigation and assets continue to use their existing relative/local paths. README documents the new domain and the distinction between the static public website and the local owner backend. The Vercel project name and local `APP_ORIGIN` were not changed. Historical handoff URLs remain as historical records; existing résumé files were outside this website configuration update.

## Verification and local publication

- Added a regression check for the custom domain on every route and for canonical/preview-path separation; observed its expected failure before implementation.
- Full suite: 67/67 pass. Static build: 7 pages, 44 local asset references. Syntax check: 46 JavaScript modules. Whitespace checks passed.
- Previous local release: `caa579fd-1290-4214-a699-dc194ad0dcd0`.
- Current local release: `cb20566f-217c-4202-b858-159910ce6820`, published locally at `2026-10-30T06:08:39.316Z`.
- Rebuilt the already-published snapshot and confirmed all entries, relationships, assets and saved drafts were preserved. The three Home experiences, full six-entry Experience page, six credentials and removed Home community section remain in place.
- Refreshed the confirmed local server. All seven local routes returned 200 with the correct canonical and Open Graph URL and working relative navigation. Checks are in `.local/domain-update/http-checks.json`; backups/state are in that same ignored folder.

## Public domain observation

HTTPS requests to both `www.miggyrivera.tech` and `miggyrivera.tech` reached Vercel and returned HTTP 404 with `X-Vercel-Error: NOT_FOUND`. The old `miggy-rivera.vercel.app` hostname returned HTTP 404 with `DEPLOYMENT_NOT_FOUND`. These observations preceded the local code update and do not establish the exact production cause. Check the intended Vercel project's domain assignment and current Production deployment before claiming the custom domain serves the portfolio. No production repair or external publication was performed.

Source changes are uncommitted. Future approved builds use the new public URL automatically; changing metadata alone does not update the hosted deployment.

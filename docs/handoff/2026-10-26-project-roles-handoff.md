# Handoff: confirmed project roles and experience associations (2026-10-26)

> Follow-up: [confirmed experiences and work context](2026-10-26-experiences-handoff.md) records the expanded Experience inventory, displayed dates/context, and newer active release. This document remains the historical project-role update record.

Follow-up to `2026-10-26-deployed-projects-handoff.md`. The owner supplied the roles below, approved brief contribution summaries, and chose to keep only confirmed experience associations. This supersedes the previous handoff's missing-contribution item and its ten sample associations.

## Confirmed content

| Project | Role | Contribution/context |
|---|---|---|
| AWS Photobooth | Solo Full Stack Developer | Served as the sole full stack developer. |
| Care Cures | Solo Full Stack Developer | Served as the sole full stack developer on a freelance project for nursing students at the University of Makati. |
| Mediseena | Project Manager / Full Stack Developer | Managed the project and contributed to full stack development. |
| Pax Virentia | Project Manager / Full Stack Developer | Managed the project and contributed to full stack development. |
| Rule VII | AI Engineer / Full Stack Developer | Existing detailed contribution preserved. |
| Hydra | AI Engineer / Backend Developer | Existing detailed contribution preserved, with “Developed as a hackathon project.” appended. |
| Hima-Paiflow | Full Stack Mobile Developer | Handled full stack mobile development for a hackathon project. |
| Desktop-Widget | Full Stack Desktop Developer | Handled full stack desktop development. |
| SNEA | Full Stack Mobile Developer | Handled full stack mobile development for an engineering student as freelance work. |

The nine roles are stored in `src/content.mjs` and the Neon draft. Existing project purposes, URLs, repositories, tools, ordering, feature selection, diagrams, and media fields were preserved. AWS Website's role and detailed contribution were preserved. Mediseena's and Pax Virentia's previous academic labels were replaced in the role field by the supplied role titles.

The three confirmed relationships are:

- Care Cures → `freelance`, `sample: false`.
- SNEA → `freelance`, `sample: false`.
- AWS Website → `aws-sbg-jru`, `sample: false`.

Top Realty has no confirmed project links. All other projects remain unassociated with an experience until the owner supplies that context. Hydra and Hima-Paiflow are described as hackathon projects without inventing event names, dates, outcomes, or organization associations. `createSeedDraft()` now marks the factual seed relationships `sample: false`; explicitly sampled draft relationships remain supported and labeled.

Recorded project contributions appear in the existing shared player context and guide responses. Featured Home summaries derive from the project role. No layout, API, schema, dependency, or authentication changes were needed.

## Backup, synchronization, and release

- Full draft backup: `.local/backups/project-roles-before-2026-10-26T12-10-50.893Z.json`.
- Previous active release: `5ac23b9b-fc42-4bb9-bbcb-a85655d0cab6`.
- New active release: `a9ed30be-67a8-4455-98b1-953243c45fca`.
- Local publication report: `.local/project-roles-update-state.json`.

The live draft matched the pre-change baseline. Nine projects' role/contribution fields and the relationship replacement were committed in one Neon transaction with locks and an unchanged-draft check. Assertions verified all other entry fields, all unrelated entries, and assets against the saved backup. The draft still contains 29 entries; relationships changed from ten sample links to three factual links.

Publication ran through the authenticated admin API of the existing Windows server at `http://127.0.0.1:4173/`. Its in-memory active release switched immediately; no server restart was needed. The one-off authenticated session was logged out afterward. An earlier Linux-side publish attempt timed out before creating a release; the Windows admin preview/publish completed successfully.

The authenticated private preview was checked before publication. The new release's immutable snapshot and the public Home, Projects, and three experience detail pages were verified against the approved draft and generated files. Recorded project payloads and portfolio guide answers contain the approved contributions; no stale sample associations appear. GitHub activity was successfully captured in the release.

## Checks and owned files

- Updated relationship expectations in `tests/content.test.mjs` and `tests/annotations.test.mjs`. Added a mixed factual/sample relationship case to retain explicit sample-label coverage.
- Confirmed expected failures against the old sample relationships before updating the seed and model; the affected tests then passed 19/19.
- `npm test`: passed. The same full suite run with `--test-isolation=none --test-reporter=spec` passed 50/50 individual tests.
- `npm run check`: passed, 39 JavaScript modules.
- `npm run build`: passed, 11 routes and 23 local asset references.
- Updated `PRODUCT.md` and `README.md` to describe the current roles, configured links, and factual associations.
- Source changes for this follow-up are confined to the content seed, seed relationship flag, the two affected test files, and project documentation. Existing unrelated uncommitted work was retained. Nothing was committed or deployed to a hosted portfolio.

## Remaining real-data work

- Hydra's website and repository links remain pending.
- The three recorded projects still need real walkthrough purposes, recordings, repository links, and posters.
- Hackathon event names/results, credentials, experience details, and additional gallery photos remain to be supplied.
- Additional feature-level contribution details and project associations need owner confirmation.
- The pre-existing Photobooth purpose mentions printing/emailing; the earlier handoff warns that its README describes a stub backend. This role update preserved that purpose text and makes no new feature-completion claims.
- The earlier migration export still contains its original ten historical relationships; it was preserved as a recovery source.

# Handoff: confirmed experiences and work context (2026-10-26)

> Follow-up: [supplied experience logos](2026-10-27-experience-logos-handoff.md) records the logo assets, JPEG-serving support, and newer active release.

Follow-up to `2026-10-26-project-roles-handoff.md`. The owner supplied professional and student leadership experience, approved showing both AWS roles in Experience and Leadership as student leadership, retained independent freelance work, and chose to show supplied dates and work context.

## Confirmed entries

Experience uses this order. The three existing IDs and their URLs were preserved.

| ID | Role and organization | Period | Type | Location / mode |
|---|---|---|---|---|
| `top-realty` | Information Technology Intern · Top Realty Corporation | Oct 2026 – Present | Internship | Makati, National Capital Region, Philippines · On-site |
| `workflow-ph` | Tech Officer · WorkFlow PH | Feb 2026 – Present | Full-time | Not supplied |
| `aws-external-affairs` | Vice President of External Affairs · AWS Student Builder Group — JRU | Apr 2026 – Present | Student leadership | Hybrid |
| `aws-sbg-jru` | Web Developer Lead · AWS Student Builder Group — JRU | Jan 2026 – Present | Student leadership | Hybrid |
| `flyrank-ai` | Backend AI Engineer Intern · FlyRank AI | Jun 2026 – Sep 2026 | Internship | Chicago, Illinois, United States · Remote |
| `freelance` | Freelance developer · Independent commissions | Not supplied | Freelance | Not supplied |

The AWS descriptions retain the supplied ten-developer team, Git workflows/sprints/reviews, mentoring, website delivery details, two official partners including AWS Learning Club – Polar Chapter, 5–10 monthly partnership inquiries, industry event representation, Relations Committee supervision, correspondence, and proposal evaluation. No unseen continuation of the pasted text or new performance measurements were added.

FlyRank's description now uses past tense: “Completed an internship focused on backend AI engineering at FlyRank AI.” Top Realty has a short factual internship description. WorkFlow responsibilities remain absent. The current-activity line mentions both Top Realty and WorkFlow PH.

The existing Leadership entries share the two AWS role definitions with Experience, preventing descriptions and metadata from drifting in the seed. Organizations uses matching role names. The existing three factual project associations remain unchanged: Care Cures/SNEA → freelance; AWS Website → AWS SBG–JRU. No associations were inferred for the new employers or external-affairs role.

## Model and presentation

- Experience and Community records now accept optional `employmentType`, `location`, and `workMode` strings, alongside existing `startDate` and `endDate`. Missing metadata defaults to null; no SQL migration or endpoint change was required.
- Supplied months are stored as `YYYY-MM`. `src/experience.mjs` exports shared `formatExperiencePeriod()` and `formatExperienceContext()` helpers for rendering and the browser guide. Existing free-text dates remain supported. A known start with no end displays Present; fully absent periods display nothing.
- Home lists all six compact roles with periods. Experience and Leadership rows and detail pages show supplied work context and descriptions. Empty descriptions, metadata, and related-project sections are omitted.
- Admin Experience and Community forms expose the new fields and date-entry help. The static builder copies and checks the new shared browser module, including in prefixed private previews.
- Company logo placeholders remain because actual assets were not supplied. LinkedIn interface fragments, changing duration counters, repeated status labels, and incomplete skill badges were omitted.
- Current seed/draft inventory: 32 entries, six experiences, three factual relationships, and 14 public routes. The historical migration export remains untouched.

## Backup and publication

- Full draft backup: `.local/backups/experiences-before-2026-10-26T13-04-41.126Z.json`.
- Previous active release: `a9ed30be-67a8-4455-98b1-953243c45fca`.
- New active release: `26a08d50-4ab8-439d-b327-116849105830`.
- Published: `2026-10-26T13:12:13.288Z`.
- Local operation report: `.local/experience-update-state.json`.

The live draft matched the pre-change seed fields. Scoped updates to the profile, six experience records, two Leadership entries, and the organization role summary were committed in one Neon transaction with unchanged-draft and preservation assertions. All project records, other entry fields, assets, and relationships were preserved.

The identified Windows Node development server was restarted to load the updated schema and renderer. Its previous active release remained available after restart. New server logs are `.local/logs/experience-dev-out.log` and `.local/logs/experience-dev-error.log`.

An authenticated preview was checked before publishing through the running server's admin API. All 14 preview routes and all 14 public routes were verified for headings and relevant metadata. The published release snapshot was checked against the backed-up draft plus the approved changes. Served public pages were compared byte-for-byte with the new release files. The new browser helper, compact Home rows, Leadership, empty-state omission, completed FlyRank period, undated freelance entry, and guide answers were verified. GitHub activity was captured successfully. The one-off owner session was logged out.

## Validation and files

- New behavior tests cover current/completed/absent/legacy periods, metadata round-trip and older entries, escaping, compact versus full presentation, missing sections, AWS consistency, and guide context.
- Expected failures were observed before implementation; affected checks then passed 24/24. Updated route and inventory expectations and tested importing the generated browser guide with its shared dependency.
- `npm test`: passed all ten test files. The same full suite with `--test-isolation=none --test-reporter=spec` passed 55/55 individual tests.
- `npm run check`: passed, 41 JavaScript modules.
- `npm run build`: passed, 14 pages and 24 local asset references.
- Whitespace checks passed with existing CRLF line endings accounted for.
- Changes are in the content seed, model, renderer, guide, shared experience helper, admin field definitions, builder module list, affected tests, and current project documentation. Existing unrelated uncommitted work was preserved. No commit or hosted deployment was performed.

## Remaining supplied-content gaps

- Actual company/organization logo assets.
- WorkFlow PH responsibilities and detailed Top Realty duties.
- Freelance dates and any additional confirmed project-to-experience associations.
- The earlier handoff's remaining recordings, credentials, gallery photos, and hackathon event details.

# Earned credentials update — October 30 2026

The owner supplied a screenshot of six earned credentials and their individual Credly links, and requested adding them to the portfolio. The six sample credentials were replaced in the source seed and archived in the saved Neon draft. All other entries, relationships and uploaded assets were preserved. The existing monochrome list layout and Home's two-entry preview are retained.

| Credential | Provider | Supplied date label |
|---|---|---|
| AWS SBG Core Team Member Badge | AWS Community | Issued Jul 22, 2026 |
| CompTIA IT Fundamentals+ (ITF+) Certification | CompTIA | Issued Nov 27, 2024 |
| IT Specialist - Databases | Certiport, a Pearson VUE business | Expires May 6, 2031 |
| IT Specialist - Java | Certiport, a Pearson VUE business | Expires Nov 12, 2030 |
| JavaScript Essentials 1 | Cisco | Issued Aug 9, 2026 |
| JavaScript Essentials 2 | Cisco | Issued Aug 12, 2026 |

The supplied `/earner/earned/badge/<id>` links were converted to public `/badges/<id>/public_url` links. All six public pages returned HTTP 200 and confirmed the expected credential, provider and Miggy Rivera recipient (CompTIA uses the full name Miggy Guzman Rivera). Unmodified original badge images are stored in `public/assets/credentials/`; `SOURCES.txt` records their public verification and image URLs. These are the actual badge images rather than the padded social-sharing thumbnails. The existing logo treatment displays them in grayscale.

Issue/expiry labels use the existing optional credential `date` field, which is now rendered below the provider on Home and Credentials. The admin label/help explains how to enter an issue or expiry label. No issue date was inferred from an expiry date, and no database schema migration was needed. Verification links open public Credly pages in a new tab. The portfolio guide derives these facts from the same published snapshot.

## Saved content and local publication

- Before-update backup: `.local/credentials-import/before.json` (32 entries, 5 uploaded assets).
- Original active release: `0f36b45b-4ab4-49b3-8403-2733774464c9`.
- Current local release: `46f44c05-9e04-4d60-a17d-511ec552a364`.
- Published locally at `2026-10-30T05:29:13.528Z`.
- Saved draft: six new factual credential IDs, plus the six original `credential-1` through `credential-6` records archived, so history is recoverable. Six credentials are visible; sample labels disappear from this section.
- Other saved content, relationships and uploaded assets were compared before/after and preserved. No pre-existing unpublished draft changes were present before the update.
- Local server: `http://127.0.0.1:4173/credentials/`; admin: `http://127.0.0.1:4173/admin/`.
- Operation state/verification: `.local/credentials-import/state.json` and `browser-results.json`. Scripts in that folder are task-local, not general migration tools. Do not rerun `--apply` after it has already succeeded.

## Verification

- Added a regression check for credential issue/expiry labels, HTML escaping, omitted missing dates and safe verification links. Its initial failure confirmed dates were not rendered before the change.
- Updated older tests to use explicit missing-link and sample fixtures instead of assuming the content seed remains placeholder data.
- Full configured suite: 65/65 pass. The first restricted Windows run had three temporary-file permission errors; the same suite passed outside that restriction without code changes.
- Syntax check: 45 JavaScript modules. Static build: 7 pages, 44 local asset references verified.
- Verified authenticated admin persistence, archived samples, public Home preview, published portfolio-guide answers, six links and six loaded badge images.
- Browser checks and visual review at 1440px, 390px and 320px: no horizontal overflow or JavaScript errors. Screenshots are in ignored `outputs/credentials/`.
- Authenticated verification sessions were logged out. No credentials or connection strings were written to public files.

## Hosting status

Automatic approval review rejected an attempted Vercel deployment because the earlier backend plan limited that build to local services and lacked explicit authorization for the external upload. The owner was asked and explicitly selected **Keep local for now**. No Vercel deployment occurred; the hosted portfolio is unchanged. Do not deploy this update until the owner asks to publish it.

Source changes are uncommitted. A future approved deploy should use the existing active-release deployment workflow after checking that this is still the intended release and content.

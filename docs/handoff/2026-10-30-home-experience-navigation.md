# Home experience preview and navigation — October 30 2026

Follow-up: [Home community section removal](2026-10-30-home-community-removal.md) records the owner's subsequent request to remove the body section as well, and the newer local release.

The owner requested removing the Practice & community group shown in the sidebar screenshot, and showing only Top Realty, freelance work and FlyRank AI in Home's Experience section.

- Desktop sidebar and mobile navigation now contain Home, Projects, Experience and Credentials only. Removed the unused community navigation styles.
- Home selects the existing `top-realty`, `freelance` and `flyrank-ai` records in that exact order, independently of the global Experience list ordering. It uses the existing row design, titles, logos and dates. Hidden or archived selections are omitted rather than replaced with unrelated roles.
- View all still opens `/experience/`, containing all six visible experiences. The portfolio guide still has the full experience data.
- The screenshot removal concerns navigation. Existing Practice & community links in the Home body and the three community page URLs remain available. No community records were deleted or archived.
- The six earned credentials from the preceding change are preserved.

## Local publication

The change affects templates only. Rebuilt the previously published content snapshot instead of publishing any unrelated changes that might be in the admin draft. Compared the saved draft before/after and confirmed it was unchanged.

- Previous local release: `46f44c05-9e04-4d60-a17d-511ec552a364`.
- New local release: `7cd41f09-0e35-4d82-b15f-76828720a5c1`.
- Published locally: `2026-10-30T05:39:00.306Z`.
- Task-local backups, publication script and operation report: `.local/home-navigation/`.
- Refreshed the confirmed portfolio Node server to load the new templates for future previews/publications as well as the completed release.
- Local preview: `http://127.0.0.1:4173/`.

## Validation

Updated regression checks first and observed failures for the old navigation group and six Home experiences. Then verified the requested order remains stable even if the full list is reordered, missing selections do not cause fallback to other roles, full experience is preserved, and rendering does not mutate content. Older Gallery-removal tests were adjusted because community links are now in the Home body rather than every page's sidebar.

- Full suite: 66/66 pass.
- Static build: 7 pages, 44 local asset references.
- Syntax check: 45 JavaScript modules. Whitespace check passed.
- Browser checks at 1440px, 390px and 320px confirmed three Home rows, four navigation links, working View all, all six full Experience rows, no horizontal overflow and no JavaScript errors. Opened and checked the mobile menu. Reviewed rendered experience-section screenshots at desktop and mobile sizes.
- Screenshots: ignored `outputs/home-navigation/`. Browser report: `.local/home-navigation/browser-results.json`.

All work remains local under the owner's earlier explicit instruction. No Vercel deployment was attempted. Changes are uncommitted, alongside the earlier credentials update.

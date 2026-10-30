# Handoff: all projects live, demos removed, SNEA dropped (2026-10-27)

> Follows [deployed projects](2026-10-26-deployed-projects-handoff.md). Read that one for how content flows (seed → Neon draft → publish → `.local/releases`).

## What changed

**Every project is now a live project.** The "recorded" project type and all video demo support are gone from the public site, the data model, the admin, and the server. The Projects page is a single list of live projects.

| Project | Live URL | Repo |
|---|---|---|
| Hima-Paiflow (`hima-paiflow`) | https://hima-showcase.vercel.app (Vercel `hima-showcase`; the bare app is `hima-demo`, linked from the showcase) | migsrvr/hima-paiflow |
| SESSION (`desktop-widget`, retitled) | https://session-xi-mauve.vercel.app (Vercel `session`) | migsrvr/Desktop-widget |

- **SNEA** is removed from the seed and its Freelance link is dropped. In the Neon draft it is **archived** (reversible), not deleted. The Freelance description is unchanged, by the owner's choice.
- **Hydra** still has `url: null` and shows "Website link coming soon". The owner is finalizing its deployment.
- The internal id stays `desktop-widget` so links and the database keep working; only the title is SESSION.

### Code
- `src/content.mjs`: Hima and SESSION are in `deployed`. The `recorded` array is gone. `assistantContent.projects` is just `deployed`. The Projects route description is "Live projects and code."
- `src/model.mjs`: removed `kind`, `videoUrl`, `poster`, and `mark` from the project schema. Zod `z.object` strips unknown keys, so old rows or snapshots that still carry them keep validating. `toContent()` returns `deployed: projects` and no longer returns `recorded`.
- `src/render.mjs`: deleted `demoGallery()`, the `recorded-data` JSON, and the unused `prefix` helper. The intro now reads "Live projects and code."
- `src/client.mjs`: deleted the demo player block. `src/media.mjs` now exports only `safeExternalUrl`, since `videoSource` and `selectProject` were removed.
- `src/styles.css`: removed the `.recorded-section`, `.collection-count`, `.selector-instruction`, `.demo-*`, and `.play-demo` rules.
- `src/assistant.mjs`: now says "N projects are listed: …", and `demo|demos` are no longer keywords.
- `admin/admin.mjs`: removed the Project kind, External video URL, Video poster, and Short mark fields.
- `server/publisher.mjs`: projects no longer have a poster asset field. `server/app.mjs`: the admin CSP no longer allows YouTube frames or external media (`frame-src 'self'; media-src 'self'`).
- **Tech stack:** the new tools added 7 entries (23 total). I added Simple Icons SVGs (CC0, same source as the existing icons, noted in `public/assets/tech/SOURCES.txt`) for Expo, Express, Stellar, Vite, Tauri, and Rust. React Native reuses `react.svg` (`src/activity.mjs` logo map).

### Tests
Updated `tests/content.test.mjs`, `portfolio.test.mjs`, `project-revision.test.mjs`, `tech-experience.test.mjs`, and `experience.test.mjs` for 9 live projects, 2 relationships, and 23 tech marks, plus new assertions that no demo or video markup renders and that retired fields are stripped.

Result: **58 pass, 1 fail.** The failure is `annotations.test.mjs` "gallery is a navigation destination…". It is **pre-existing and unrelated**: the committed `src/content.mjs` gallery already has no photo item, so `data-gallery-open` never renders. Either restore a gallery photo or update that test; ask the owner which.

`npm run check` passes (42 modules), and `npm run build` built 8 pages and verified 38 local assets.

## Database and release
- Script: `.local/portfolio-deployed-sync.mjs` (it does a dry run unless given `--apply`).
- Backup: `.local/backups/deployed-sync-before-2026-10-27T09-41-29.808Z.json` (an identical dry-run backup from 09-41-16 also exists).
- Ten project rows were saved. All of them had `kind`, `videoUrl`, `poster`, and `mark` stripped; none had a real video or poster set. Hima and SESSION got their title, purpose, tools, url, and repo, and SNEA was archived. Relationships went from 3 to 2 (the `snea → freelance` link was dropped).
- Previous active release: `09337171-ac79-4ae7-aaf8-e21d31282212`. **New active release:** `3fef8681-bd6b-4129-9a74-952808fcbd2b`.
- I restarted the dev server (`npm run dev`, http://127.0.0.1:4173/) so it loads the new code. I then verified that `/projects/` shows 9 projects with 8 live links, Hydra's "coming soon", and no SNEA or demo markup, and that all new tech icons are served with HTTP 200.

## Vercel deployment (static public site)

- **Live:** https://miggy-rivera.vercel.app (Vercel project `miggy-rivera`, team `hyakkimaru0123-7781s-projects`, hobby plan).
- **What's deployed:** only the **active published release** (`.local/releases/<id>/`), as a static site. The admin, Fastify API, and Neon database are **not** on Vercel; they stay local, by the owner's choice. Hosting the admin would need the publisher and originals moved to Blob storage, plus production auth, so it's separate work.
- **How to update the live site:** edit in the local admin, click **Publish**, then run `npm run deploy` (or `npm run deploy -- --preview` for a preview deploy).
- `scripts/deploy-vercel.mjs` reads `.local/active-release.json`, copies that release into `.local/vercel-site/` (it keeps the `.vercel/` project link there), writes a `vercel.json`, links the project on first run, and runs `npx vercel deploy --prod --yes`.
- `vercel.json` (generated): sets `trailingSlash: true`, serves `.jfif` logos as `image/jpeg` (Vercel would otherwise send `application/octet-stream`), and serves `.mjs` as `text/javascript`.
- Deployed release: `da749b83-3db0-4bdb-8362-ce672695e23d`. I republished after deleting the unused demo icons `public/assets/play.svg` and `play-small.svg` (`git rm`). The previous release was `3fef8681-…`.
- Verified publicly (no login required): all 8 routes return 200, an unknown path returns 404, `/projects` returns a 308 redirect to `/projects/`, CSS/JS/JFIF/SVG/PDF/TTF content types are correct, the Projects page has 8 live links, and there's no demo or SNEA markup.
- **No GitHub integration.** The Vercel project isn't connected to the repo (`github.com/migsrvr/Rivera-Miggy-Portfolio`), so deploys come only from the CLI script, not from git pushes. That's deliberate: a git build would deploy the seed content, not the published release.

## Open items
1. **Hydra:** when it's deployed, add `url` (and `repositoryUrl` if public) in `src/content.mjs` and the draft, then publish. The deployed-links test expects Hydra's url to be `null` until then.
2. **Gallery test:** see above. This is pre-existing.
3. **Nothing is committed.** Only commit when the owner asks.

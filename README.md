# Rivera 2026 portfolio

A monochrome portfolio with an owner-only admin dashboard. Public pages stay generated HTML; Neon PostgreSQL stores drafts, relationships, assets, and releases through the Fastify server. Private original files stay in ignored `.local/originals/`. The public domain is [www.miggyrivera.tech](https://www.miggyrivera.tech/); the admin and publishing backend run locally.

## Run locally

Requires Node.js 22.16+ and a PostgreSQL `DATABASE_URL` with permission to create the dedicated `portfolio` schema. Docker is not required for the application. Put the server-only connection in ignored `.env` or `.env.local`, then run:

```sh
npm ci
npm run setup:local
npm run dev
```

- Portfolio: http://127.0.0.1:4173/
- Admin: http://127.0.0.1:4173/admin/
- Owner credentials: `.local/owner-credentials.json` (ignored and never served publicly).

Configuration loads `.env`, then `.env.local`; process environment values have highest priority. Setup retains the supplied connection and session secret, applies checksummed migrations, reuses an existing owner, and imports the preserved source export into an empty content store. Without an export it seeds an empty store. A new password is generated only when both the owner and saved owner credentials are absent. Re-running setup preserves entered data.

Use `npm run owner:setup` to set credentials interactively or `npm run owner:preserve` to reuse the saved credential file. Both revoke existing sessions. `npm run owner:generate` creates credentials only for an absent owner and refuses to replace a saved credential file.

## Edit and publish

Edit Profile, Projects, Experiences, Credentials, or Community. Save draft, open a protected Preview draft, then Publish locally. A successful build switches the public site to an immutable release. Restoring an older release does not overwrite the draft.

The public site has seven pages, with Hackathons, Leadership, and Organizations under Practice & community. Gallery has been retired from public navigation, pages, and guide answers. Existing Gallery records remain editable in admin but do not contribute assets to new previews or releases. Retired Gallery URLs return 404, including in older releases and authenticated previews.

Uploads are private by default. Approve an asset for public use before publishing an entry that references it. Images support JPEG/PNG/WebP up to 10 MB; PDFs up to 20 MB. Videos use external links. Experiences and Community support optional start/end months, employment type, location, and work mode. Use YYYY-MM or existing display text; an empty end date means Present only when a start date is supplied. Home shows compact periods; full pages and guide answers include supplied work context. Projects may connect to zero, one, or several experiences in the authenticated admin. These associations stay private. Public Experience rows are plain text with supplied descriptions; individual detail URLs return 404. Up to three visible projects can be featured.

Current sample credentials and hackathon entries stay explicitly labeled until replaced with real references. Project roles and brief contributions are owner-confirmed. The three factual experience associations are Care Cures/SNEA → freelance work and AWS Website → AWS SBG–JRU; other projects remain unlinked until their context is confirmed. These connections are preserved for owner editing and omitted from public HTML and embedded JSON. The guide derives its answers from the active published content and uses no external AI service.

## Public domain

`src/site.mjs` defines the public URL as `https://www.miggyrivera.tech/`. Generated pages use it for their canonical and Open Graph URLs, including when rendering protected local previews. Navigation and assets use relative paths. The local admin's `APP_ORIGIN` stays `http://127.0.0.1:4173`; the custom domain hosts the static public site.

After publishing locally, `npm run deploy` can deploy the active release to the existing Vercel project when the owner authorizes a hosted update. Domain assignment is managed in that project's Vercel settings. Updating source URLs alone does not publish the website or repair a missing production deployment.

## Documentation

- [Setup and operating guide](docs/backend/SETUP.md)
- [Owner API](docs/backend/API.md)
- [Reference handoff checklist](docs/backend/REFERENCE-CHECKLIST.md)
- [Domain terms](CONTEXT.md)

`src/content.mjs` is the initial seed fixture. Live edits are in Neon PostgreSQL, validated by `src/model.mjs`. The renderer/builder accept content snapshots. Public releases and the active pointer are stored under ignored `.local/`; the initial static fallback is `dist/`. Admin code is separate in `admin/` and backend code in `server/`. One server-managed owner uses a scrypt password hash and persisted hashed session tokens; the browser receives an encrypted HttpOnly SameSite Strict cookie. Database credentials remain server-only.

## Verify

```sh
npm test
npm run test:integration
npm run check
npm run build
```

Integration tests use `TEST_DATABASE_URL` pointing to local PostgreSQL with permission to create temporary databases. The command loads ignored `.local/test-db.env` when present; each suite creates an isolated database and refuses hosted targets. The separate local PostgreSQL test container is independent of the configured Neon database. Live Neon smoke verification runs separately from automated integration tests.

`npm run build` regenerates the fixture fallback; use the admin Publish locally action for the active database-backed site. The migration retained an ignored source export, the previous environment backup, the saved owner credentials, five historical release records, existing release folders, and the active pointer. See the setup guide for recovery and import commands.

The real supplied stage photo and résumé are preserved. Photo grayscale/contrast is CSS only. Original Figma SVG exports and self-hosted Libre Caslon Display/Manrope fonts remain in public/assets, with font licenses. Design provenance is recorded in DESIGN.md.

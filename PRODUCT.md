# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Local portfolio with generated semantic HTML, shared `src/styles.css`, and vanilla JavaScript progressive enhancement. Node.js 22.16+ and Fastify serve the public files, owner admin, and authenticated API. Neon PostgreSQL stores content through server-only `pg` queries in the dedicated `portfolio` schema. Fastify manages one owner and persisted sessions; private original files remain in ignored `.local/originals/`. The validated model uses Zod. No hosted deployment is configured.

## Users

Employers evaluating Miggy Rivera for developer roles need to understand his technical work, contribution, experience, and contact options. Miggy uses the private owner admin to maintain content, upload evidence, preview drafts, and publish or restore local releases.

## Product Purpose

Present actual development work and professional context in a concise portfolio. Public routes provide Home (`/`), Projects (`/projects/`), Experience (`/experience/`), Credentials (`/credentials/`), Hackathons (`/hackathons/`), Leadership (`/leadership/`), Organizations (`/organizations/`), Gallery (`/gallery/`), and detail routes derived from visible experience IDs. The seed has eleven routes. The owner admin is `/admin/` at `http://127.0.0.1:4173/`; publication remains local.

## Operating Context

Neon PostgreSQL stores the live draft; `src/content.mjs` is the baseline seed fixture. `src/model.mjs` validates records and adapts consistent snapshots for `src/render.mjs` and the Portfolio guide. The seed contains 29 entries and ten sample project/experience relationships. Public visitors read immutable generated files from the active local release without database calls. Saving a draft does not alter that release. Preview draft creates an authenticated temporary build; Publish locally creates a new snapshot and switches the active pointer only after a successful build. Restore changes the active build without changing the draft. `npm run build` builds the fixture into `dist/` and does not replace a database-backed release.

The approved centered dark Figma folio is the design source; website source and rendered output describe delivered behavior. Work is labeled Projects. Home Practice & community contains three full-row links to Hackathons, Leadership, and Organizations. These separate reading pages reuse Experience/Credentials patterns. A fixed sidebar serves desktop; a native Menu dialog serves compact screens. Optional profile destinations stay hidden until configured. GitHub is https://github.com/migsrvr.

## Capabilities and Constraints

- Home includes the configured photograph, profile, résumé/email, up to three visible featured project sheets, compact Experience rows, three Practice & community category links, up to two credential previews, a logo-based tech stack, and a grayscale GitHub contribution calendar. Contact and colophon information live in the sidebar and mobile Menu. Empty selected work has an honest placeholder; one and two sheets use compact stack sizing.
- Projects presents visible deployed work with the first entry spanning the desktop grid; supporting entries use two columns and stack on mobile. The seed lists AWS Website, AWS Photobooth, Care Cures, Mediseena, and Pax Virentia. There are no separate deployed-project detail pages.
- Visible recorded choices update one shared 16:9 player and its purpose/contribution context; the seed contains five. Both selectors support arrows, Home, and End with roving focus. Selection never starts playback. Counts, sample notices, experience detail routes, and guide answers derive from each snapshot.
- Seed video, deployed-site, repository, and credential verification URLs are absent. Missing videos display Video preview pending and a disabled Demo coming soon action. Configured videos support privacy-enhanced YouTube or native MP4/WebM/Ogg playback after an explicit Play action.
- Featured project headers are real title-only rear sheets, with a connected active detail panel and no automatic rotation.
- Gallery appears in navigation only; its seed contains one supplied stage photo and three labeled empty slots. Actual photos open a native lightbox.
- Ask about my work opens a local rule-based Portfolio guide. It answers configured facts, provides real internal links, handles unknown questions honestly, and stores nothing outside the current tab. It uses no external model, API key, or network requests.
- The seed Experience has three plain rows: current Top Realty internship, two freelance projects for nursing/engineering students, and the AWS Web Development Lead contribution. No internship duties or dates are invented. Logo marks remain placeholders. Complete row anchors open dedicated detail pages. Related project links and reverse Projects links use user-authorized sample associations, visibly labeled as such; they are not supplied employment claims.
- The seed Credentials has six explicitly generic sample rows, each with logo, certificate name, provider, and a verification label. There are no credential cards, filters, dates, or detail pages. Missing verification links are unavailable text. A supplied document can use View certificate, which represents document evidence rather than independent verification.
- The seed Hackathons has one explicitly labeled sample entry because event/role/result facts are not supplied. Leadership uses the known AWS Web Development Lead and VP of External Affairs roles. Organizations uses known AWS SBG–JRU involvement and Notion Campus Leader. Unknown descriptions are omitted; dates, awards, logos, and duties are not invented.
- The complete Home community rows are keyboard-accessible anchors. Each category page has a semantic heading, plain reading rows, and Back to home.
- Navigation, lightbox, and guide use native dialogs with Close/Escape and focus return. Input is limited to 500 characters, empty Send is disabled, and user text is never rendered as HTML.
- Admin offers Profile, Projects, Experiences, Credentials, Community, Gallery, Assets, and Releases as plain forms and reading lists. Existing IDs are locked; position, visible, sample, and archived fields control presentation. Projects support tools, workflow stages, and zero or several experience relationships, each independently marked as a sample. Failed saves retain entered values; unsaved edits warn before leaving. Pending, empty, and error states use explicit text.
- Fastify protects the API and private originals for one owner using a scrypt password hash and persisted hashed opaque session tokens. Sessions expire after seven days; logout and owner reset revoke them. Encrypted HttpOnly SameSite Strict cookies carry the session and CSRF nonce; writes require Origin and CSRF checks. Database credentials stay server-only, PUBLIC access to the dedicated `portfolio` schema is revoked, and there is no public database API or account registration.
- Uploads accept validated JPEG/PNG/WebP images up to 10 MB and PDF documents up to 20 MB. Originals are private by default in ignored `.local/originals/`. Publishing requires explicit public approval and copies only referenced approved assets; earlier release copies remain immutable. Preview can use private assets behind owner authentication. Videos use external URLs; no remote asset ingestion runs automatically.
- Setup uses `npm run setup:local` with a server-only PostgreSQL `DATABASE_URL`; Docker is not required for application operation. `.env.local` overrides `.env`, and process environment values have highest priority. Setup preserves the connection, session secret, saved owner credentials, and populated content. The migration retains the ignored source export, environment backup, five historical releases, existing release folders, and active pointer. See `docs/backend/SETUP.md` and the owner API documentation for commands and recovery. Automated database tests require a separate local `TEST_DATABASE_URL` and isolated temporary databases; hosted Neon smoke verification runs separately. Hosting, analytics, tracking, external AI, and repository push are outside this delivery.

## Brand Commitments

Preserve the narrow centered dark brochure, white text, eight grayscale colors, Libre Caslon Display headings, Manrope reading text, sharp project sheets, transparent reading rows, and fine rules. Cards belong only to project browsing.

## Evidence on Hand

Miggy is an Information Technology student at Jose Rizal University and currently interns at Top Realty Corporation. His AWS role and contribution are supplied: led and built most of the site, including registration, admin review, and automated emails. The other four deployed projects have confirmed names/status; unprovided roles, tools, and descriptions remain pending. Hydra and Rule VII use supplied project facts; Hima-Paiflow, Desktop-Widget, and SNEA retain explicit summary placeholders.

The real supplied photo, résumé, and email are included. Photo SHA-1 `39d5b2dff771bc1290d9e8272a5fb8ee36b8f37a` matches its Figma image hash; `work/asset-provenance.json` records preserved bytes and treatment. Local SVGs are original Figma exports. Fonts are self-hosted with OFL licenses. Credential names/providers/logos/URLs remain sample content, not real awards.

Design provenance: Figma file `7rn1fyhZs4dJxqjHdJ1Xao`, page `14:233`; Home `14:261`/`14:263`, Projects source `27:483`/`27:484`, Experience `39:1679`/`39:1738`, Credentials `34:1443`/`34:1549`. Baseline implementation evidence includes `work/web-surface-brief.md`, `work/implementation-brief.md`, `outputs/browser-verification.json`, and `outputs/interaction-verification.json`. Annotation evidence is in `outputs/annotations/` and `docs/superpowers/specs/2026-10-26-portfolio-annotations-design.md`. Backend authority is `docs/superpowers/specs/2026-10-26-neon-migration.md`, `docs/backend/SETUP.md`, and current model, admin, server, and `db/migrations/` sources. The earlier Supabase backend contract remains historical reference. Earlier public review/test records describe their baseline scope; final backend verification is recorded separately. All eight original grayscale values and both font families remain.

## Product Principles

- Make actual work and ownership easy for employers to assess.
- Distinguish supplied facts, conceptual diagrams, samples, and missing evidence.
- Preserve real assets and the approved visual identity.
- Keep content changes centralized and optional destinations honest.

## Accessibility & Inclusion

Use semantic headings and lists, a skip link, current-page navigation, visible keyboard focus, tab/selector keyboard support, descriptive photo text, and reduced-motion support. Missing destinations remain noninteractive rather than misleading links.

Home activity uses an optional ordered Profile techStack list, otherwise unique tools from visible projects. Eight known technologies have locally hosted Simple Icons logos; other configured tools use text. Preview and publication fetch the public GitHub calendar from the configured profile, validate its dates/counts, and freeze it with the release. Visitor pages request no GitHub data. Missing/unavailable calendars show an honest fallback and a profile link when available.

# Backend and owner admin

The public portfolio is generated HTML. Owner edits live in Neon PostgreSQL and become public after a successful local publish. Fastify is the only database client; private originals live under ignored `.local/originals/`. No hosted website deployment is configured.

## Start

Use Node.js 22.16 or newer. Configure server-only `DATABASE_URL` in ignored `.env` or `.env.local` with a Neon PostgreSQL connection that can create the dedicated `portfolio` schema. Connections to Neon verify TLS; local PostgreSQL is also supported. Docker is not required to run the application.

Configuration reads `.env`, then `.env.local`; process environment values take precedence over both. Keep connection strings, `SESSION_SECRET`, and owner credentials private. `SESSION_SECRET` must contain at least 32 characters; setup generates one only if absent and preserves an existing value. Set `APP_ORIGIN`, `HOST`, and `PORT` when overriding the local defaults. Production mode requires an HTTPS origin and enables secure cookies.

```sh
npm ci
npm run setup:local
npm run dev
```

Open http://127.0.0.1:4173/admin/. Setup applies checksummed migrations, retains an existing owner, and configures an absent owner from saved credentials when available. It imports `.local/migration/supabase-export.json` only into an empty target content store; otherwise it preserves existing content. An empty target without a saved export receives the seed fixture. The configured database connection, session secret, release folders, and active pointer are preserved on repeat runs.

The saved email/password are in `.local/owner-credentials.json`, which is ignored and never served by the website. Setup reuses that file without changing it. Public account registration is disabled.

| Command | Purpose |
|---|---|
| `npm run db:migrate` | Apply pending SQL migrations under a transaction advisory lock; reject changed checksums. |
| `npm run owner:setup` | Choose owner email/password interactively, with hidden password entry; revoke sessions. |
| `npm run owner:preserve` | Reuse `.local/owner-credentials.json`; revoke sessions. |
| `npm run owner:generate` | Generate credentials for an absent owner; refuse an existing owner or credential file. |
| `npm run seed` | Seed only an entirely empty content store. |
| `npm run content:import -- path/to/export.json` | Import a schemaVersion 1 export into an empty content store. |

## Preserved migration source

The ignored `.local/migration/supabase-export.json` retains the source's 29 entries, ten relationships, zero uploaded assets, and five historical releases. `.local/migration/supabase.env.backup` retains the previous environment. The owner credential file, `.local/releases/`, and `.local/active-release.json` are retained. Historical Supabase migrations and contracts are reference material; current operation follows `docs/superpowers/specs/2026-10-26-neon-migration.md` and `db/migrations/`.

Import commits content and release records in one PostgreSQL transaction, preserving release IDs, snapshots, states, and timestamps. It rejects any populated target, including one containing only assets or releases. Originals, when present, are read from an `originals/` directory beside the export and copied with contained storage keys into `.local/originals/`; differing existing files are never overwritten. Import leaves existing release folders and the active pointer in place. Re-running setup preserves an already populated database. Preserve the Neon database and `.local/` together when moving or backing up the working setup. Original Supabase volumes remain recoverable; no destructive teardown is part of the migration.

## Work with content

The admin has Profile, Projects, Experiences, Credentials, Community, Gallery, Assets, and Releases. Existing IDs are fixed. Order controls sorting, Visible controls inclusion, and Archived retains a record without including it in the site. Sample is explicit illustrative content. No date, duty, result, or award is inferred from missing data.

Projects select deployed or recorded work; tools are one per line. Up to three visible projects can be featured on Home. Optional workflow stages use the displayed JSON example. Related experiences allow zero, one, or several connections, each independently marked sample. Personal projects need no employer association.

Credential links can be issuer verification URLs or uploaded PDF documents. Use View certificate for document evidence. Upload originals in Assets, then choose them in content fields. An image/PDF is private by default; public visibility is explicit permission to include it in a release. Original files remain private in `.local/originals/` after an approved copy is published.

1. Edit an entry and Save draft. Failed saves retain entered values; unsaved changes warn before navigation.
2. Preview draft opens a login-protected snapshot in a new tab. It does not alter the public site.
3. Publish locally creates a consistent immutable snapshot and fresh output directory. Only referenced approved uploads are copied. After a successful build the active pointer switches atomically.
4. Releases shows status and supports restoring a ready local build. Restoring does not change the current draft. Existing published copies remain available in earlier releases even if an original later becomes private or archived.

The current seeded text and project associations remain mock content where labeled. The portfolio guide answers only the active published snapshot and uses no external model or chat storage.

## Upload limits

JPEG, PNG, WebP up to 10 MB; PDF up to 20 MB. The server checks file content, not just the extension. Original names are metadata; storage names are generated. Videos use external YouTube or direct video URLs. No remote asset downloads or repository ingestion occurs automatically.

## Architecture

- Fastify serves `/admin/`, the authenticated API, private previews, and already-built public pages.
- `pg` connects from the server to the dedicated `portfolio` PostgreSQL schema. PUBLIC schema/table/function access is revoked. There is no public database API or browser database credential; authorization is enforced in Fastify.
- One owner has a salted scrypt password hash. Login creates a random opaque token, stores its SHA-256 hash with an absolute seven-day expiry in PostgreSQL, and places the token and CSRF nonce inside an encrypted HttpOnly SameSite Strict cookie. Each authenticated request checks the persisted session. Logout and owner password reset revoke sessions.
- Writes require the configured Origin and a matching CSRF token. Login is rate limited. Private originals use contained local paths and are available only through authenticated file routes.
- A single SQL statement reads entries, relationships, and assets consistently. Migrations enforce collection-safe relationship FKs, immutable IDs, and immutable release snapshots.
- Public requests read files from the active release without database queries. If the database is down, the current public build remains available. Public output contains published content and referenced approved copies.
- `.local/previews/` contains private temporary builds. Preview mappings expire when the server restarts; build a new preview then. `.local/releases/` and the active pointer persist across restarts.
- One Node server/publish process is supported. Hosting, distributed publish workers, external AI, and automatic reference extraction are separate future work.

`src/content.mjs` remains the seed fixture. `src/model.mjs` validates entries and adapts snapshots; the renderer accepts content per call. `npm run build` builds the fixture to `dist/`; use the admin Publish locally action to update the served database-backed release.

## Checks

```sh
npm test
npm run test:integration
npm run check
npm run build
```

Integration tests require `TEST_DATABASE_URL` for local PostgreSQL with permission to create temporary databases. `npm run test:integration` loads ignored `.local/test-db.env` when present. The separate test PostgreSQL container is independent of Neon; each suite creates and removes its own database and rejects hosted targets. Tests exercise real database persistence and constraints, owner hashing, session expiry/revocation, private originals, atomic import, protected previews, publication, and restore. They never use the live Neon connection. Network and filesystem checks may require a normal terminal outside the agent sandbox on Windows. Actual Neon connection, migration, import, and owner/API smoke checks are verified separately.

The Profile tech stack controls the Home logo list; blank derives tools from visible projects. The configured GitHub profile supplies a public calendar at preview/publish time. Calendar capture needs network access to github.com, is limited to eight seconds, and falls back to a profile link on failure. Counts and capture time are frozen in each release; restore retains the captured calendar. Technology SVGs are hosted locally with provenance in `public/assets/tech/`.

On this workspace, the disposable test container is named `portfolio-neon-test`. Start it with `docker start portfolio-neon-test`, run `npm run test:integration`, and stop it with `docker stop portfolio-neon-test`. Its connection is already stored in ignored `.local/test-db.env`. The application itself uses Neon and continues running while all local database containers are stopped.

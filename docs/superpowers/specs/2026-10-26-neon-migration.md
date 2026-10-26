# Neon migration contract

Approved direction: replace Supabase with Neon PostgreSQL, Fastify owner authentication, and private local originals. Preserve public design, APIs, static publishing, saved content, and releases. No public registration, external AI, or hosted site deployment.

## Architecture

- Node 22.16+, ES modules, Fastify, node-postgres (`pg`), Zod.
- `DATABASE_URL` is server-only. Neon connections verify TLS. Local PostgreSQL is supported for real integration tests; it is never presented as a verified Neon connection.
- All new tables/functions live in `portfolio`. Do not modify an existing project's public tables. Schema grants to PUBLIC are revoked. Database credentials stay on the server; there is no browser database API.
- Runtime authentication checks one owner, a scrypt password hash, and a persisted opaque session whose token is hashed in PostgreSQL. An encrypted HttpOnly/SameSite Strict cookie contains the random session token and CSRF nonce. Seven-day absolute expiry; logout revokes the database session. Password reset through the setup CLI revokes sessions.
- Existing Origin, CSRF, rate limits, upload type/size checks, private preview protection, and static public serving remain.
- Private originals live under ignored `.local/originals/`, using generated storage names and strict containment. Published copies retain the existing explicit-public/reference gate.
- A source export retains the complete draft, assets, and release records before removing Supabase dependencies. Import is transactional, requires an empty target content store, preserves release IDs/snapshots/status, and never overwrites current drafts. Existing `.local/releases/` and active pointer stay intact.
- No destructive teardown of Supabase volumes. Docker containers may be stopped after a successful replacement; data remains recoverable.

## Shared interfaces / ownership

Database worker owns `db/migrations/`, `server/repository.mjs`, and repository database tests. Root owns database client, auth, config, app wiring, file storage, and unit/HTTP tests. Setup worker owns scripts and setup/import tests. Root owns dependency changes and final documentation.

`createDatabase(config)` returns `{query(text, values?), transaction(async executor => value), close()}`. The executor supports `query`. Returned PostgreSQL rows use ISO strings for timestamps and numbers for asset size in JSON responses.

`createRepository(database, {originalsRoot})` preserves getDraft, saveEntry, archiveEntry, setRelationships, listAssets, saveAsset, updateAsset, uploadAsset, downloadAsset, listReleases, createRelease, updateRelease, getRelease. Database queries use parameter values, qualify portfolio tables, and replace links in one transaction. getDraft uses one SQL statement.

Auth tables: `portfolio.owner(singleton boolean PK CHECK(singleton), id uuid UNIQUE, email text, password_hash text, created_at timestamptz, updated_at timestamptz)`; `portfolio.sessions(token_hash text PK, owner_id uuid FK owner(id) ON DELETE CASCADE, csrf text, expires_at timestamptz, created_at timestamptz)`. No bearer token or password hash is sent to the browser.

`OwnerAuth(config, database)` exposes existing login/authenticate/logout contracts; authenticate returns `{user:{email}, csrf, session}`. App repository is created only after authentication. `createApp` can accept `database` and `repository` for real PostgreSQL integration and isolated HTTP regressions.

Setup interfaces: `scripts/migrate.mjs` applies checksummed migrations under an advisory transaction lock. `scripts/setup-owner.mjs [--generate|--preserve]` sets singleton owner; preserve consumes ignored existing owner credentials and does not invent a new password. `scripts/import-content.mjs <file>` imports exported content/releases into an empty content store. `scripts/local-setup.mjs` generates a session secret if missing, migrates, configures an absent owner from existing credentials or generates one, and imports the saved source export when target content is empty. It never replaces an existing DATABASE_URL or content.

Integration tests require `TEST_DATABASE_URL` and a local host, use a dedicated temporary schema/database fixture, and never write to the real Neon portfolio. Live Neon smoke checks run separately and only report success after actual connection/migration/import/auth checks.

## Verification

Meaningful failures first: scrypt/hash validation, expiry/revocation, private file containment, real PostgreSQL persistence/constraints/atomic relationships/releases/import, authenticated API draft isolation/preview/publish/restore. Existing frontend regression tests remain. If Neon credentials are absent, finish all independent migration work and explicitly identify hosted integration as pending.

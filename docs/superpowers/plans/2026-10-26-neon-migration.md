# Neon Migration Implementation Plan

> For agentic workers: execute the approved contract in isolated file slices and return verification evidence; shared signatures are frozen in the spec.

**Goal:** replace Supabase while preserving the portfolio and owner editing workflow.

**Architecture:** Neon PostgreSQL is accessed only by Fastify. Scrypt owner credentials and persisted opaque sessions protect admin APIs. Private local files feed authenticated previews and immutable static releases.

**Tech stack:** Node 22.16+, ES modules, Fastify, pg, PostgreSQL, Zod.

**Spec:** `docs/superpowers/specs/2026-10-26-neon-migration.md`.

## Global constraints

- Preserve the public UI and current content; no unrequested cloud deployment.
- DATABASE_URL/passwords never appear in logs, browser bundles, or commits.
- Keep all tables in portfolio; preserve original Supabase volumes and a private source export.
- Real database/auth verification only; label an absent Neon connection explicitly.

### 1. Preserve source

- [x] Export current draft/assets/releases to ignored `.local/migration/supabase-export.json`, download private originals if any, back up current environment.
- [x] Verify exported counts against live source; retain existing release folders and active pointer.

### 2. Database and repository

- [x] Write database integration cases for persistence, correct collection FKs, atomic relationship replacement, immutable identity/releases, owner/session tables, and missing-record errors. Observe pre-migration failures.
- [x] Add schema migrations, checksummed runner, pg pooling/TLS client, and transaction-backed repository using the contract signatures.
- [x] Verify on a separate real local PostgreSQL database via TEST_DATABASE_URL.

### 3. Owner authentication and originals

- [x] Write failing tests for password hashing, wrong password, expiry, database revocation, cookie tampering, and original-file traversal.
- [x] Replace Supabase auth with scrypt and persisted hashed random tokens; retain Origin/CSRF/rate limits and encrypted cookies.
- [x] Add contained private local storage, wire authenticated requests to repository, close owned pools on app shutdown.
- [x] Verify login/logout/rejection and API workflow with real PostgreSQL.

### 4. Setup/import and remove Supabase dependency

- [x] Write failing setup/import tests for empty-target import, preservation, retry, and owner credential reuse.
- [x] Add setup/migrate/import/seed/owner commands and environment examples; preserve existing content and session secret.
- [x] Install pg; remove Supabase runtime/CLI after source export is verified. Retain historical migrations as migration reference only.

### 5. Connect and finish

- [x] When supplied, validate a server-only Neon DATABASE_URL, apply portfolio schema, reuse owner credentials, import backed-up records/assets, and verify actual Neon admin/session/persistence.
- [x] Run all relevant tests, syntax/build checks, and desktop/mobile dashboard smoke checks.
- [x] Update setup/API/product/design/reference documents and final evidence. Keep current public release available throughout. Report any missing connection or unverified check plainly.

Verification evidence is in outputs/neon/: 45 unit/regression tests and 11 real local PostgreSQL integration tests passed, zero skips; 38 modules checked; 11 pages built. Actual Neon TLS connection, migration/import, unchanged owner credentials, and preserved source data/release metadata were independently verified. Browser login, protected preview, publication and responsive admin checks use the migrated running server.

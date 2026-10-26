# Owner API

Base: /api/admin/. All responses are JSON except asset files and preview/static routes. Errors use `{error:{message,fields?}}`. Validation uses 422, missing/expired owner login 401, nonowner/Origin/CSRF failures 403, publish conflict 409, upload limits 413, login throttling 429, unavailable local services 503. Every write except login sends X-CSRF-Token from session/bootstrap and the configured Origin. Authentication uses an encrypted HttpOnly SameSite Strict cookie. Login/session JSON returns only user email and a CSRF nonce; passwords, password hashes, session token hashes, and database credentials remain server-only.

| Method | Endpoint | Input / output |
|---|---|---|
| POST | login | email,password -> user,csrf |
| GET | session | user,csrf |
| POST | logout | revokes the persisted session and clears its cookie |
| GET | bootstrap | entries,relationships,assets,releases,user,csrf,activeReleaseId |
| PUT | content/:collection/:id | full Entry -> entry; path and body identity must agree |
| POST | content/:collection/:id/archive | archived:boolean -> entry |
| PUT | relationships | complete relationships array -> relationships; replaced transactionally |
| POST | assets | multipart file plus optional visibility -> asset |
| PATCH | assets/:id | visibility and/or archived -> asset |
| GET | assets/:id/file | protected original; PDFs download as attachments |
| POST | preview | url for authenticated immutable preview |
| POST | publish | 202 release; poll releases until build completes |
| GET | releases | releases,activeReleaseId |
| POST | releases/:id/activate | activeReleaseId; draft unchanged |
| GET | export | owner-only draft JSON with schemaVersion:1 |

GET /api/health reports process availability and whether admin configuration is present; it does not probe database connectivity. GET /admin/preview/:id/* requires owner login, no-store and noindex. Admin assets and login shell are public code; draft data and originals are authenticated.

Entry: collection,id,data,position,visible,sample,archived,updated_at. Collections: profile,projects,experiences,credentials,community,gallery. IDs are lowercase kebab strings, up to 80 characters; profile uses id profile. Data fields are described in REFERENCE-CHECKLIST.md and validated centrally in src/model.mjs. Asset field references use asset:<uuid> or an existing /assets/ path. Relationships: project_id,experience_id,sample.

Assets contain generated storage_path, original_name, mime_type, size, visibility, archived. Releases contain id,state(building/ready/failed), immutable snapshot, error, created_at,published_at. The active local release is identified separately by the persisted filesystem pointer.

Fastify authenticates one owner against a scrypt password hash. Login persists only the SHA-256 hash of a random opaque session token, with a seven-day absolute expiry. Every authenticated request checks that database session; logout and CLI owner reset revoke it. The encrypted cookie carries the token and CSRF nonce.

The server uses `pg` and server-only `DATABASE_URL` to access Neon PostgreSQL in the dedicated `portfolio` schema, whose PUBLIC grants are revoked. Private originals stay in ignored `.local/originals/` and the file endpoint requires owner authentication. Public routes serve static releases without database queries; publication copies only referenced assets explicitly approved for public use. No public database API, write endpoint, signup route, client database SDK, or external AI endpoint is provided.

The API export contains the current draft and asset metadata; it does not include original file bytes or release history. CLI migration imports use the complete schemaVersion 1 migration export, including its `releases` array and sibling `originals/` directory when assets exist.

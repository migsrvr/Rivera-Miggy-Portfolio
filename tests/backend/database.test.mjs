import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const url = process.env.TEST_DATABASE_URL;

// Create/drop a random isolated database, never the supplied target's tables.
test('real PostgreSQL preserves the portfolio repository contract', {
  skip: !url && 'Set TEST_DATABASE_URL to local PostgreSQL with CREATEDB.',
}, async (t) => {
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname), 'Database tests only run locally.');
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  const name = `portfolio_repo_${randomUUID().replaceAll('-', '')}`;
  const fixtureUrl = new URL(url);
  fixtureUrl.pathname = `/${name}`;
  await admin.query(`CREATE DATABASE "${name}"`);
  const originalsRoot = await mkdtemp(join(tmpdir(), 'portfolio-originals-'));
  let database;
  t.after(async () => {
    try {
      await database?.close();
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    } finally {
      await admin.end();
      await rm(originalsRoot, { recursive: true, force: true });
    }
  });
  const { createDatabase } = await import('../../server/database.mjs');
  const { createRepository } = await import('../../server/repository.mjs');
  database = createDatabase({ databaseUrl: fixtureUrl.href });
  const repository = createRepository(database, { originalsRoot });
  const { migrate } = await import('../../scripts/migrate.mjs');
  await migrate(database);

  await t.test('entries persist across connections with defaults, ISO times, and immutable identity', async () => {
    const entry = await repository.saveEntry('projects', { id: 'project-one', data: { title: 'Persisted project' }, position: 2 });
    assert.equal(entry.visible, true);
    assert.equal(entry.sample, false);
    assert.equal(typeof entry.updated_at, 'string');
    assert.equal(new Date(entry.updated_at).toISOString(), entry.updated_at);
    await repository.saveEntry('experiences', { id: 'experience-one', data: { role: 'Designer' }, position: 1 });
    await repository.archiveEntry('projects', 'project-one', true);
    const fresh = createDatabase({ databaseUrl: fixtureUrl.href });
    try {
      const draft = await createRepository(fresh, { originalsRoot }).getDraft();
      assert.equal(draft.entries.find((item) => item.id === 'project-one').data.title, 'Persisted project');
      assert.equal(draft.entries.find((item) => item.id === 'project-one').archived, true);
      assert.deepEqual(draft.entries.map((item) => item.id), ['experience-one', 'project-one']);
    } finally { await fresh.close(); }
    await assert.rejects(database.query("UPDATE portfolio.content_entries SET id = 'renamed' WHERE collection = 'projects' AND id = 'project-one'"), /immutable/i);
    await assert.rejects(database.query("UPDATE portfolio.content_entries SET collection = 'gallery' WHERE collection = 'projects' AND id = 'project-one'"), /immutable/i);
    await assert.rejects(repository.archiveEntry('projects', 'missing', true), { status: 404 });
  });

  await t.test('relationship replacement is atomic with collection-specific foreign keys', async () => {
    const link = { project_id: 'project-one', experience_id: 'experience-one', sample: true };
    assert.deepEqual(await repository.setRelationships([link]), [link]);
    await assert.rejects(repository.setRelationships([link, { project_id: 'experience-one', experience_id: 'project-one' }]), /foreign key|constraint/i);
    assert.deepEqual((await repository.getDraft()).relationships, [link]);
    await assert.rejects(repository.setRelationships([link, link]), /duplicate|unique/i);
    assert.deepEqual((await repository.getDraft()).relationships, [link]);
    assert.deepEqual(await repository.setRelationships([]), []);
  });

  await t.test('originals and metadata round trip privately with numeric size and defaults', async () => {
    const bytes = Buffer.from('private original payload');
    await repository.uploadAsset('test/original.png', bytes, 'image/png');
    assert.deepEqual(await repository.downloadAsset('test/original.png'), bytes);
    const asset = await repository.saveAsset({ storage_path: 'test/original.png', original_name: 'original.png', mime_type: 'image/png', size: bytes.length });
    assert.equal(asset.size, 24);
    assert.equal(asset.visibility, 'private');
    assert.equal(typeof asset.created_at, 'string');
    assert.equal((await repository.updateAsset(asset.id, { visibility: 'public' })).visibility, 'public');
    assert.equal((await repository.listAssets())[0].size, 24);
    assert.equal((await repository.getDraft()).assets[0].size, 24);
    assert.equal((await repository.updateAsset(asset.id, {})).visibility, 'public');
    await assert.rejects(repository.updateAsset(randomUUID(), { archived: true }), { status: 404 });
    await assert.rejects(repository.saveAsset({ storage_path: '../outside.png', original_name: 'bad.png', mime_type: 'image/png', size: 1 }), /constraint/i);
    await assert.rejects(repository.saveAsset({ storage_path: 'test/large.png', original_name: 'large.png', mime_type: 'image/png', size: 10485761 }), /constraint/i);
  });

  await t.test('release identity/snapshots stay immutable and terminal states cannot restart', async () => {
    const snapshot = { entries: [{ id: 'preserved' }], relationships: [], assets: [] };
    const release = await repository.createRelease(snapshot);
    assert.equal(release.state, 'building');
    assert.deepEqual(release.snapshot, snapshot);
    assert.equal(typeof release.created_at, 'string');
    await assert.rejects(database.query('UPDATE portfolio.releases SET snapshot = $1 WHERE id = $2', [{ changed: true }, release.id]), /immutable/i);
    await assert.rejects(database.query('UPDATE portfolio.releases SET id = $1 WHERE id = $2', [randomUUID(), release.id]), /immutable/i);
    await assert.rejects(database.query("UPDATE portfolio.releases SET created_at = created_at + interval '1 second' WHERE id = $1", [release.id]), /immutable/i);
    const ready = await repository.updateRelease(release.id, { state: 'ready', published_at: '2026-10-26T00:00:00.000Z' });
    assert.equal(ready.published_at, '2026-10-26T00:00:00.000Z');
    await assert.rejects(repository.updateRelease(release.id, { state: 'building' }), /cannot change state/i);
    assert.deepEqual((await repository.getRelease(release.id)).snapshot, snapshot);
    assert.equal((await repository.listReleases())[0].id, release.id);
    const failed = await repository.createRelease({});
    await repository.updateRelease(failed.id, { state: 'failed', error: 'Build failed' });
    await assert.rejects(repository.updateRelease(failed.id, { state: 'ready' }), /cannot change state/i);
    await assert.rejects(repository.getRelease(randomUUID()), { status: 404 });
    await assert.rejects(repository.updateRelease(randomUUID(), {}), { status: 404 });
  });

  await t.test('owner is singleton and sessions enforce ownership and cascade deletion', async () => {
    const id = randomUUID();
    await database.query('INSERT INTO portfolio.owner (id,email,password_hash) VALUES ($1,$2,$3)', [id, 'owner@example.test', 'opaque-password-hash']);
    await assert.rejects(database.query('INSERT INTO portfolio.owner (id,email,password_hash) VALUES ($1,$2,$3)', [randomUUID(), 'other@example.test', 'hash']), /duplicate|unique/i);
    await assert.rejects(database.query('INSERT INTO portfolio.sessions (token_hash,owner_id,csrf,expires_at) VALUES ($1,$2,$3,now())', ['unknown-owner', randomUUID(), 'nonce']), /foreign key/i);
    await database.query("INSERT INTO portfolio.sessions (token_hash,owner_id,csrf,expires_at) VALUES ($1,$2,$3,now() + interval '7 days')", ['opaque-token-hash', id, 'nonce']);
    await database.query('DELETE FROM portfolio.owner WHERE id = $1', [id]);
    assert.equal((await database.query('SELECT count(*)::int AS count FROM portfolio.sessions')).rows[0].count, 0);
  });

  await t.test('PUBLIC has no schema, table, or trigger-function grants', async () => {
    const schema = await database.query("SELECT a.privilege_type FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a WHERE n.nspname='portfolio' AND a.grantee=0");
    assert.deepEqual(schema.rows, []);
    const tables = await database.query("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a WHERE n.nspname='portfolio' AND c.relkind='r' AND a.grantee=0");
    assert.deepEqual(tables.rows, []);
    const functions = await database.query("SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE n.nspname='portfolio' AND a.grantee=0");
    assert.deepEqual(functions.rows, []);
  });
});


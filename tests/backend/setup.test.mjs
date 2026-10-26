import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

// These cases catch setup overwriting secrets, resetting existing owners, losing
// release state, accepting populated imports, and partially committing bad input.
test('setup preserves existing environment values and requires a database URL', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-setup-'));
  t.after(() => rm(root, {recursive:true, force:true}));
  const module = await import('../../scripts/local-setup.mjs').catch(() => ({}));
  assert.equal(typeof module.prepareEnvironment, 'function', 'Setup must expose import-safe environment preparation');
  await writeFile(path.join(root,'.env.local'), 'DATABASE_URL=postgresql://localhost/existing\nSESSION_SECRET=existing-private-session-secret-that-must-survive\nPORT=4321\n');
  const prepared = await module.prepareEnvironment(root, {});
  assert.equal(prepared.databaseUrl, 'postgresql://localhost/existing');
  assert.equal(prepared.secret, 'existing-private-session-secret-that-must-survive');
  assert.match(await readFile(path.join(root,'.env.local'),'utf8'), /PORT=4321/);
  const emptyRoot = await mkdtemp(path.join(tmpdir(), 'portfolio-missing-db-'));
  t.after(() => rm(emptyRoot, {recursive:true, force:true}));
  await assert.rejects(module.prepareEnvironment(emptyRoot, {}), /DATABASE_URL/);
  await module.prepareEnvironment(emptyRoot, {DATABASE_URL:'postgresql://localhost/new'});
  const initial = await readFile(path.join(emptyRoot,'.env.local'),'utf8');
  await module.prepareEnvironment(emptyRoot, {DATABASE_URL:'postgresql://localhost/new'});
  assert.equal(await readFile(path.join(emptyRoot,'.env.local'),'utf8'), initial);
  const dotenvRoot = await mkdtemp(path.join(tmpdir(), 'portfolio-dotenv-'));
  t.after(() => rm(dotenvRoot,{recursive:true,force:true}));
  const dotenv = 'DATABASE_URL="postgresql://localhost/from-dotenv"\nSESSION_SECRET="dotenv-secret-that-must-not-be-overwritten"\n';
  await writeFile(path.join(dotenvRoot,'.env'),dotenv);
  const config = await module.prepareEnvironment(dotenvRoot,{});
  assert.equal(config.databaseUrl,'postgresql://localhost/from-dotenv');
  assert.equal(config.secret,'dotenv-secret-that-must-not-be-overwritten');
  assert.equal(await readFile(path.join(dotenvRoot,'.env'),'utf8'),dotenv);
});

test('setup and import preserve real PostgreSQL content and owner credentials', {
  skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to a local PostgreSQL admin database.',
}, async t => {
  const adminUrl = new URL(process.env.TEST_DATABASE_URL);
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(adminUrl.hostname), 'Setup integration only runs against local PostgreSQL.');
  const {default:pg} = await import('pg');
  const admin = new pg.Client({connectionString:adminUrl.href});
  await admin.connect();
  const databaseName = `portfolio_setup_${randomUUID().replaceAll('-','')}`;
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  const url = new URL(adminUrl); url.pathname = `/${databaseName}`;
  const {createDatabase} = await import('../../server/database.mjs');
  const database = createDatabase({databaseUrl:url.href});
  const root = await mkdtemp(path.join(tmpdir(),'portfolio-import-'));
  t.after(async () => {
    await database.close();
    await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await admin.end();
    await rm(root,{recursive:true,force:true});
  });
  const {migrate} = await import('../../scripts/migrate.mjs');
  const {importContent} = await import('../../scripts/import-content.mjs');
  const {setupOwner} = await import('../../scripts/setup-owner.mjs');
  const {localSetup} = await import('../../scripts/local-setup.mjs');
  const {verifyPassword} = await import('../../server/auth.mjs');
  await migrate(database);
  await migrate(database);
  const migrationRoot=path.join(root,'migrations');
  await mkdir(migrationRoot);
  const {readdir}=await import('node:fs/promises');
  for(const name of await readdir(new URL('../../db/migrations/',import.meta.url)))await writeFile(path.join(migrationRoot,name),await readFile(new URL(`../../db/migrations/${name}`,import.meta.url)));
  const migrationName=(await readdir(migrationRoot))[0];
  await writeFile(path.join(migrationRoot,migrationName),'select 1;');
  await assert.rejects(migrate(database,{migrationsRoot:migrationRoot}),/checksum/i);
  await mkdir(path.join(root,'.local'),{recursive:true});
  const credentials = {email:'existing@example.test',password:'existing-password-12345'};
  await writeFile(path.join(root,'.local','owner-credentials.json'),JSON.stringify(credentials));
  await setupOwner(database,{root,mode:'preserve'});
  let owner = (await database.query('select * from portfolio.owner')).rows[0];
  assert.equal(owner.email,credentials.email);
  assert.equal(await verifyPassword(credentials.password,owner.password_hash),true);
  await database.query("insert into portfolio.sessions(token_hash,owner_id,csrf,expires_at) values ($1,$2,'nonce',now()+interval '1 day')",['a'.repeat(64),owner.id]);
  await setupOwner(database,{root,mode:'preserve'});
  assert.equal((await database.query('select * from portfolio.sessions')).rows.length,0);
  assert.equal((await database.query('select id from portfolio.owner')).rows[0].id,owner.id);
  await assert.rejects(setupOwner(database,{root,mode:'generate'}),/already exists/i);
  const fixture = {
    schemaVersion:1,
    entries:[{collection:'profile',id:'profile',data:{name:'Preserved owner'},position:0,visible:true,sample:false,archived:false,updated_at:'2026-01-01T00:00:00.000Z'}],
    relationships:[], assets:[],
    releases:[{id:'00a71851-7f9b-4f9a-ac30-c150f3668554',state:'ready',snapshot:{entries:[],relationships:[],assets:[],sentinel:'immutable'},error:null,created_at:'2026-01-01T00:00:00.000Z',published_at:'2026-01-02T00:00:00.000Z'}],
  };
  const file = path.join(root,'export.json');
  await writeFile(file,JSON.stringify(fixture));
  await importContent(database,file,{originalsRoot:path.join(root,'.local','originals')});
  assert.deepEqual((await database.query('select snapshot from portfolio.releases')).rows[0].snapshot,fixture.releases[0].snapshot);
  assert.equal((await database.query('select state from portfolio.releases')).rows[0].state,'ready');
  await assert.rejects(importContent(database,file), /empty|existing|populated/i);
  await writeFile(path.join(root,'.env.local'),`DATABASE_URL=${url.href}\nSESSION_SECRET=${'s'.repeat(48)}\n`);
  await localSetup({root,database,env:{}});
  owner = (await database.query('select * from portfolio.owner')).rows[0];
  assert.equal(await verifyPassword(credentials.password,owner.password_hash),true);
  assert.deepEqual(JSON.parse(await readFile(path.join(root,'.local','owner-credentials.json'),'utf8')),credentials);
  assert.equal((await database.query('select count(*)::int as total from portfolio.content_entries')).rows[0].total,1);
  const {seedContent}=await import('../../scripts/seed-content.mjs');
  assert.equal((await seedContent(database)).seeded,false);
  await database.query('truncate portfolio.releases,portfolio.assets,portfolio.project_experiences,portfolio.content_entries');
  const invalid = structuredClone(fixture);
  invalid.releases.push({...fixture.releases[0],id:'this-is-not-a-uuid'});
  await writeFile(file,JSON.stringify(invalid));
  await assert.rejects(importContent(database,file));
  assert.equal((await database.query('select count(*)::int as total from portfolio.content_entries')).rows[0].total,0);
  assert.equal((await database.query('select count(*)::int as total from portfolio.releases')).rows[0].total,0);
  const original=Buffer.from('%PDF-1.7\nprivate original\n%%EOF');
  const asset={id:'7e6d7d17-1c99-4e11-b89a-61d280f547a3',storage_path:'import/original.pdf',original_name:'document.pdf',mime_type:'application/pdf',size:original.length,visibility:'private',archived:false,created_at:'2026-01-01T00:00:00.000Z'};
  fixture.assets=[asset];
  await mkdir(path.join(root,'originals','import'),{recursive:true});
  await writeFile(path.join(root,'originals','import','original.pdf'),original);
  await writeFile(file,JSON.stringify(fixture));
  await importContent(database,file,{originalsRoot:path.join(root,'.local','originals')});
  assert.deepEqual(await readFile(path.join(root,'.local','originals','import','original.pdf')),original);
  assert.equal((await database.query('select visibility from portfolio.assets')).rows[0].visibility,'private');
});

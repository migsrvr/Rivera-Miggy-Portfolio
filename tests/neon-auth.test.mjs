import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';

test('owner passwords use salted scrypt hashes and malformed hashes never authenticate',async()=>{
  const {hashPassword,verifyPassword}=await import('../server/auth.mjs');
  const password='A sufficiently long owner password';
  const first=await hashPassword(password),second=await hashPassword(password);
  assert.notEqual(first,second);assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password,first),true);
  assert.equal(await verifyPassword('wrong password',first),false);
  for(const invalid of ['','plain-text','scrypt$bad$bad','scrypt$999999999$bad$bad'])assert.equal(await verifyPassword(password,invalid),false);
  await assert.rejects(()=>hashPassword('short'),/12/);
});

test('private originals persist, reject overwrite and traversal, and are outside public builds',async()=>{
  const {LocalOriginals}=await import('../server/storage.mjs');
  const folder=await mkdtemp(path.join(os.tmpdir(),'portfolio-originals-')),store=new LocalOriginals(path.join(folder,'private'));
  await store.put('originals/test.png',Buffer.from('private bytes'));
  assert.equal((await store.get('originals/test.png')).toString(),'private bytes');
  await assert.rejects(()=>store.put('originals/test.png',Buffer.from('overwrite')));
  for(const unsafe of ['../secret','/absolute.png','C:/secret.png','safe/../../file.png','safe\\file.png','safe//file.png']){
    await assert.rejects(()=>store.get(unsafe));await assert.rejects(()=>store.put(unsafe,Buffer.from('bad')));
  }
  await mkdir(path.join(folder,'outside'));await symlink(path.join(folder,'outside'),path.join(folder,'private','linked'),'junction');
  await assert.rejects(()=>store.put('linked/escaped.png',Buffer.from('bad')));
});

test('database config enforces verified TLS for Neon and permits isolated local integration connections',async()=>{
  const {connectionOptions}=await import('../server/database.mjs');
  const neon=connectionOptions('postgresql://owner:secret@ep-example-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
  assert.equal(neon.ssl.rejectUnauthorized,true);assert.ok(!neon.connectionString.includes('sslmode='));
  assert.equal(connectionOptions('postgresql://test:password@127.0.0.1:55432/portfolio_test').ssl,false);
  assert.throws(()=>connectionOptions('https://example.com'),/PostgreSQL/);
});

test('pg cannot override the verified TLS policy or URL hostname through query parameters',async()=>{
  const {connectionOptions}=await import('../server/database.mjs');
  for(const query of ['ssl=0','ssl=no-verify','host=localhost&ssl=0','sslmode=disable']){
    const client=new pg.Client(connectionOptions('postgresql://owner:secret@example.com/db?'+query));
    assert.equal(client.connectionParameters.host,'example.com');assert.equal(client.connectionParameters.ssl.rejectUnauthorized,true);
  }
  const local=new pg.Client(connectionOptions('postgresql://owner:secret@localhost/db?host=example.com'));
  assert.equal(local.connectionParameters.host,'localhost');assert.equal(local.connectionParameters.ssl,false);
});

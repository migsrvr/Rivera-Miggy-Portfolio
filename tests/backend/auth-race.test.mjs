import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDatabase} from '../../server/database.mjs';
import {OwnerAuth,hashPassword} from '../../server/auth.mjs';
import {migrate} from '../../scripts/migrate.mjs';

test('an old-password login paused during owner reset cannot create a fresh session', {skip:!process.env.TEST_DATABASE_URL&&'Set local TEST_DATABASE_URL.'},async()=>{
  const url=new URL(process.env.TEST_DATABASE_URL);assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
  const control=createDatabase({databaseUrl:url.href}),name='portfolio_auth_'+randomUUID().replaceAll('-','');
  await control.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;const db=createDatabase({databaseUrl:url.href});
  let releaseRead;const resumed=new Promise(r=>releaseRead=r);let ownerRead;const read=new Promise(r=>ownerRead=r);let pending;
  try{
    await migrate(db);const id=randomUUID(),password='initial-long-owner-password';
    await db.query('INSERT INTO portfolio.owner(singleton,id,email,password_hash) VALUES(true,$1,$2,$3)',[id,'owner@example.test',await hashPassword(password)]);
    const paused={...db,query:async(sql,values)=>{const result=await db.query(sql,values);if(sql.startsWith('SELECT id,email,password_hash')){ownerRead();await resumed;}return result;}};
    const auth=new OwnerAuth({configured:true,secret:'test-secret-'.repeat(5),secure:false},paused);let cookieIssued=false;
    pending=auth.login('owner@example.test',password,{setCookie(){cookieIssued=true;}});
    // Attach the rejection handler before releasing the paused request.
    const rejected=assert.rejects(pending,error=>error.statusCode===401||error.status===401);
    await read;
    await db.transaction(async tx=>{await tx.query('SELECT id FROM portfolio.owner WHERE singleton=true FOR UPDATE');await tx.query('UPDATE portfolio.owner SET password_hash=$1 WHERE singleton=true',[await hashPassword('replacement-long-owner-password')]);await tx.query('DELETE FROM portfolio.sessions');});
    releaseRead();await rejected;
    assert.equal(cookieIssued,false);assert.equal((await db.query('SELECT count(*)::int AS count FROM portfolio.sessions')).rows[0].count,0);
  }finally{releaseRead();await pending?.catch(()=>{});await db.close();await control.query(`DROP DATABASE ${name} WITH (FORCE)`);await control.close();}
});

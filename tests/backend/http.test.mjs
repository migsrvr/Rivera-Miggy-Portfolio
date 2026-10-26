import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

test('unconfigured backend serves the portfolio and admin shell but never pretends to authenticate',async()=>{
  const {createApp}=await import('../../server/app.mjs');
  const app=await createApp({config:{root:path.resolve('.'),origin:'http://127.0.0.1:4173',configured:false,secure:false}});
  try{
    assert.equal((await app.inject('/')).statusCode,200);
    assert.equal((await app.inject('/admin/')).statusCode,200);
    const session=await app.inject('/api/admin/session');assert.equal(session.statusCode,503);assert.match(session.json().error.message,/configured/);
    assert.equal((await app.inject({method:'POST',url:'/api/admin/login',headers:{origin:'https://other.test'},payload:{email:'x',password:'x'}})).statusCode,403);
    assert.equal((await app.inject('/admin/preview/123/')).statusCode,503);
    assert.equal((await app.inject('/.env.local')).statusCode,404);
  }finally{await app.close();}
});
test('unarchiving a fourth featured project is rejected before persistence',async()=>{
  const {createApp}=await import('../../server/app.mjs');const {createSeedDraft}=await import('../../src/model.mjs');
  const draft=createSeedDraft();const extra=draft.entries.find(e=>e.collection==='projects'&&!e.data.featured);extra.data.featured=true;extra.archived=true;let mutated=false;
  const config={root:path.resolve('.'),origin:'http://127.0.0.1:4173',configured:false,secure:false};
  const app=await createApp({config,auth:{authenticate:async()=>({client:{},user:{email:'test@portfolio.local'},csrf:'csrf'})},repository:()=>({getDraft:async()=>structuredClone(draft),archiveEntry:async()=>{mutated=true;return extra;}})});
  try{const result=await app.inject({method:'POST',url:`/api/admin/content/projects/${extra.id}/archive`,headers:{origin:config.origin,'x-csrf-token':'csrf'},payload:{archived:false}});assert.equal(result.statusCode,422);assert.equal(mutated,false);}finally{await app.close();}
});

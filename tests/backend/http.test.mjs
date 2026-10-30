import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';

test('retired Gallery URLs return 404 in fallback builds, older releases, and authenticated previews',async()=>{
  const {createApp}=await import('../../server/app.mjs');
  const {Publisher}=await import('../../server/publisher.mjs');
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-gallery-http-'));
  const releaseId=crypto.randomUUID();let app;
  try{
    for(const relative of ['dist',`.local/releases/${releaseId}`,'.local/previews/old-preview']){
      const folder=path.join(root,relative);
      await mkdir(path.join(folder,'gallery/photo'),{recursive:true});
      await mkdir(path.join(folder,'hackathons'),{recursive:true});
      await writeFile(path.join(folder,'index.html'),'HOME');
      await writeFile(path.join(folder,'gallery/index.html'),'OLD GALLERY');
      await writeFile(path.join(folder,'gallery/photo/index.html'),'OLD GALLERY PHOTO');
      await writeFile(path.join(folder,'hackathons/index.html'),'HACKATHONS');
      await writeFile(path.join(folder,'404.html'),'Page not found.');
    }
    const publisher=new Publisher({root});
    app=await createApp({config:{root,origin:'http://127.0.0.1:4173',configured:false,secure:false},publisher,
      auth:{authenticate:async()=>({user:{email:'test@portfolio.local'},csrf:'csrf'})},repository:()=>({})});
    publisher.previews.set('old-preview',path.join(root,'.local/previews/old-preview'));
    async function check(prefix){
      assert.equal((await app.inject(prefix+'hackathons/')).body,'HACKATHONS');
      for(const suffix of ['gallery','gallery/','gallery/?from=old','gallery/index.html','gallery/photo/','gallery/photo/index.html','%67allery/','gallery%2Findex.html','Gallery/','gallery//photo/']){
        for(const method of ['GET','HEAD']){
          const response=await app.inject({method,url:prefix+suffix});
          assert.equal(response.statusCode,404,method+' '+prefix+suffix);
          assert.ok(!response.body.includes('OLD GALLERY'));
          if(method==='GET')assert.equal(response.body,'Page not found.');
        }
      }
    }
    await check('/');
    await publisher.switchTo(releaseId);
    await check('/');
    await check('/admin/preview/old-preview/');
  }finally{await app?.close();await rm(root,{recursive:true,force:true});}
});

test('retired experience URLs return 404 even in older active releases and authenticated previews',async()=>{
  const {createApp}=await import('../../server/app.mjs');
  const {Publisher}=await import('../../server/publisher.mjs');
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-retired-http-'));
  const releaseId=crypto.randomUUID();let app;
  try{
    for(const folder of [`releases/${releaseId}`,'previews/old-preview']){
      const target=path.join(root,'.local',folder);
      await mkdir(path.join(target,'experience/freelance'),{recursive:true});
      await writeFile(path.join(target,'index.html'),'HOME');
      await writeFile(path.join(target,'experience/freelance/index.html'),'OLD DETAIL');
      await writeFile(path.join(target,'experience/index.html'),'EXPERIENCE LIST');
      await writeFile(path.join(target,'404.html'),'Page not found.');
    }
    await writeFile(path.join(root,'.local/active-release.json'),JSON.stringify({id:releaseId}));
    const publisher=new Publisher({root});
    app=await createApp({config:{root,origin:'http://127.0.0.1:4173',configured:false,secure:false},publisher,
      auth:{authenticate:async()=>({user:{email:'test@portfolio.local'},csrf:'csrf'})},repository:()=>({})});
    publisher.previews.set('old-preview',path.join(root,'.local/previews/old-preview'));
    for(const prefix of ['/','/admin/preview/old-preview/']){
      assert.equal((await app.inject(prefix+'experience/')).body,'EXPERIENCE LIST');
      for(const suffix of ['experience/freelance/','experience/freelance','experience/freelance/index.html','experience/%66reelance/','experience%2Ffreelance%2F','Experience/Freelance/']){
        for(const method of ['GET','HEAD']){
          const response=await app.inject({method,url:prefix+suffix});
          assert.equal(response.statusCode,404,method+' '+prefix+suffix);
          assert.ok(!response.body.includes('OLD DETAIL'));
        }
      }
    }
  }finally{await app?.close();await rm(root,{recursive:true,force:true});}
});

test('JFIF logos are served as JPEG images in public pages and private previews',async()=>{
  const {createApp}=await import('../../server/app.mjs');
  const {Publisher}=await import('../../server/publisher.mjs');
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-logo-mime-'));
  const bytes=Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10]);
  let app;
  try{
    for(const folder of ['dist/assets','.local/previews/logo-test/assets']){
      await mkdir(path.join(root,folder),{recursive:true});await writeFile(path.join(root,folder,'logo.jfif'),bytes);
    }
    const publisher=new Publisher({root});
    app=await createApp({config:{root,origin:'http://127.0.0.1:4173',configured:false,secure:false},publisher,
      auth:{authenticate:async()=>({user:{email:'test@portfolio.local'},csrf:'csrf'})},repository:()=>({})});
    publisher.previews.set('logo-test',path.join(root,'.local/previews/logo-test'));
    for(const url of ['/assets/logo.jfif','/admin/preview/logo-test/assets/logo.jfif']){
      const response=await app.inject(url);assert.equal(response.statusCode,200);
      assert.match(response.headers['content-type'],/^image\/jpeg\b/);assert.deepEqual(response.rawPayload,bytes);
    }
  }finally{await app?.close();await rm(root,{recursive:true,force:true});}
});

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

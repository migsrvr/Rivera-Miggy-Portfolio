import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('encrypted sessions reject tampering and never expose tokens',async()=>{
  const {SessionCodec}=await import('../../server/auth.mjs');
  const codec=new SessionCodec('a'.repeat(64)),session={access_token:'secret-access',refresh_token:'secret-refresh',csrf:'csrf'};
  const cookie=codec.encode(session);assert.ok(!cookie.includes('secret'));
  assert.deepEqual(codec.decode(cookie),session);
  assert.equal(codec.decode(cookie.slice(0,-5)+'xxxxx'),null);
  assert.equal(new SessionCodec('b'.repeat(64)).decode(cookie),null);
});

test('uploads inspect real file content and enforce type/size rules',async()=>{
  const {inspectUpload}=await import('../../server/uploads.mjs');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  assert.equal((await inspectUpload(png,'photo.png')).mime_type,'image/png');
  await assert.rejects(()=>inspectUpload(Buffer.from('<script>bad</script>'),'photo.png'),/JPEG|PNG|WebP|PDF/);
  await assert.rejects(()=>inspectUpload(Buffer.alloc(21*1024*1024),'large.pdf'),/20 MB/);
});

test('publishing freezes snapshots, preserves the last good release, and restores without changing drafts',async()=>{
  const {Publisher}=await import('../../server/publisher.mjs');
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-publish-'));
  await mkdir(path.join(root,'dist'));await writeFile(path.join(root,'dist','index.html'),'baseline');
  let draft={entries:[{collection:'profile',id:'profile',data:{name:'First'}}],relationships:[],assets:[]};
  let fail=false,hold=null;const releases=[];
  const repo={getDraft:async()=>structuredClone(draft),createRelease:async(snapshot)=>{const r={id:crypto.randomUUID(),state:'building',snapshot};releases.push(r);return r;},updateRelease:async(id,patch)=>Object.assign(releases.find(r=>r.id===id),patch),getRelease:async id=>releases.find(r=>r.id===id)};
  const publisher=new Publisher({root,validate:()=>{},convert:d=>d,build:async({content,outputDir})=>{if(hold)await hold;if(fail)throw Error('intentional build failure');await mkdir(outputDir,{recursive:true});await writeFile(path.join(outputDir,'index.html'),content.entries[0].data.name);}});
  await publisher.init();const first=await publisher.publish(repo);draft.entries[0].data.name='Unpublished';await publisher.waitForIdle();
  assert.equal(await readFile(path.join(publisher.activeRoot(),'index.html'),'utf8'),'First',publisher.lastError?.stack);
  assert.equal(first.snapshot.entries[0].data.name,'First');
  fail=true;await publisher.publish(repo);await publisher.waitForIdle();assert.equal(publisher.activeId(),first.id);assert.equal(releases.at(-1).state,'failed');
  fail=false;let releaseHold;hold=new Promise(r=>releaseHold=r);await publisher.publish(repo);await assert.rejects(()=>publisher.publish(repo),/already/);releaseHold();await publisher.waitForIdle();
  await publisher.activate(repo,first.id);assert.equal(publisher.activeId(),first.id);assert.equal(draft.entries[0].data.name,'Unpublished');
});

test('private referenced uploads block publication but are allowed in owner previews',async()=>{
  const {resolveAssets}=await import('../../server/publisher.mjs');
  const id=crypto.randomUUID(),draft={entries:[{collection:'gallery',id:'photo',data:{image:'asset:'+id}}],relationships:[],assets:[{id,storage_path:'x',mime_type:'image/png',size:5,visibility:'private',archived:false}]};
  const repo={downloadAsset:async()=>Buffer.from('image')};
  await assert.rejects(()=>resolveAssets(draft,repo,false),/public/);
  const resolved=await resolveAssets(draft,repo,true);assert.match(resolved.draft.entries[0].data.image,/^\/assets\/uploads\//);assert.equal(resolved.assetFiles.length,1);assert.match(draft.entries[0].data.image,/^asset:/);
});

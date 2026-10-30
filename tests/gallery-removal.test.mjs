import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createSeedDraft,toContent,getRoutes,validateDraft} from '../src/model.mjs';
import {routes} from '../src/content.mjs';
import {renderPage} from '../src/render.mjs';
import {answerQuestion} from '../src/assistant.mjs';
import {resolveAssets} from '../server/publisher.mjs';
import {build} from '../scripts/build.mjs';

const publicPaths=['/','/projects/','/experience/','/credentials/','/hackathons/','/leadership/','/organizations/'];

test('Gallery records remain valid admin data while public content retains the seven reading pages',()=>{
  const draft=createSeedDraft(),gallery=draft.entries.find(e=>e.collection==='gallery');
  gallery.data={title:'Private gallery title',caption:'Private gallery caption',image:'asset:'+crypto.randomUUID()};
  const before=structuredClone(draft);
  assert.doesNotThrow(()=>validateDraft(draft));
  const content=toContent(draft);
  assert.deepEqual(draft,before);
  assert.deepEqual(routes.map(r=>r.path),publicPaths);
  assert.deepEqual(getRoutes(content).map(r=>r.path),publicPaths);
  assert.ok(!('gallery' in content));
  assert.ok(!('gallery' in content.counts));
  assert.ok(!('gallery' in content.assistantContent));
  for(const route of publicPaths){
    // Older callers may still pass Gallery fields; the renderer must not embed them.
    const html=renderPage(route,{...content,gallery:[gallery.data]});
    assert.doesNotMatch(html,/gallery|Private gallery title|Private gallery caption/i);
    const guide=JSON.parse(html.match(/<script id="assistant-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.ok(!('gallery' in guide));
  }
  assert.ok(renderPage('/',content).includes(content.profile.photo));
  assert.throws(()=>renderPage('/gallery/',content),/Unknown route/);
});

test('photo and Gallery questions use the existing guide fallback even with legacy Gallery data',()=>{
  const content={...toContent(createSeedDraft()),gallery:[{title:'Private gallery title',image:'/assets/private.png'}]};
  for(const basePath of ['/','/admin/preview/test/']){
    content.basePath=basePath;
    const fallback=answerQuestion('unknown subject',content);
    for(const question of ['gallery','galleries','photo','photos','picture','pictures']){
      assert.deepEqual(answerQuestion(question,content),fallback);
      assert.ok(!answerQuestion(question,content).links.some(l=>l.href.includes('gallery')));
    }
  }
});

test('Gallery-only assets are ignored for publication and preview without mutating stored records',async()=>{
  const id=crypto.randomUUID();
  for(const metadata of [null,{visibility:'private',archived:false},{visibility:'public',archived:false},{visibility:'public',archived:true}]){
    const draft={entries:[{collection:'gallery',id:'photo',data:{title:'Archived feature',image:'asset:'+id}}],relationships:[],assets:metadata?[{id,storage_path:'photo',mime_type:'image/png',size:5,...metadata}]:[]};
    const before=structuredClone(draft),repo={downloadAsset:async()=>assert.fail('Gallery-only images must not be downloaded')};
    for(const allowPrivate of [false,true]){
      const result=await resolveAssets(draft,repo,allowPrivate);
      assert.deepEqual(result.assetFiles,[]);
      assert.deepEqual(result.draft,before);
      assert.deepEqual(draft,before);
    }
  }
  const shared={entries:[{collection:'gallery',id:'photo',data:{image:'asset:'+id}},{collection:'profile',id:'profile',data:{photo:'asset:'+id}}],relationships:[],assets:[{id,storage_path:'photo',mime_type:'image/png',size:5,visibility:'private',archived:false}]};
  let downloads=0;
  const repo={downloadAsset:async()=>{downloads++;return Buffer.from('image');}};
  await assert.rejects(()=>resolveAssets(shared,repo,false),/public/);
  const preview=await resolveAssets(shared,repo,true);
  assert.equal(preview.assetFiles.length,1);
  assert.equal(downloads,1);
  assert.equal(preview.draft.entries[0].data.image,'asset:'+id);
  assert.match(preview.draft.entries[1].data.photo,/^\/assets\/uploads\//);
  shared.assets[0].visibility='public';
  assert.equal((await resolveAssets(shared,repo,false)).assetFiles.length,1);
});

test('fresh and reused builds omit Gallery and prune old output with preview-prefixed navigation',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-gallery-build-'));
  try{
    await build({outputDir:root});
    await assert.rejects(access(path.join(root,'gallery')));
    await mkdir(path.join(root,'gallery/old-photo'),{recursive:true});
    await writeFile(path.join(root,'gallery/index.html'),'OLD GALLERY');
    await writeFile(path.join(root,'gallery/old-photo/index.html'),'OLD PHOTO');
    const content=toContent(createSeedDraft());
    content.gallery=[{title:'Legacy photo title',image:'/assets/old.png'}];
    content.routes.push({path:'/gallery/',title:'Gallery'});
    const basePath='/admin/preview/reused/';
    await build({content,outputDir:root,basePath});
    await assert.rejects(access(path.join(root,'gallery')));
    for(const route of publicPaths){
      const html=await readFile(path.join(root,route,'index.html'),'utf8');
      assert.doesNotMatch(html,/gallery|Legacy photo title/i);
      for(const destination of ['projects/','experience/','credentials/'])assert.ok(html.includes(`href="${basePath}${destination}"`));
      assert.doesNotMatch(html,/(?:href|src)="\/(?!admin\/preview\/reused\/)/);
    }
  }finally{await rm(root,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as model from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';
import {answerQuestion} from '../src/assistant.mjs';
import {build} from '../scripts/build.mjs';

test('seed unifies each project and keeps sample relationships outside factual entries',()=>{
  const draft=model.createSeedDraft(); model.validateDraft(draft);
  const projects=draft.entries.filter(e=>e.collection==='projects');
  assert.equal(projects.length,10);assert.equal(projects.filter(e=>e.data.featured).length,3);
  assert.ok(draft.relationships.every(link=>link.sample===true));
  assert.ok(draft.entries.filter(e=>e.collection==='experiences').every(e=>!('projectIds' in e.data)));
  const content=model.toContent(draft);
  assert.equal(content.deployed[0].title,'AWS Website');assert.equal(content.recorded.length,5);
  assert.equal(content.featured.find(p=>p.id==='hydra').summary,content.recorded.find(p=>p.id==='hydra').purpose);
});

test('entry validation sanitizes fields and rejects unsafe slugs, URLs, and malformed stages',()=>{
  const source=model.createSeedDraft().entries.find(e=>e.collection==='projects');
  assert.equal(model.validateEntry('projects',{...source,unexpected:true}).unexpected,undefined);
  for(const patch of [{id:'../escape'},{id:'x"onclick'},{position:1.5},{position:100001},{data:{...source.data,url:'javascript:alert(1)'}},{data:{...source.data,poster:'/assets/../secret'}},{data:{...source.data,stages:[{title:'Oops',detail:'wrong'}]}}])assert.throws(()=>model.validateEntry('projects',{...source,...patch}),/./);
  assert.throws(()=>model.validateEntry('profile',{collection:'profile',id:'another',data:{name:'A'}}));
});

test('draft permits unassociated projects but rejects broken or duplicate relationships',()=>{
  const draft=model.createSeedDraft();draft.relationships=[];assert.doesNotThrow(()=>model.validateDraft(draft));
  draft.relationships=[{project_id:'missing',experience_id:'top-realty',sample:false}];assert.throws(()=>model.validateDraft(draft));
  draft.relationships=[];draft.entries.push(structuredClone(draft.entries[0]));assert.throws(()=>model.validateDraft(draft));
});

test('optional admin fields and compact workflow stages render without null text',()=>{
  const draft=model.createSeedDraft();
  const profile=draft.entries.find(e=>e.collection==='profile');profile.data.email=null;
  const community=draft.entries.find(e=>e.collection==='community');community.data.organization=null;
  const credential=draft.entries.find(e=>e.collection==='credentials');credential.data.linkLabel=null;
  const project=draft.entries.find(e=>e.id==='aws-website');project.data.stages=[{title:'Build'}];
  const content=model.toContent(draft);
  const html=renderPage('/',content);assert.doesNotMatch(html,/>null<|mailto:null/);assert.match(html,/mobile-detail">Build/);
  assert.equal(content.credentials[0].linkLabel,'Verify');
});

test('visibility, ordering, dynamic routes, counts and sample notices follow current draft',()=>{
  const draft=model.createSeedDraft();
  draft.entries.forEach(e=>{if(e.collection==='credentials')e.sample=false;if(e.collection==='projects'&&e.id!=='hydra')e.visible=false;});
  draft.entries.find(e=>e.id==='top-realty').id='new-role';draft.relationships=[];
  const content=model.toContent(draft);
  assert.equal(content.recorded.length,1);assert.equal(content.featured.length,1);
  assert.ok(model.getRoutes(content).some(r=>r.path==='/experience/new-role/'));
  const html=renderPage('/projects/',content);assert.match(html,/1 project/);assert.doesNotMatch(html,/5 projects|id="aws-website"/);
  assert.doesNotMatch(renderPage('/credentials/',content),/Sample entries/);
  assert.doesNotMatch(renderPage('/experience/new-role/',content),/Sample project connections/);
});

test('render calls are isolated, escaped, and tolerate every empty collection',()=>{
  const draft=model.createSeedDraft();draft.entries=draft.entries.filter(e=>e.collection==='profile');draft.relationships=[];
  draft.entries[0].data.name='<script>other</script>';draft.entries[0].data.photo=null;
  const content=model.toContent(draft);
  for(const route of model.getRoutes(content))assert.equal((renderPage(route.path,content).match(/<h1[\s>]/g)||[]).length,1);
  const custom=renderPage('/',content);assert.match(custom,/&lt;script&gt;other/);assert.doesNotMatch(custom,/<script>other/);
  assert.match(renderPage('/'),/Miggy Rivera/);assert.doesNotMatch(renderPage('/'),/&lt;script&gt;other/);
});

test('guide derives facts, counts, samples and contact links from supplied content',()=>{
  const draft=model.createSeedDraft();draft.relationships=[];
  draft.entries=draft.entries.filter(e=>e.collection==='profile'||e.id==='hydra');
  const profile=draft.entries[0].data;profile.name='Alex';profile.intro='Alex builds tools.';profile.current='Independent developer.';profile.email='alex@example.com';
  const content=model.toContent(draft);content.basePath='/admin/preview/test/';
  const work=answerQuestion('show projects',content);assert.match(work.text,/1 recorded/);assert.doesNotMatch(work.text,/five|AWS|Miggy/);assert.equal(work.links[0].href,'/admin/preview/test/projects/');
  assert.match(answerQuestion('contact',content).links[0].href,/alex@example.com/);
  assert.doesNotMatch(answerQuestion('experience',content).text,/Top Realty|freelance|two/);
  assert.doesNotMatch(answerQuestion('credentials',content).text,/samples/i);
  assert.match(answerQuestion('Who is Alex?',content).text,/Alex builds tools/);
});

test('certificate asset links work and public connections have no sample label',()=>{
  const draft=model.createSeedDraft();
  const credential=draft.entries.find(e=>e.collection==='credentials');credential.data.url='/assets/resume.pdf';credential.data.linkLabel='View certificate';credential.sample=false;
  draft.relationships.forEach(l=>{l.sample=false;});
  const content=model.toContent(draft);content.basePath='/admin/preview/test/';
  assert.match(renderPage('/credentials/',content),/href="\/admin\/preview\/test\/assets\/resume.pdf"[^>]*>View certificate/);
  assert.doesNotMatch(renderPage('/projects/',content),/Experience · sample connection/);
  const projects=renderPage('/projects/',content);const data=JSON.parse(projects.match(/<script id="recorded-data"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(data[0].experienceLinks[0].href,'/admin/preview/test/experience/top-realty/');assert.equal(data[0].experienceLinks[0].sample,false);
});

test('individual sample credentials remain distinguishable from verified factual entries',()=>{
  const draft=model.createSeedDraft();
  const credentials=draft.entries.filter(e=>e.collection==='credentials');credentials[0].sample=false;credentials[0].data.name='Real certificate';credentials[1].data.name='Illustrative certificate';
  const rows=renderPage('/credentials/',model.toContent(draft)).match(/<li class="credential-row">.*?<\/li>/g);
  assert.doesNotMatch(rows[0],/>Sample entry</);assert.match(rows[1],/>Sample entry</);
});

test('build writes isolated preview routes, uploaded assets, and prefixes every internal destination',async()=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'portfolio-content-'));
  try{
    const draft=model.createSeedDraft();draft.entries.find(e=>e.collection==='profile').data.photo='/assets/uploads/test.png';
    await build({content:model.toContent(draft),outputDir:temp,basePath:'/admin/preview/test/',assetFiles:[{path:'/assets/uploads/test.png',bytes:Buffer.from('test-image')}]});
    const html=await readFile(path.join(temp,'index.html'),'utf8');
    assert.match(html,/src="\/admin\/preview\/test\/assets\/uploads\/test.png"/);assert.match(html,/href="\/admin\/preview\/test\/projects\/"/);
    assert.doesNotMatch(html,/(?:href|src)="\/(?!admin\/preview\/test\/)/);
    assert.equal(await readFile(path.join(temp,'assets/uploads/test.png'),'utf8'),'test-image');
    const css=await readFile(path.join(temp,'styles.css'),'utf8');assert.doesNotMatch(css,/url\(['"]?\/assets\//);
    await assert.rejects(build({outputDir:temp,basePath:'//evil.test/'}));
    await assert.rejects(build({outputDir:temp,assetFiles:[{path:'/assets/uploads/../escape',bytes:Buffer.from('x')}]}));
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('featured project editing enforces the three-sheet capacity and renders smaller selections',()=>{
  const draft=model.createSeedDraft();const entries=draft.entries.filter(e=>e.collection==='projects');
  entries.find(e=>!e.data.featured).data.featured=true;
  assert.throws(()=>model.validateDraft(draft),/at most three/i);
  entries.forEach(e=>e.data.featured=false);entries[0].data.featured=true;
  assert.match(renderPage('/',model.toContent(draft)),/data-sheet-count="1"/);
  entries[1].data.featured=true;
  assert.match(renderPage('/',model.toContent(draft)),/data-sheet-count="2"/);
});

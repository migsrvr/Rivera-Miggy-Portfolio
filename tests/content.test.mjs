import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as model from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';
import {answerQuestion} from '../src/assistant.mjs';
import {build} from '../scripts/build.mjs';

test('deployed projects link to their live sites and repositories, except Hydra until it deploys',()=>{
  const content=model.toContent(model.createSeedDraft()),html=renderPage('/projects/',content);
  for(const p of content.deployed){
    if(p.id==='hydra'){assert.equal(p.url,null);continue;}
    assert.match(p.url,/^https:\/\//);assert.match(p.repositoryUrl,/^https:\/\/github\.com\//);
    assert.ok(html.includes('href="'+new URL(p.url).href+'"'),p.id+' renders its live link');
  }
  assert.match(html,/id="hydra"[\s\S]*?Website link coming soon/);
});

test('every project is a live project and Hydra and Rule VII retain their feature diagrams',()=>{
  const draft=model.createSeedDraft(),content=model.toContent(draft);
  assert.deepEqual(content.deployed.map(p=>p.id),['aws-website','aws-photobooth','care-cures','mediseena','pax-virentia','hydra','rule-vii','hima-paiflow','desktop-widget']);
  assert.ok(!('recorded' in content));assert.equal(content.deployed.find(p=>p.id==='desktop-widget').title,'SESSION');
  assert.equal(content.counts.projects,9);
  assert.match(answerQuestion('show projects',content).text,/^9 projects are listed/);
  const html=renderPage('/projects/',content);
  for(const id of ['hydra','rule-vii'])assert.match(html,new RegExp('<article[^>]*id="'+id+'"'));
  assert.doesNotMatch(html,/Recorded work|demo-|<video|youtube|SNEA/i);
  assert.deepEqual(content.featured.map(p=>[p.id,p.stages.map(s=>s.title)]),[
    ['aws-website',['Registration','Review','Notifications']],
    ['rule-vii',['Documents','Indexing','Retrieval']],
    ['hydra',['Records','Processing','Risk screening']],
  ]);
  assert.deepEqual(draft.relationships.map(l=>[l.project_id,l.experience_id]).sort((a,b)=>a[0].localeCompare(b[0])),[
    ['aws-website','aws-sbg-jru'],['care-cures','freelance'],
  ]);
  assert.ok(draft.relationships.every(link=>link.sample===false));
  assert.doesNotMatch(html,/href="\/experience\/[^"]+|project-experience/);
  assert.ok(!('relationships' in content));
});

test('seed unifies each project and keeps confirmed relationships outside factual entries',()=>{
  const draft=model.createSeedDraft(); model.validateDraft(draft);
  const projects=draft.entries.filter(e=>e.collection==='projects');
  assert.equal(projects.length,9);assert.equal(projects.filter(e=>e.data.featured).length,3);
  assert.ok(draft.relationships.every(link=>link.sample===false));
  assert.ok(draft.entries.filter(e=>e.collection==='experiences').every(e=>!('projectIds' in e.data)));
  const content=model.toContent(draft);
  assert.equal(content.deployed[0].title,'AWS Website');
  for(const feature of content.featured){const project=content.projects.find(p=>p.id===feature.id);assert.equal(feature.summary,project.role||project.purpose||'');}
});

test('entry validation sanitizes fields and rejects unsafe slugs, URLs, and malformed stages',()=>{
  const source=model.createSeedDraft().entries.find(e=>e.collection==='projects');
  assert.equal(model.validateEntry('projects',{...source,unexpected:true}).unexpected,undefined);
  const retired=model.validateEntry('projects',{...source,data:{...source.data,kind:'recorded',videoUrl:'https://youtu.be/abcDEF123_-',poster:'/assets/stage-speaking.png',mark:'HY'}}).data;
  for(const key of ['kind','videoUrl','poster','mark'])assert.ok(!(key in retired),key+' is stripped');
  for(const patch of [{id:'../escape'},{id:'x"onclick'},{position:1.5},{position:100001},{data:{...source.data,url:'javascript:alert(1)'}},{data:{...source.data,stages:[{title:'Oops',detail:'wrong'}]}}])assert.throws(()=>model.validateEntry('projects',{...source,...patch}),/./);
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

test('visibility, ordering, fixed routes, counts and sample notices follow current draft',()=>{
  const draft=model.createSeedDraft();
  draft.entries.forEach(e=>{if(e.collection==='credentials')e.sample=false;if(e.collection==='projects'&&e.id!=='hydra')e.visible=false;});
  draft.entries.find(e=>e.id==='top-realty').id='new-role';draft.relationships=[];
  const content=model.toContent(draft);
  assert.equal(content.deployed.length,1);assert.equal(content.featured.length,1);
  assert.ok(!model.getRoutes(content).some(r=>r.path==='/experience/new-role/'));
  const html=renderPage('/projects/',content);assert.equal((html.match(/<article[^>]*id="hydra"/g)||[]).length,1);assert.doesNotMatch(html,/5 projects|id="aws-website"/);
  assert.doesNotMatch(renderPage('/credentials/',content),/Sample entries/);
  assert.doesNotMatch(renderPage('/experience/',content),/Sample project connections/);
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
  const work=answerQuestion('show projects',content);assert.match(work.text,/^1 project is listed: Hydra\./);assert.doesNotMatch(work.text,/five|AWS|Miggy/);assert.equal(work.links[0].href,'/admin/preview/test/projects/');
  assert.match(answerQuestion('contact',content).links[0].href,/alex@example.com/);
  assert.doesNotMatch(answerQuestion('experience',content).text,/Top Realty|freelance|two/);
  assert.doesNotMatch(answerQuestion('credentials',content).text,/samples/i);
  assert.match(answerQuestion('Who is Alex?',content).text,/Alex builds tools/);
});

test('certificate asset links work and projects omit experience associations',()=>{
  const draft=model.createSeedDraft();
  const credential=draft.entries.find(e=>e.collection==='credentials');credential.data.url='/assets/resume.pdf';credential.data.linkLabel='View certificate';credential.sample=false;
  const content=model.toContent(draft);content.basePath='/admin/preview/test/';
  assert.match(renderPage('/credentials/',content),/href="\/admin\/preview\/test\/assets\/resume.pdf"[^>]*>View certificate/);
  assert.doesNotMatch(renderPage('/projects/',content),/Experience · sample connection/);
  assert.doesNotMatch(renderPage('/projects/',content),/recorded-data|experienceLinks/);
});

test('sample relationships remain editable draft data and stay out of public content',()=>{
  const draft=model.createSeedDraft();
  draft.relationships.push({project_id:'hydra',experience_id:'top-realty',sample:true});
  const before=structuredClone(draft),content=model.toContent(draft),html=renderPage('/projects/',content);
  assert.deepEqual(draft,before);
  assert.ok(draft.relationships.some(link=>link.sample));
  assert.ok(!('relationships' in content));
  assert.doesNotMatch(html,/sample connection|projectIds|sampleConnections|experienceLinks|"relationships"/);
  assert.doesNotMatch(answerQuestion('experience',content).text,/project connections/);
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
    const guide=await import(pathToFileURL(path.join(temp,'assistant.mjs')).href);
    assert.match(guide.answerQuestion('experience',model.toContent(draft)).text,/Top Realty/);
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

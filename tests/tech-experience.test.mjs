import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createSeedDraft,toContent,getRoutes} from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';
import {stackFor,techLogo} from '../src/activity.mjs';
import {answerQuestion} from '../src/assistant.mjs';
import {build} from '../scripts/build.mjs';

const json=(html,id)=>JSON.parse(html.match(new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1]);
const main=html=>html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];

test('all twenty-three technologies have marks, with normalized lookup and text for custom tools',()=>{
  const content=toContent(createSeedDraft()),stack=stackFor(content.profile,content.projects);
  assert.equal(stack.length,23);
  for(const name of stack){
    assert.ok(techLogo(` ${name.toUpperCase()} `)||['Tesseract.js','pgvector','Groq'].includes(name),name);
  }
  const html=renderPage('/',content),list=html.match(/<ul class="tech-stack-list"[\s\S]*?<\/ul>/)[0];
  assert.equal((list.match(/class="tech-icon(?: tech-badge)?"/g)||[]).length,23);
  for(const badge of ['OCR','PGV','GQ'])assert.match(list,new RegExp(`aria-hidden="true">${badge}</span>`));
  for(const slug of ['react','railway','nextdotjs','typescript','googlegemini','expo','express','stellar','vite','tauri','rust'])assert.ok(list.includes(`/assets/tech/${slug}.svg`));
  assert.equal(techLogo('React Native'),'react');
  content.profile.techStack=[' React ','Unknown tool','constructor'];
  const custom=renderPage('/',content);
  assert.match(custom,/assets\/tech\/react.svg/);assert.match(custom,/>Unknown tool</);
  assert.doesNotMatch(custom,/unknown tool\.svg/);
  assert.equal(techLogo('constructor'),null);
  assert.match(custom,/>constructor</);
});

test('Experience is readable, keeps its facts and MR logo, and exposes no detail destinations or associations',()=>{
  const draft=createSeedDraft(),before=structuredClone(draft),content=toContent(draft);
  assert.equal(getRoutes(content).length,7);
  assert.deepEqual(draft,before);assert.equal(draft.relationships.length,2);
  assert.equal(content.experiences.find(item=>item.id==='freelance').logo,'/assets/favicon.svg');
  for(const route of ['/','/experience/']){
    const html=renderPage(route,content),rows=main(html).match(/<ul class="plain-list (?:compact|full)-experience">([\s\S]*?)<\/ul>/)[1];
    assert.equal((rows.match(/<li class="experience-row">/g)||[]).length,6);
    assert.doesNotMatch(rows,/<a\b|<button\b|tabindex|role="link"|class="icon/);
    assert.match(html,/href="\/experience\/"/);
  }
  for(const route of getRoutes(content)){
    const html=renderPage(route.path,content),guide=json(html,'assistant-data');
    assert.doesNotMatch(html,/href="\/experience\/[^"/]+\//);
    assert.ok(!('relationships' in guide));
    assert.ok(guide.experiences.every(item=>!('projectIds' in item)&&!('sampleConnections' in item)));
    for(const item of content.experiences)if(item.description)assert.equal(guide.experiences.find(e=>e.id===item.id).description,item.description);
  }
  const projects=renderPage('/projects/',content);
  assert.doesNotMatch(projects,/project-experience|recorded-data|experienceLinks/);
  assert.match(answerQuestion('experience',json(projects,'assistant-data')).text,/Makati|Remote/);
  for(const item of content.experiences)assert.throws(()=>renderPage(`/experience/${item.id}/`,content),/Unknown route/);
});

test('fresh and reused builds omit detail pages and prune obsolete experience folders',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-retired-build-'));
  try{
    await build({outputDir:root});
    await assert.rejects(access(path.join(root,'experience/freelance/index.html')));
    await mkdir(path.join(root,'experience/retired-role'),{recursive:true});
    await writeFile(path.join(root,'experience/retired-role/index.html'),'old detail');
    await build({outputDir:root,basePath:'/admin/preview/reused/'});
    await assert.rejects(access(path.join(root,'experience/retired-role')));
    const html=await readFile(path.join(root,'experience/index.html'),'utf8');
    assert.match(html,/href="\/admin\/preview\/reused\/experience\/"/);
    assert.doesNotMatch(JSON.stringify(json(html,'assistant-data')),/projectIds|sampleConnections|relationships|experienceLinks/);
  }finally{await rm(root,{recursive:true,force:true});}
});

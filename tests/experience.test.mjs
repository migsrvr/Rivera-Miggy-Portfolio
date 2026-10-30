import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeedDraft,toContent,validateEntry} from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';
import {answerQuestion} from '../src/assistant.mjs';

const main=html=>html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];

test('experience periods handle current, completed, absent, and legacy dates without guessing',async()=>{
  const {formatExperiencePeriod}=await import('../src/experience.mjs');
  assert.equal(formatExperiencePeriod({startDate:'2026-10',endDate:null}),'Oct 2026 – Present');
  assert.equal(formatExperiencePeriod({startDate:'2026-06',endDate:'2026-09'}),'Jun 2026 – Sep 2026');
  assert.equal(formatExperiencePeriod({startDate:' ',endDate:''}),'');
  assert.equal(formatExperiencePeriod({startDate:'Early 2025',endDate:'Spring 2026'}),'Early 2025 – Spring 2026');
  assert.equal(formatExperiencePeriod({endDate:'2026-09'}),'Sep 2026');
});

test('experience and community metadata round-trip while older entries remain valid',()=>{
  for(const collection of ['experiences','community']){
    const source=createSeedDraft().entries.find(entry=>entry.collection===collection);
    const data={...source.data,employmentType:'Internship',location:'Makati',workMode:'On-site'};
    const parsed=validateEntry(collection,{...source,data});
    for(const key of ['employmentType','location','workMode'])assert.equal(parsed.data[key],data[key]);
    for(const key of ['employmentType','location','workMode'])delete data[key];
    const legacy=validateEntry(collection,{...source,data});
    for(const key of ['employmentType','location','workMode'])assert.equal(legacy.data[key],null);
    assert.throws(()=>validateEntry(collection,{...source,data:{...data,workMode:42}}));
  }
});

test('Home stays compact while full experience pages show escaped work metadata',()=>{
  const draft=createSeedDraft(),entry=draft.entries.find(item=>item.id==='top-realty');
  Object.assign(entry.data,{startDate:'2026-06',endDate:'2026-09',employmentType:'Internship',location:'<img src=x onerror=alert(1)>',workMode:'Remote',description:null});
  draft.relationships=[];
  const content=toContent(draft),home=main(renderPage('/',content));
  const row=home.match(/<ul class="plain-list compact-experience">([\s\S]*?)<\/ul>/)[1];
  assert.match(row,/Jun 2026 – Sep 2026/);
  assert.doesNotMatch(row,/onerror|Remote/);
  for(const route of ['/experience/']){
    const html=main(renderPage(route,content));
    assert.match(html,/Jun 2026 – Sep 2026/);
    assert.match(html,/Internship · &lt;img src=x onerror=alert\(1\)&gt; · Remote/);
    assert.doesNotMatch(html,/<img src=x|>null<|<p><\/p>/);
  }
  assert.doesNotMatch(main(renderPage('/experience/',content)),/Related projects/);
});

test('AWS facts agree across Experience and Leadership without changing project associations',()=>{
  const draft=createSeedDraft(),content=toContent(draft);
  const leadership=content.communityPages.find(page=>page.id==='leadership');
  for(const item of leadership.entries){
    const experience=content.experiences.find(entry=>entry.role===item.role&&entry.organization===item.organization);
    assert.ok(experience,'Leadership role has a matching experience');
    for(const key of ['description','startDate','endDate','employmentType','location','workMode'])assert.equal(item[key],experience[key],key);
  }
  assert.deepEqual(draft.relationships.map(({project_id,experience_id,sample})=>[project_id,experience_id,sample]).sort((a,b)=>a[0].localeCompare(b[0])),[
    ['aws-website','aws-sbg-jru',false],['care-cures','freelance',false],
  ]);
});

test('guide answers include supplied periods and work context without inventing absent dates',()=>{
  const draft=createSeedDraft(),entry=draft.entries.find(item=>item.id==='top-realty');
  Object.assign(entry.data,{startDate:'2026-06',endDate:'2026-09',employmentType:'Internship',location:'Chicago',workMode:'Remote'});
  const content=toContent(draft),text=answerQuestion('experience',content).text;
  assert.match(text,/Jun 2026 – Sep 2026/);
  assert.match(text,/Internship · Chicago · Remote/);
  const freelance=content.experiences.find(item=>item.id==='freelance');
  const single=answerQuestion('experience',{...content,experiences:[freelance]}).text;
  assert.doesNotMatch(single,/Present|null|undefined/);
});

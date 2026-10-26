import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeedDraft,toContent,validateEntry} from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';

test('Home ends with stack and activity while contact and colophon live in navigation',()=>{
  const html=renderPage('/');
  const main=html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
  assert.match(main,/id="tech-stack-title"/);assert.match(main,/id="github-activity-title"/);
  assert.doesNotMatch(html,/<footer/);
  const sidebar=html.match(/<aside class="site-sidebar">([\s\S]*?)<\/aside>/)[1];
  assert.match(sidebar,/Let’s build something useful/);assert.match(sidebar,/rivera.dev.miggy@gmail.com/);assert.match(sidebar,/Miggy G. Rivera/);
  assert.match(renderPage('/experience/'),/<footer/);
});

test('stack uses configured order or visible project tools without inventing skills',()=>{
  const draft=createSeedDraft(),profile=draft.entries.find(e=>e.collection==='profile');
  profile.data.techStack=['Python','Custom tool','Python'];
  const data=toContent(draft);const html=renderPage('/',data);
  const stack=html.match(/<ul class="tech-stack-list"[\s\S]*?<\/ul>/)?.[0]||'';
  assert.match(stack,/Python/);assert.match(stack,/Custom tool/);assert.doesNotMatch(stack,/JavaScript/);
  assert.equal((stack.match(/<span>Python<\/span>/g)||[]).length,1);
  assert.match(stack,/assets\/tech\/python.svg/);assert.doesNotMatch(stack,/custom tool.svg/);
  profile.data.techStack=[];
  assert.match(renderPage('/',toContent(draft)),/assets\/tech\/javascript.svg/);
  assert.deepEqual(validateEntry('profile',profile).data.techStack,[]);
});

test('missing GitHub identity has no fabricated activity or outbound profile link',()=>{
  const draft=createSeedDraft();draft.entries[0].data.github=null;
  const html=renderPage('/',toContent(draft));
  assert.match(html,/GitHub profile not connected/);assert.doesNotMatch(html,/\d+ contributions in the last year/);
});

test('contribution chart renders snapshot counts with local grayscale cells and safe profile link',()=>{
  const draft=createSeedDraft();draft.entries[0].data.github='https://github.com/example-user';
  draft.githubActivity={username:'example-user',fetchedAt:'2026-10-26T00:00:00.000Z',days:[{date:'2026-10-25',count:3,level:2},{date:'2026-10-26',count:1,level:1}]};
  const html=renderPage('/',toContent(draft));
  assert.match(html,/4 contributions/);assert.match(html,/2026-10-25: 3 contributions/);assert.match(html,/data-level="2"/);
  assert.match(html,/href="https:\/\/github.com\/example-user"/);assert.doesNotMatch(html,/ghchart|jogruber|<iframe/);
});

test('activity from a different identity is not displayed',()=>{
  const draft=createSeedDraft();draft.entries[0].data.github='https://github.com/new-user';
  draft.githubActivity={username:'old-user',fetchedAt:'2026-10-26T00:00:00.000Z',days:[{date:'2026-10-25',count:999,level:4}]};
  assert.doesNotMatch(renderPage('/',toContent(draft)),/999 contributions/);
});

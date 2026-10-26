import test from 'node:test';
import assert from 'node:assert/strict';
import {experiences, routes, deployed, recorded} from '../src/content.mjs';
import {renderPage} from '../src/render.mjs';

test('every page offers the complete sidebar and an accessible mobile menu',()=>{
  for(const route of routes){
    const html=renderPage(route.path);
    assert.match(html,/class="site-sidebar"/);
    assert.match(html,/href="\/gallery\/"/);
    assert.match(html,/<dialog[^>]*id="mobile-navigation"/);
    assert.match(html,/aria-controls="mobile-navigation"/);
    assert.match(html,/aria-controls="portfolio-chat"/);
  }
});

test('experience entries open detail pages and connect back from every project',()=>{
  const projectIds=[...deployed,...recorded].map(p=>p.id);
  for(const item of experiences){
    assert.ok(item.id);
    const path=`/experience/${item.id}/`;
    assert.ok(routes.some(r=>r.path===path));
    for(const parent of ['/','/experience/'])assert.ok(renderPage(parent).includes(`href="${path}"`));
    const detail=renderPage(path);
    assert.match(detail,/Related projects/);
    assert.match(detail,/Sample project connections/);
    for(const id of item.projectIds){assert.ok(projectIds.includes(id));assert.ok(detail.includes(`href="/projects/#${id}"`));}
    assert.ok(renderPage('/projects/').includes(`href="${path}"`));
  }
  for(const id of projectIds)assert.ok(experiences.some(x=>x.projectIds.includes(id)),id);
});

test('gallery is a navigation destination without a Home content section',()=>{
  const html=renderPage('/gallery/');
  assert.match(html,/class="gallery-grid"/);
  assert.match(html,/data-gallery-open/);
  assert.match(html,/<dialog[^>]*id="gallery-viewer"/);
  assert.equal((html.match(/class="gallery-item"/g)||[]).length,4);
  assert.match(html,/Photo to be added/);
  assert.doesNotMatch(renderPage('/'),/class="gallery-grid"/);
});

test('project layers expose three real title tabs with no decorative fake sheets',()=>{
  const html=renderPage('/');
  assert.match(html,/data-sheet-order="2"/);
  assert.equal((html.match(/data-folio-tab=/g)||[]).length,3);
  assert.match(html,/aria-orientation="vertical"/);
  assert.match(html,/id="portfolio-chat"/);
  assert.match(html,/name="question"[^>]*maxlength="500"/);
  assert.match(html,/Portfolio guide/);
});

test('portfolio guide returns sourced routes and a truthful fallback',async()=>{
  const {answerQuestion}=await import('../src/assistant.mjs');
  const {assistantContent}=await import('../src/content.mjs');
  for(const [question,path] of [['show projects','/projects/'],['where is Miggy working?','/experience/'],['AWS Website','/projects/#aws-website'],['certifications','/credentials/'],['photos','/gallery/'],['hackathons','/hackathons/']]){
    const answer=answerQuestion(question,assistantContent);
    assert.ok(answer.text.length>10);
    assert.ok(answer.links.some(l=>l.href===path),question);
  }
  assert.match(answerQuestion('who won the world cup?',assistantContent).text,/only|portfolio/i);
  assert.match(answerQuestion('salary?',assistantContent).text,/only|portfolio|not/i);
  assert.equal(answerQuestion('   ',assistantContent),null);
  const hostile=answerQuestion('<img src=x onerror=alert(1)>',assistantContent);
  assert.ok(!hostile.text.includes('<img'));
});

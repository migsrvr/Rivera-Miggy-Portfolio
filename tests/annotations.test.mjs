import test from 'node:test';
import assert from 'node:assert/strict';
import {experiences, routes} from '../src/content.mjs';
import {renderPage} from '../src/render.mjs';

test('every page offers the complete sidebar and an accessible mobile menu',()=>{
  for(const route of routes){
    const html=renderPage(route.path);
    assert.match(html,/class="site-sidebar"/);
    assert.doesNotMatch(html,/gallery/i);
    assert.match(html,/<dialog[^>]*id="mobile-navigation"/);
    assert.match(html,/aria-controls="mobile-navigation"/);
    assert.match(html,/aria-controls="portfolio-chat"/);
  }
});

test('experience rows retain supplied facts without opening individual pages',()=>{
  for(const item of experiences){
    const path=`/experience/${item.id}/`;
    assert.ok(!routes.some(r=>r.path===path));
    for(const parent of ['/','/experience/'])assert.ok(!renderPage(parent).includes(`href="${path}"`));
    assert.throws(()=>renderPage(path),/Unknown route/);
    assert.ok(!renderPage('/projects/').includes(`href="${path}"`));
    if(item.description)assert.ok(renderPage('/experience/').includes(item.description));
  }
});

test('Gallery has no public route or replacement photo section',()=>{
  assert.throws(()=>renderPage('/gallery/'),/Unknown route/);
  for(const route of routes)assert.doesNotMatch(renderPage(route.path),/gallery-grid|data-gallery-open|gallery-viewer|Photo to be added/);
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
  for(const [question,path] of [['show projects','/projects/'],['where is Miggy working?','/experience/'],['AWS Website','/projects/#aws-website'],['certifications','/credentials/'],['hackathons','/hackathons/']]){
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

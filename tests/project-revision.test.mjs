import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeedDraft,toContent,getRoutes} from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';

test('all pages keep contact in navigation without repeated page contact or work-year labels',()=>{
  const content=toContent(createSeedDraft());
  for(const route of getRoutes(content)){
    const html=renderPage(route.path,content);
    assert.doesNotMatch(html,/<div class="contact">|Let’s talk\.|Selected work \/ \d{4}/,route.path);
    const sidebar=html.match(/<aside class="site-sidebar">([\s\S]*?)<\/aside>/)[1];
    const menu=html.match(/<dialog id="mobile-navigation"[\s\S]*?<\/dialog>/)[0];
    for(const navigation of [sidebar,menu]){
      assert.match(navigation,/mailto:rivera.dev.miggy@gmail.com/);
      assert.doesNotMatch(navigation,/href="https:\/\/github.com\//);
    }
    if(route.path!=='/')assert.match(html,/Back to home/);
  }
  assert.match(renderPage('/',content),/href="https:\/\/github.com\/migsrvr"/);
});

test('larger demo selectors preserve supplied posters and the single connected player',()=>{
  const draft=createSeedDraft();draft.entries.find(e=>e.id==='hima-paiflow').data.poster='/assets/stage-speaking.png';
  const content=toContent(draft);const html=renderPage('/projects/',content);
  assert.match(html,/data-project-count="3"/);
  const tab=html.match(/<button class="demo-tab"[^>]*id="demo-tab-hima-paiflow"[\s\S]*?<\/button>/)[0];
  assert.match(tab,/class="demo-still"[^>]*src="\/assets\/stage-speaking.png"/);
  assert.match(tab,/aria-controls="demo-panel"/);
  assert.equal((html.match(/id="demo-player"/g)||[]).length,1);
});

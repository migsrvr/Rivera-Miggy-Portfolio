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

test('leftover demo fields in an old draft are dropped and never rendered',()=>{
  const draft=createSeedDraft(),hima=draft.entries.find(e=>e.id==='hima-paiflow');
  Object.assign(hima.data,{kind:'recorded',poster:'/assets/stage-speaking.png',videoUrl:'https://youtu.be/abcDEF123_-'});
  const content=toContent(draft),html=renderPage('/projects/',content),main=html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
  const live=content.deployed.find(p=>p.id==='hima-paiflow');
  for(const key of ['kind','poster','videoUrl'])assert.ok(!(key in live),key);
  assert.match(main,/<article[^>]*id="hima-paiflow"/);
  assert.doesNotMatch(html,/demo-|youtu|<video/);assert.doesNotMatch(main,/stage-speaking/);
});

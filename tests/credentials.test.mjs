import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeedDraft,toContent} from '../src/model.mjs';
import {renderPage} from '../src/render.mjs';

test('credential dates preserve issue or expiry labels, escape content, and omit absent dates',()=>{
  const draft=createSeedDraft();
  draft.entries=draft.entries.filter(entry=>entry.collection!=='credentials');
  const entries=[
    {id:'issued',date:'Issued Jul 22, 2026'},
    {id:'expires',date:'Expires May 6, 2031'},
    {id:'unsafe',date:'<img src=x onerror=alert(1)>'},
    {id:'undated',date:null},
  ];
  draft.entries.push(...entries.map(({id,date},position)=>({collection:'credentials',id,position,visible:true,archived:false,sample:false,data:{name:id,provider:'Issuer',date,url:'https://www.credly.com/badges/example/public_url',linkLabel:'Verify'}})));
  const content=toContent(draft);
  for(const route of ['/','/credentials/']){
    const html=renderPage(route,content);
    assert.match(html,/<p class="row-provider">Issued Jul 22, 2026<\/p>/);
    assert.match(html,/<p class="row-provider">Expires May 6, 2031<\/p>/);
  }
  const html=renderPage('/credentials/',content),rows=html.match(/<li class="credential-row">.*?<\/li>/g);
  assert.match(rows[2],/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(rows.join(''),/<img src=x|>null<|Sample entr/);
  assert.equal((rows[3].match(/class="row-provider"/g)||[]).length,1);
  assert.match(rows[3],/href="https:\/\/www\.credly\.com\/badges\/example\/public_url" target="_blank" rel="noopener noreferrer"/);
});

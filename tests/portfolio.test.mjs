import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../src/content.mjs';
import {deployed, featured, experiences, credentials, routes} from '../src/content.mjs';
import {safeExternalUrl} from '../src/media.mjs';
import * as media from '../src/media.mjs';
import {renderPage, escapeHtml, safeJson} from '../src/render.mjs';

test('inventory preserves the supplied nine live projects and AWS lead',()=>{
  assert.deepEqual(deployed.map(p=>p.title),['AWS Website','AWS Photobooth','Care Cures','Mediseena','Pax Virentia','Hydra','Rule VII','Hima-Paiflow','SESSION']);
  assert.ok(!('recorded' in content));
  assert.equal(featured[0].id,'aws-website');
  assert.equal(experiences.length,6);assert.equal(credentials.length,6);
});
test('external links accept HTTP(S) only and reject fake or empty targets',()=>{
  for(const url of [null,'','#','javascript:alert(1)','data:text/html,a','file:///C:/x','//example.com','https://user:password@example.com'])assert.equal(safeExternalUrl(url),null);
  assert.equal(safeExternalUrl('https://example.com/work'),'https://example.com/work');
});
test('video demo helpers no longer exist',()=>{
  assert.deepEqual(Object.keys(media),['safeExternalUrl']);
});
test('all seven routes have one h1, real navigation, correct current state, and no unfinished page',()=>{
  assert.deepEqual(routes.map(r=>r.path),['/','/projects/','/experience/','/credentials/','/hackathons/','/leadership/','/organizations/']);
  for(const route of routes){const html=renderPage(route.path);assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);assert.match(html,/<html lang="en"/);assert.match(html,/href="\/projects\/"/);assert.match(html,/href="\/experience\/"/);assert.match(html,/href="\/credentials\/"/);assert.doesNotMatch(html,/href="#"|javascript:|href="\/practice\//);if(['/projects/','/experience/','/credentials/'].includes(route.path))assert.match(html,new RegExp('href="'+route.path+'"[^>]*aria-current="page"'));}
});
test('public canonical and share URLs use the custom domain while preview navigation stays local',()=>{
  for(const route of routes){
    const expected='https://www.miggyrivera.tech'+route.path;
    const html=renderPage(route.path);
    assert.ok(html.includes(`<link rel="canonical" href="${expected}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${expected}">`));
    assert.doesNotMatch(html,/miggy-rivera\.vercel\.app/);
  }
  const preview=renderPage('/projects/',{...content,basePath:'/admin/preview/domain/'});
  assert.match(preview,/<link rel="canonical" href="https:\/\/www\.miggyrivera\.tech\/projects\/">/);
  assert.match(preview,/href="\/admin\/preview\/domain\/experience\/"/);
  assert.doesNotMatch(preview,/https:\/\/www\.miggyrivera\.tech\/admin\//);
});

test('projects render every live project and no demo player',()=>{
  const html=renderPage('/projects/');for(const p of deployed)assert.ok(html.includes(p.title));
  assert.doesNotMatch(html,/Recorded work|demo-|data-play-demo|Video preview|<iframe|<video|youtube/i);
});
test('Home has working overview links, real supplied resume and no missing social destinations',()=>{
  const html=renderPage('/');assert.match(html,/href="\/experience\/"[^>]*>\s*View all/);assert.match(html,/href="\/credentials\/"[^>]*>\s*View all/);assert.match(html,/href="\/assets\/resume.pdf"/);assert.doesNotMatch(html,/href="null"/);assert.match(html,/href="https:\/\/github.com\/migsrvr"/);
  assert.equal((html.match(/data-folio-tab=/g)||[]).length,3);
});
test('unprovided verification destinations remain unavailable instead of fake links',()=>{
  const html=renderPage('/credentials/',{...content,credentials:credentials.map(item=>({...item,url:null}))});assert.equal((html.match(/class="credential-row"/g)||[]).length,6);assert.equal((html.match(/aria-disabled="true"/g)||[]).length,6);assert.doesNotMatch(html,/target="_blank"[^>]*href="#"/);
});
test('content escaping protects HTML text and embedded JSON script boundaries',()=>{
  assert.equal(escapeHtml('<img x="&">'), '&lt;img x=&quot;&amp;&quot;&gt;');
  assert.ok(!safeJson({x:'</script><script>alert(1)</script>'}).includes('</script>'));
});

test('page heading hierarchy does not skip levels',()=>{
  for(const route of routes){let previous=0;for(const match of renderPage(route.path).matchAll(/<h([1-6])(?:\s|>)/g)){const level=Number(match[1]);assert.ok(level<=previous+1,`${route.path} skips from h${previous} to h${level}`);previous=level;}}
});


test('Home omits the community section while retaining its existing category pages',()=>{
  const html=renderPage('/');
  assert.doesNotMatch(html,/community-title|community-link|Practice &amp; community/);
  assert.ok(html.indexOf('id="experience-title"')<html.indexOf('id="credentials-title"'));
  for(const [slug,title] of [['hackathons','Hackathons'],['leadership','Leadership'],['organizations','Organizations']]){
    assert.ok(!html.includes(`href="/${slug}/"`));
    assert.ok(routes.some(r=>r.path==='/'+slug+'/'));
    assert.ok(renderPage('/'+slug+'/').includes('<h1>'+title+'.</h1>'));
  }
});
test('community pages reuse plain reading rows and preserve supplied facts',()=>{
  for(const path of ['/hackathons/','/leadership/','/organizations/']){
    const html=renderPage(path);assert.match(html,/class="experience-row"/);assert.match(html,/Back to home/);
    assert.doesNotMatch(html,/deployed-tile|folio-sheet|<p class="experience-description"><\/p>/);
  }
  assert.match(renderPage('/hackathons/'),/Sample entry/);
  assert.match(renderPage('/leadership/'),/Web Developer Lead/);
  assert.match(renderPage('/leadership/'),/Vice President of External Affairs/);
  assert.match(renderPage('/organizations/'),/Notion Campus Leader/);
});

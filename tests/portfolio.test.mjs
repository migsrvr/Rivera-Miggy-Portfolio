import test from 'node:test';
import assert from 'node:assert/strict';
import {deployed, recorded, featured, experiences, credentials, routes} from '../src/content.mjs';
import {safeExternalUrl, videoSource, selectProject} from '../src/media.mjs';
import {renderPage, escapeHtml, safeJson} from '../src/render.mjs';

test('inventory preserves the supplied ten projects and AWS lead',()=>{
  assert.deepEqual(deployed.map(p=>p.title),['AWS Website','AWS Photobooth','Care Cures','Mediseena','Pax Virentia']);
  assert.deepEqual(recorded.map(p=>p.title),['Hydra','Rule VII','Hima-Paiflow','Desktop-Widget','SNEA']);
  assert.equal(featured[0].id,'aws-website');
  assert.equal(experiences.length,3);assert.equal(credentials.length,6);
});
test('external links accept HTTP(S) only and reject fake or empty targets',()=>{
  for(const url of [null,'','#','javascript:alert(1)','data:text/html,a','file:///C:/x','//example.com','https://user:password@example.com'])assert.equal(safeExternalUrl(url),null);
  assert.equal(safeExternalUrl('https://example.com/work'),'https://example.com/work');
});
test('video URLs support known YouTube forms and local direct recordings safely',()=>{
  for(const url of ['https://youtu.be/abcDEF123_-','https://www.youtube.com/watch?v=abcDEF123_-','https://www.youtube.com/embed/abcDEF123_-']){
    assert.deepEqual(videoSource(url),{type:'youtube',src:'https://www.youtube-nocookie.com/embed/abcDEF123_-'});
  }
  assert.deepEqual(videoSource('/assets/demo.mp4'),{type:'video',src:'/assets/demo.mp4'});
  assert.deepEqual(videoSource('https://example.com/demo.webm'),{type:'video',src:'https://example.com/demo.webm'});
  for(const url of [null,'javascript:alert(1)','https://youtube.com.evil.test/watch?v=abcDEF123_-','https://youtu.be/bad','//evil.test/demo.mp4','/../private.mp4'])assert.equal(videoSource(url),null);
});
test('selection finds the requested demo and falls back without altering the collection',()=>{
  const ids=recorded.map(p=>p.id);assert.equal(selectProject(recorded,'snea').title,'SNEA');
  assert.equal(selectProject(recorded,'missing').id,'hydra');assert.equal(selectProject([], 'missing'),null);
  assert.deepEqual(recorded.map(p=>p.id),ids);
});
test('all eleven routes have one h1, real navigation, correct current state, and no unfinished page',()=>{
  assert.deepEqual(routes.map(r=>r.path),['/','/projects/','/experience/','/credentials/','/hackathons/','/leadership/','/organizations/','/gallery/','/experience/top-realty/','/experience/freelance/','/experience/aws-sbg-jru/']);
  for(const route of routes){const html=renderPage(route.path);assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);assert.match(html,/<html lang="en"/);assert.match(html,/href="\/projects\/"/);assert.match(html,/href="\/experience\/"/);assert.match(html,/href="\/credentials\/"/);assert.doesNotMatch(html,/href="#"|javascript:|href="\/practice\//);if(['/projects/','/experience/','/credentials/'].includes(route.path))assert.match(html,new RegExp('href="'+route.path+'"[^>]*aria-current="page"'));}
});
test('projects render all deployed entries and five persistent demo selectors',()=>{
  const html=renderPage('/projects/');for(const p of deployed)assert.ok(html.includes(p.title));
  assert.equal((html.match(/data-demo-tab=/g)||[]).length,5);assert.equal((html.match(/id="demo-player"/g)||[]).length,1);
  assert.match(html,/Video preview pending/);assert.doesNotMatch(html,/<iframe|<video/);
});
test('Home has working overview links, real supplied resume and no missing social destinations',()=>{
  const html=renderPage('/');assert.match(html,/href="\/experience\/"[^>]*>\s*View all/);assert.match(html,/href="\/credentials\/"[^>]*>\s*View all/);assert.match(html,/href="\/assets\/resume.pdf"/);assert.doesNotMatch(html,/href="null"/);assert.match(html,/href="https:\/\/github.com\/migsrvr"/);
  assert.equal((html.match(/data-folio-tab=/g)||[]).length,3);
});
test('unprovided verification destinations remain unavailable instead of fake links',()=>{
  const html=renderPage('/credentials/');assert.equal((html.match(/class="credential-row"/g)||[]).length,6);assert.equal((html.match(/aria-disabled="true"/g)||[]).length,6);assert.doesNotMatch(html,/target="_blank"[^>]*href="#"/);
});
test('content escaping protects HTML text and embedded JSON script boundaries',()=>{
  assert.equal(escapeHtml('<img x="&">'), '&lt;img x=&quot;&amp;&quot;&gt;');
  assert.ok(!safeJson({x:'</script><script>alert(1)</script>'}).includes('</script>'));
});

test('page heading hierarchy does not skip levels',()=>{
  for(const route of routes){let previous=0;for(const match of renderPage(route.path).matchAll(/<h([1-6])(?:\s|>)/g)){const level=Number(match[1]);assert.ok(level<=previous+1,`${route.path} skips from h${previous} to h${level}`);previous=level;}}
});


test('Home exposes three complete community links to real category pages',()=>{
  const html=renderPage('/');
  assert.match(html,/Practice &amp; community/);
  for(const [slug,title] of [['hackathons','Hackathons'],['leadership','Leadership'],['organizations','Organizations']]){
    assert.match(html,new RegExp('<a class="community-link" href="/'+slug+'/"'));
    assert.match(html,new RegExp('id="community-'+slug+'-title">'+title+'</h3>'));
    assert.ok(routes.some(r=>r.path==='/'+slug+'/'));
  }
});
test('community pages reuse plain reading rows and preserve supplied facts',()=>{
  for(const path of ['/hackathons/','/leadership/','/organizations/']){
    const html=renderPage(path);assert.match(html,/class="experience-row"/);assert.match(html,/Back to home/);
    assert.doesNotMatch(html,/deployed-tile|folio-sheet|<p class="experience-description"><\/p>/);
  }
  assert.match(renderPage('/hackathons/'),/Sample entry/);
  assert.match(renderPage('/leadership/'),/Web Development Lead/);
  assert.match(renderPage('/leadership/'),/VP of External Affairs/);
  assert.match(renderPage('/organizations/'),/Notion Campus Leader/);
});

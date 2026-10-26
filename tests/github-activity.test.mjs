import test from 'node:test';
import assert from 'node:assert/strict';

const fixture=Array.from({length:365},(_,i)=>{
  const date=new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10);
  return `<td data-date="${date}" data-level="${i===0?2:0}" id="day-${i}"></td><tool-tip for="day-${i}">${i===0?'3 contributions':'No contributions'} on this date.</tool-tip>`;
}).reverse().join('');

test('GitHub parser joins tooltip counts by ID and sorts the calendar by date',async()=>{
  const {parseGithubCalendar}=await import('../server/github.mjs');
  const days=parseGithubCalendar(fixture);
  assert.equal(days.length,365);assert.deepEqual(days[0],{date:'2025-01-01',count:3,level:2});
  assert.deepEqual(days.at(-1),{date:'2025-12-31',count:0,level:0});
  assert.throws(()=>parseGithubCalendar('<html>Login required</html>'));
  assert.throws(()=>parseGithubCalendar(fixture.replace('3 contributions','Unknown activity')));
});

test('only a plain GitHub profile can trigger a fetch, and failed fetches preserve an honest empty state',async()=>{
  const {withGithubActivity}=await import('../server/github.mjs');
  for(const github of [null,'https://github.com.evil.test/user','https://github.com/user/repo','http://localhost/private']){
    const result=await withGithubActivity({entries:[{collection:'profile',data:{github}}]},{fetcher:()=>{throw Error('Unexpected fetch');}});
    assert.equal(result.githubActivity,null);
  }
  const source={entries:[{collection:'profile',data:{github:'https://github.com/example-user'}}]};
  const result=await withGithubActivity(source,{fetcher:async url=>{
    assert.equal(url,'https://github.com/users/example-user/contributions');return new Response(fixture,{status:200});
  }});
  assert.equal(result.githubActivity.username,'example-user');assert.equal(result.githubActivity.days[0].count,3);
  assert.equal(source.githubActivity,undefined);
  const unavailable=await withGithubActivity(source,{fetcher:async()=>new Response('Not found',{status:404})});
  assert.equal(unavailable.githubActivity,null);
});

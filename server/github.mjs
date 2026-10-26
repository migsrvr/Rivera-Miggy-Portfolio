import {githubUsername} from '../src/activity.mjs';

const attribute=(tag,name)=>tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1];
export function parseGithubCalendar(html){
  const counts=new Map();
  for(const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)){
    const id=attribute(match[1],'for'),text=match[2].replace(/<[^>]*>/g,'').trim();
    const count=/^No contributions\b/.test(text)?0:Number(text.match(/^([\d,]+) contributions?\b/)?.[1]?.replaceAll(',',''));
    if(id&&Number.isSafeInteger(count)&&count>=0)counts.set(id,count);
  }
  const days=new Map();
  for(const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^>]*>/g)){
    const date=attribute(tag,'data-date'),id=attribute(tag,'id'),level=Number(attribute(tag,'data-level')),count=counts.get(id);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(level)||level<0||level>4||count===undefined||days.has(date))throw Error('Unrecognized GitHub calendar data.');
    days.set(date,{date,count,level});
  }
  if(days.size<300||days.size>371)throw Error('Incomplete GitHub calendar.');
  const sorted=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  for(let i=1;i<sorted.length;i++)if(Date.parse(sorted[i].date)-Date.parse(sorted[i-1].date)!==86400000)throw Error('Incomplete GitHub calendar.');
  return sorted;
}

export async function withGithubActivity(source,{fetcher=fetch}={}){
  const snapshot=structuredClone(source),profile=snapshot.entries.find(e=>e.collection==='profile'&&e.visible!==false&&!e.archived);
  const username=githubUsername(profile?.data.github);snapshot.githubActivity=null;
  if(!username)return snapshot;
  try{
    const response=await fetcher(`https://github.com/users/${username}/contributions`,{headers:{accept:'text/html','user-agent':'RiveraPortfolio/1.0'},signal:AbortSignal.timeout(8000),redirect:'error'});
    if(!response.ok)throw Error('GitHub is unavailable.');
    const html=await response.text();if(html.length>2*1024*1024)throw Error('Unexpected calendar size.');
    snapshot.githubActivity={username,fetchedAt:new Date().toISOString(),days:parseGithubCalendar(html)};
  }catch{ /* A missing calendar never blocks publishing the portfolio. */ }
  return snapshot;
}

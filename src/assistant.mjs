import {formatExperiencePeriod,formatExperienceContext} from './experience.mjs';

// Local guide: answers only from the snapshot supplied by the page.
export function answerQuestion(value,content={}){
  const question=String(value||'').trim().slice(0,500);if(!question)return null;
  const q=question.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const {profile={},projects=[],experiences=[],credentials=[],communityPages=[],gallery=[]}=content;
  const name=profile.name||'the portfolio owner',base=content.basePath||'/';
  const href=value=>value?.startsWith('/')&&!value.startsWith('//')?base+value.slice(1):value;
  const reply=(text,links=[])=>({text,links:links.map(l=>({...l,href:href(l.href)}))});
  const route=(label,path)=>[{label,href:path}];
  const sample=items=>items.some(p=>p.sample)?' Entries marked as samples are illustrative.':'';
  const facts=items=>items.map(item=>[item.role,item.organization,formatExperiencePeriod(item),formatExperienceContext(item),item.description].filter(Boolean).join(' — ')).join(' ');
  const project=projects.find(p=>{const title=p.title?.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();return title&&q.includes(title);});
  if(project)return reply([project.title+'.',project.purpose,project.contribution].filter(Boolean).join(' ')+sample([project]),route('Explore '+project.title,'/projects/#'+project.id));
  if(/\b(experience|intern|internship|working|freelance|employ|realty)\b/.test(q))return reply((facts(experiences)||'No experience entries are currently listed.')+sample(experiences),route('View experience','/experience/'));
  const category=/\b(hackathon|hackathons)\b/.test(q)?'hackathons':/\b(lead|leader|leadership)\b/.test(q)?'leadership':/\b(organization|organizations|community|notion)\b/.test(q)?'organizations':null;
  if(category){const page=communityPages.find(p=>p.id===category),items=page?.entries||[];return reply((facts(items)||'No '+category+' entries are currently listed.')+sample(items),route('View '+category,'/'+category+'/'));}
  if(/\b(credential|credentials|certification|certifications|certificate|certificates|award|awards)\b/.test(q))return reply((credentials.length?credentials.map(c=>c.name+' — '+c.provider).join('; ')+'.':'No credentials are currently listed.')+sample(credentials),route('View credentials','/credentials/'));
  if(/\b(photo|photos|gallery|galleries|picture|pictures)\b/.test(q)){const photos=gallery.filter(p=>p.image);return reply(photos.length?photos.map(p=>[p.title,p.caption].filter(Boolean).join(' — ')).join('; ')+'.':'No gallery photos are currently listed.',route('Open gallery','/gallery/'));}
  if(/\b(contact|email|hire|resume|cv|reach|touch)\b/.test(q)){const links=[];if(profile.email)links.push({label:'Email '+name,href:'mailto:'+profile.email});if(profile.resume)links.push({label:'Open résumé',href:profile.resume});return reply(links.length?'Contact details for '+name+' are linked below.':'No contact details are currently listed.',links);}
  if(/\b(project|projects|build|built|work|demo|demos|website|websites|stack|skills|tools)\b/.test(q)){const deployed=projects.filter(p=>p.kind==='deployed').length,recorded=projects.filter(p=>p.kind==='recorded').length;return reply(projects.length?`${deployed} deployed and ${recorded} recorded projects are listed: ${projects.map(p=>p.title).join(', ')}.`+sample(projects):'No projects are currently listed.',route('View projects','/projects/'));}
  if(/\b(about|hello|hi)\b/.test(q)||q===name.toLowerCase()||(/^who (?:is|are) /.test(q)&&q.includes(name.toLowerCase().split(' ')[0])))return reply([profile.intro,profile.current].filter(Boolean).join(' ')||'Profile details are being added.',[{label:'Read experience',href:'/experience/'},{label:'Explore projects',href:'/projects/'}]);
  return reply('I can only answer from the information in this portfolio. Try a project name, experience, credentials, or contact. For details not listed here, ask '+name+' directly.',profile.email?route('Email '+name,'mailto:'+profile.email):[]);
}

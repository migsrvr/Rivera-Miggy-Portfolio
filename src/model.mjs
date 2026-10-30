import {z} from 'zod';
import * as seed from './content.mjs';
import {githubUsername} from './activity.mjs';

export const COLLECTIONS=['profile','projects','experiences','credentials','community','gallery'];
const slug=z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use lowercase letters, numbers, and single hyphens');
const text=z.string().max(20000), optionalText=text.nullish().default(null);
const title=z.string().trim().min(1).max(300);
const cleanPath=value=>/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.split('/').some(p=>p==='.'||p==='..')&&!value.includes('//');
const httpUrl=value=>{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&!/[\u0000-\u0020\\]/.test(value);}catch{return false;}};
const external=text.refine(httpUrl,'Use an HTTP or HTTPS URL').nullish().default(null);
const asset=text.refine(v=>cleanPath(v)||/^asset:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),'Use an existing /assets/ path or uploaded asset token').nullish().default(null);
const documentUrl=text.refine(v=>cleanPath(v)||httpUrl(v)||/^asset:[0-9a-f-]{36}$/i.test(v),'Use a safe asset or HTTP(S) URL').nullish().default(null);
const stage=z.object({title,detail:z.array(text).max(20).default([]),shortTitle:optionalText,shortDetail:optionalText});
const dataSchemas={
  profile:z.object({name:title,fullName:optionalText,role:optionalText,intro:optionalText,current:optionalText,email:z.string().email().nullish().default(null),resume:documentUrl,github:external,linkedin:external,photo:asset,photoAlt:optionalText,photoCaption:optionalText,techStack:z.array(title).max(40).default([])}),
  projects:z.object({title,role:optionalText,purpose:optionalText,contribution:optionalText,tools:z.array(title).max(100).default([]),url:external,repositoryUrl:external,featured:z.boolean().default(false),featureOrder:z.number().finite().default(0),stages:z.array(stage).max(20).default([])}),
  experiences:z.object({role:title,organization:title,description:optionalText,logo:asset,startDate:optionalText,endDate:optionalText,employmentType:optionalText,location:optionalText,workMode:optionalText}),
  credentials:z.object({name:title,provider:title,logo:asset,url:documentUrl,linkLabel:z.preprocess(value=>value??'Verify',title),date:optionalText,category:optionalText}),
  community:z.object({category:z.enum(['hackathons','leadership','organizations']),role:title,organization:optionalText,description:optionalText,logo:asset,startDate:optionalText,endDate:optionalText,employmentType:optionalText,location:optionalText,workMode:optionalText}),
  gallery:z.object({title,caption:optionalText,image:asset,alt:optionalText,date:optionalText}),
};
export const entrySchemas=Object.fromEntries(COLLECTIONS.map(collection=>[collection,z.object({collection:z.literal(collection),id:collection==='profile'?z.literal('profile'):slug,data:dataSchemas[collection],position:z.number().int().min(-100000).max(100000).default(0),visible:z.boolean().default(true),sample:z.boolean().default(false),archived:z.boolean().default(false),updated_at:z.string().optional()})]));
export function validateEntry(collection,entry){if(!entrySchemas[collection])throw new z.ZodError([{code:'custom',path:['collection'],message:'Unknown collection'}]);return entrySchemas[collection].parse(entry);}
const linkSchema=z.object({project_id:slug,experience_id:slug,sample:z.boolean().default(false)});
export function validateDraft(draft){
  const parsed=z.object({entries:z.array(z.unknown()),relationships:z.array(linkSchema).default([])}).parse(draft),keys=new Set(),ids={projects:new Set(),experiences:new Set()};
  for(const input of parsed.entries){const entry=validateEntry(input?.collection,input),key=entry.collection+':'+entry.id;if(keys.has(key))throw new Error('Duplicate entry '+key);keys.add(key);ids[entry.collection]?.add(entry.id);}
  if(parsed.entries.filter(e=>e.collection==='projects'&&e.visible!==false&&!e.archived&&e.data?.featured).length>3)throw new z.ZodError([{code:'custom',path:['data','featured'],message:'Choose at most three visible featured projects.'}]);
  const links=new Set();for(const link of parsed.relationships){if(!ids.projects.has(link.project_id)||!ids.experiences.has(link.experience_id))throw new Error('Relationship target does not exist');const key=link.project_id+':'+link.experience_id;if(links.has(key))throw new Error('Duplicate relationship');links.add(key);}
}
export function createSeedDraft(){
  const entries=[],relationships=[];
  const add=(collection,id,data,position,sample=false)=>entries.push(validateEntry(collection,{collection,id,data,position,visible:true,archived:false,sample}));
  add('profile','profile',{...seed.profile,photoCaption:'Speaking at a general assembly.'},0);
  seed.deployed.forEach((project,position)=>{
    const feature=seed.featured.find(p=>p.id===project.id);add('projects',project.id,{...project,tools:project.tools||feature?.tools.split(' · ')||[],featured:!!feature,featureOrder:seed.featured.findIndex(p=>p.id===project.id),stages:feature?.stages||[]},position);
  });
  seed.experiences.forEach(({id,projectIds,...data},position)=>{add('experiences',id,data,position);projectIds.forEach(project_id=>relationships.push({project_id,experience_id:id,sample:false}));});
  seed.credentials.forEach(({id,sample,...data},position)=>add('credentials',id,data,position,!!sample));
  seed.communityPages.forEach(page=>page.entries.forEach((data,position)=>add('community',page.id+'-'+(position+1),{...data,category:page.id},position,!!page.sampleNote)));
  seed.gallery.forEach(({id,...data},position)=>add('gallery',id,data,position));
  return {entries,relationships};
}
const categories=[['hackathons','Hackathons','Hackathon experiences, projects, and collaborations.'],['leadership','Leadership','Student leadership and development responsibilities.'],['organizations','Organizations','Student groups and campus communities.']];
const activitySchema=z.object({username:z.string().max(39),fetchedAt:z.string().datetime(),days:z.array(z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))),count:z.number().int().min(0).max(100000),level:z.number().int().min(0).max(4)})).min(1).max(371)});
export function toContent(draft){
  validateDraft(draft);
  const entries=draft.entries.map(e=>validateEntry(e.collection,e)).filter(e=>e.visible&&!e.archived).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
  const select=collection=>entries.filter(e=>e.collection===collection).map(e=>({...e.data,id:e.id,sample:e.sample}));
  const profile=select('profile')[0]||{name:'',fullName:'',role:'',intro:'',current:'',email:'',resume:null,photo:null};
  const parsedActivity=activitySchema.safeParse(draft.githubActivity);
  const githubActivity=parsedActivity.success&&parsedActivity.data.username.toLowerCase()===githubUsername(profile.github)?.toLowerCase()?parsedActivity.data:null;
  const projects=select('projects'),experiences=select('experiences');
  const credentials=select('credentials'),community=select('community');
  const communityPages=categories.map(([id,title,intro])=>{const items=community.filter(e=>e.category===id).map(({id:entryId,...e})=>({...e,entryId}));return {id,path:'/'+id+'/',title,intro,entries:items,summary:items.map(e=>e.role).join(' · ')||'Details will be added here.',sampleNote:items.some(e=>e.sample)?'Sample entry. Event details will be added here.':null};});
  const content={profile,projects,githubActivity,deployed:projects,featured:projects.filter(p=>p.featured).sort((a,b)=>a.featureOrder-b.featureOrder).map(p=>({...p,summary:p.role||p.purpose||'',tools:p.tools.join(' · ')})),experiences,credentials,communityPages,basePath:'/'};
  content.counts=Object.fromEntries(COLLECTIONS.filter(c=>c!=='gallery').map(c=>[c,select(c).length]));
  content.routes=getRoutes(content);
  content.assistantContent={profile,projects,experiences,credentials,communityPages,basePath:content.basePath};
  return content;
}
export function getRoutes(content){
  const name=content.profile?.name||'Portfolio';
  return [{path:'/',title:name+' — '+(content.profile?.role||'Portfolio'),description:content.profile?.intro||'Selected work and experience.'},...[
    ['/projects/','Projects','Live projects and code.'],['/experience/','Experience','Internships, independent work, and student leadership.'],['/credentials/','Credentials','Certifications, speaking, hackathons, and other recognition.'],
    ...(content.communityPages||[]).map(p=>[p.path,p.title,p.intro]),
  ].map(([path,title,description])=>({path,title:title+' — '+name,description}))];
}

import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {loadConfig} from './config.mjs';
import {OwnerAuth} from './auth.mjs';
import {createDatabase} from './database.mjs';
import {Publisher} from './publisher.mjs';
import {createRepository} from './repository.mjs';
import {inspectUpload} from './uploads.mjs';
import {AppError} from './errors.mjs';
import {COLLECTIONS,validateEntry,validateDraft} from '../src/model.mjs';

const id=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const assetId=z.string().uuid();
const linkSchema=z.object({project_id:id,experience_id:id,sample:z.boolean().default(false)});
const fileTypes={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.jfif':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4','.webm':'video/webm'};
function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function validateSnapshot(draft){try{validateDraft(draft);}catch(error){if(error instanceof z.ZodError)throw error;throw new AppError(422,error.message);}}

export async function createApp({config=loadConfig(),database,auth,publisher=new Publisher({root:config.root}),repository=createRepository,logger=false}={}){
  const ownsDatabase=!database&&config.configured;
  database=database||(config.configured?createDatabase(config):null);
  auth=auth||new OwnerAuth(config,database);
  const app=Fastify({logger:logger?{level:'info',redact:['req.headers.cookie','req.headers.authorization','req.headers["x-csrf-token"]','res.headers["set-cookie"]']}:false,bodyLimit:1024*1024,requestTimeout:120000});
  await publisher.init();publisher.onError=error=>app.log.error({err:{name:error.name,message:error.message}},'Publication failed');
  await app.register(cookie);
  await app.register(multipart,{limits:{files:1,fields:1,fileSize:20*1024*1024,parts:2}});
  await app.register(rateLimit,{global:false,max:10,timeWindow:'1 minute'});
  await app.register(staticFiles,{root:path.join(config.root,'dist'),serve:false});
  app.decorateRequest('ownerContext',null);
  app.decorateRequest('repository',null);
  app.addHook('onRequest',async(request,reply)=>{
    const pathname=request.url.split('?')[0];
    reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','same-origin');
    if(config.secure)reply.header('Strict-Transport-Security','max-age=31536000');
    if(pathname.startsWith('/admin')||pathname.startsWith('/api/admin')){
      reply.header('Cache-Control','no-store').header('X-Robots-Tag','noindex, nofollow');
      reply.header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self' https://www.youtube-nocookie.com; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
    }
    const api=pathname.startsWith('/api/admin/'),preview=pathname.startsWith('/admin/preview/');
    if(api&&!['GET','HEAD'].includes(request.method)&&request.headers.origin!==config.origin)throw new AppError(403,'This action must come from the portfolio admin.');
    if((api&&pathname!=='/api/admin/login')||preview){
      request.ownerContext=await auth.authenticate(request,reply);
      request.repository=repository(database,{originalsRoot:config.originalsRoot||path.join(config.root,'.local/originals')});
      if(api&&!['GET','HEAD'].includes(request.method)&&!equal(request.headers['x-csrf-token'],request.ownerContext.csrf))throw new AppError(403,'Your form session changed. Sign in again before saving.');
    }
  });
  app.setErrorHandler((error,request,reply)=>{
    if(error instanceof z.ZodError){const fields={};for(const issue of error.issues){const key=issue.path.filter(p=>p!=='data').join('.')||'form';fields[key]=issue.message;}return reply.code(422).send({error:{message:'Check the highlighted fields.',fields}});}
    const status=error.statusCode||error.status||(error.code==='23503'||error.code==='23505'?422:500);
    if(status>=500){request.log.error({err:{name:error.name,message:error.message,code:error.code}},'Admin request failed');return reply.code(status).send({error:{message:error instanceof AppError?error.message:'The backend could not complete this request. Try again; your draft has not been discarded.'}});}
    reply.code(status).send({error:{message:status===429?'Too many attempts. Wait a minute and try again.':error.message,fields:error.fields}});
  });
  app.get('/api/health',async()=>({ok:true,adminConfigured:config.configured}));
  app.post('/api/admin/login',{config:{rateLimit:{max:8,timeWindow:'1 minute'}}},async(request,reply)=>{
    const body=z.object({email:z.string().email().max(320),password:z.string().min(1).max(1024)}).parse(request.body);return auth.login(body.email,body.password,reply);
  });
  app.get('/api/admin/session',async request=>({user:request.ownerContext.user,csrf:request.ownerContext.csrf}));
  app.post('/api/admin/logout',async(request,reply)=>{await auth.logout(request.ownerContext,reply);return{ok:true};});
  app.get('/api/admin/bootstrap',async request=>({...await request.repository.getDraft(),releases:await request.repository.listReleases(),user:request.ownerContext.user,csrf:request.ownerContext.csrf,activeReleaseId:publisher.activeId(),configured:true}));
  app.put('/api/admin/content/:collection/:id',async request=>{
    const collection=z.enum(COLLECTIONS).parse(request.params.collection),key=id.parse(request.params.id);
    if(request.body?.id!==key||request.body?.collection!==collection)throw new AppError(422,'Entry identity must match its URL.');
    const entry=validateEntry(collection,request.body),draft=await request.repository.getDraft();
    const previous=draft.entries.findIndex(item=>item.collection===collection&&item.id===key);
    if(previous<0)draft.entries.push(entry);else draft.entries[previous]=entry;validateSnapshot(draft);
    return{entry:await request.repository.saveEntry(collection,entry)};
  });
  app.post('/api/admin/content/:collection/:id/archive',async request=>{
    const collection=z.enum(COLLECTIONS).parse(request.params.collection),key=id.parse(request.params.id),{archived}=z.object({archived:z.boolean()}).parse(request.body);
    const draft=await request.repository.getDraft(),entry=draft.entries.find(e=>e.collection===collection&&e.id===key);if(!entry)throw new AppError(404,'Entry not found.');entry.archived=archived;validateSnapshot(draft);
    return{entry:await request.repository.archiveEntry(collection,key,archived)};
  });
  app.put('/api/admin/relationships',async request=>{
    const {relationships}=z.object({relationships:z.array(linkSchema).max(10000)}).parse(request.body);const draft=await request.repository.getDraft();draft.relationships=relationships;validateSnapshot(draft);return{relationships:await request.repository.setRelationships(relationships)};
  });
  app.post('/api/admin/assets',async request=>{
    let metadata=null,uploadedBytes=null,visibility='private';
    for await(const part of request.parts()){
      if(part.type==='file'){if(metadata)throw new AppError(422,'Upload one file at a time.');const bytes=await part.toBuffer();metadata=await inspectUpload(bytes,part.filename);uploadedBytes=bytes;}
      else if(part.fieldname==='visibility')visibility=z.enum(['private','public']).parse(part.value);
    }
    if(!metadata)throw new AppError(422,'Choose a file to upload.');metadata.visibility=visibility;await request.repository.uploadAsset(metadata.storage_path,uploadedBytes,metadata.mime_type);return{asset:await request.repository.saveAsset(metadata)};
  });
  app.patch('/api/admin/assets/:id',async request=>{
    const patch=z.object({visibility:z.enum(['private','public']).optional(),archived:z.boolean().optional()}).strict().parse(request.body);return{asset:await request.repository.updateAsset(assetId.parse(request.params.id),patch)};
  });
  app.get('/api/admin/assets/:id/file',async(request,reply)=>{
    const key=assetId.parse(request.params.id),asset=(await request.repository.listAssets()).find(a=>a.id===key);if(!asset)throw new AppError(404,'Asset not found.');
    const data=await request.repository.downloadAsset(asset.storage_path);reply.type(asset.mime_type);if(asset.mime_type==='application/pdf')reply.header('Content-Disposition','attachment; filename="certificate.pdf"');return reply.send(data);
  });
  app.post('/api/admin/preview',async request=>publisher.preview(request.repository));
  app.post('/api/admin/publish',async(request,reply)=>reply.code(202).send({release:await publisher.publish(request.repository)}));
  app.get('/api/admin/releases',async request=>({releases:await request.repository.listReleases(),activeReleaseId:publisher.activeId()}));
  app.post('/api/admin/releases/:id/activate',async request=>publisher.activate(request.repository,assetId.parse(request.params.id)));
  app.get('/api/admin/export',async(request,reply)=>{reply.header('Content-Disposition','attachment; filename="portfolio-draft.json"');return{schemaVersion:1,...await request.repository.getDraft()};});

  async function serve(request,reply,root,rawPath){
    let decoded;try{decoded=decodeURIComponent(rawPath);}catch{throw new AppError(400,'Invalid path.');}
    if(decoded.includes('\0')||decoded.includes('\\'))throw new AppError(400,'Invalid path.');
    const folder=path.resolve(root),file=path.resolve(folder,'.'+decoded);
    if(file!==folder&&!file.startsWith(folder+path.sep))throw new AppError(403,'Invalid path.');
    const retiredExperience=/^\/experience\/(?!index\.html$).+/i.test(path.posix.normalize(decoded));
    let target=file,info;if(!retiredExperience)try{info=await stat(target);}catch{}
    if(info?.isDirectory()){if(!decoded.endsWith('/'))return reply.redirect(request.url.split('?')[0]+'/');target=path.join(target,'index.html');}
    try{if(retiredExperience)throw new AppError(404,'Page not found.');const data=await readFile(target);reply.type(fileTypes[path.extname(target)]||'application/octet-stream');if(!request.url.startsWith('/admin'))reply.header('Cache-Control','no-cache');return reply.send(data);}catch{
      reply.code(404);try{return reply.type('text/html').send(await readFile(path.join(folder,'404.html')));}catch{return reply.send({error:{message:'Page not found.'}});}
    }
  }
  app.get('/admin',async(request,reply)=>reply.redirect('/admin/'));
  app.get('/admin/preview/:id/*',async(request,reply)=>{const folder=publisher.previewFolder(request.params.id);if(!folder)throw new AppError(404,'This preview has expired. Create a new preview.');return serve(request,reply,folder,'/'+request.params['*']);});
  app.get('/admin/*',async(request,reply)=>serve(request,reply,path.join(config.root,'admin'),'/'+(request.params['*']||'index.html')));
  app.get('/',async(request,reply)=>serve(request,reply,publisher.activeRoot(),'/'));
  app.get('/*',async(request,reply)=>{if(request.url.startsWith('/api/'))throw new AppError(404,'Endpoint not found.');return serve(request,reply,publisher.activeRoot(),request.url.split('?')[0]);});
  app.addHook('onClose',async()=>{await publisher.waitForIdle();if(ownsDatabase)await database.close();});
  app.decorate('publisher',publisher);
  return app;
}

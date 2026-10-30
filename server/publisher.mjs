import {mkdir,readFile,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {build as buildSite} from '../scripts/build.mjs';
import {toContent,validateDraft} from '../src/model.mjs';
import {AppError} from './errors.mjs';
import {withGithubActivity} from './github.mjs';
// Gallery records are retained for admin compatibility and do not contribute public assets.
const fields={profile:['photo','resume'],experiences:['logo'],credentials:['logo','url'],community:['logo']};
const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function resolveAssets(source,repo,allowPrivate=false){
  const draft=structuredClone(source),assetFiles=[],resolved=new Map();
  for(const entry of draft.entries){if(entry.archived||entry.visible===false)continue;for(const field of fields[entry.collection]||[]){
    const value=entry.data[field];if(typeof value!=='string'||!value.startsWith('asset:'))continue;
    const id=value.slice(6),asset=draft.assets?.find(a=>a.id===id);
    if(!asset||asset.archived)throw new AppError(422,`The asset for ${entry.id}.${field} is missing or archived.`,{[field]:'Choose an available asset.'});
    if(!allowPrivate&&asset.visibility!=='public')throw new AppError(422,`Allow the asset for ${entry.id}.${field} on the public portfolio before publishing.`,{[field]:'Asset is private.'});
    const ext=extensions[asset.mime_type];if(!ext||!uuid.test(id))throw new AppError(422,'Unsupported asset metadata.');
    const target=`/assets/uploads/${id}.${ext}`;entry.data[field]=target;
    if(!resolved.has(id)){const bytes=await repo.downloadAsset(asset.storage_path);if(bytes.length!==asset.size)throw new AppError(422,'An uploaded asset is incomplete. Upload it again.');assetFiles.push({path:target,bytes});resolved.set(id,target);}
  }}
  return{draft,assetFiles};
}
export class Publisher {
  constructor({root,build=buildSite,convert=toContent,validate=validateDraft}){this.root=path.resolve(root);this.build=build;this.convert=convert;this.validate=validate;this.stateRoot=path.join(this.root,'.local');this.releaseRoot=path.join(this.stateRoot,'releases');this.previewRoot=path.join(this.stateRoot,'previews');this.pointer=path.join(this.stateRoot,'active-release.json');this.currentId=null;this.currentRoot=path.join(this.root,'dist');this.busy=false;this.job=Promise.resolve();this.previews=new Map();}
  async init(){await mkdir(this.releaseRoot,{recursive:true});await mkdir(this.previewRoot,{recursive:true});try{const {id}=JSON.parse(await readFile(this.pointer,'utf8'));if(uuid.test(id)){const folder=path.join(this.releaseRoot,id);await stat(path.join(folder,'index.html'));this.currentId=id;this.currentRoot=folder;}}catch{}return this;}
  activeRoot(){return this.currentRoot;}
  activeId(){return this.currentId;}
  async waitForIdle(){await this.job;}
  async render(repo,snapshot,outputDir,basePath,allowPrivate){this.validate(snapshot);const {draft,assetFiles}=await resolveAssets(snapshot,repo,allowPrivate);const content=this.convert(draft);await this.build({content,outputDir,basePath,assetFiles});}
  async preview(repo){const snapshot=await withGithubActivity(await repo.getDraft()),id=randomUUID(),folder=path.join(this.previewRoot,id);await this.render(repo,snapshot,folder,`/admin/preview/${id}/`,true);this.previews.set(id,folder);return{url:`/admin/preview/${id}/`};}
  previewFolder(id){return this.previews.get(id);}
  async publish(repo){
    if(this.busy)throw new AppError(409,'A publish is already running. Wait for it to finish.');this.busy=true;
    try{const snapshot=await withGithubActivity(await repo.getDraft());this.validate(snapshot);const release=await repo.createRelease(snapshot);if(!uuid.test(release.id))throw Error('Invalid release ID.');
      this.job=(async()=>{try{await this.render(repo,snapshot,path.join(this.releaseRoot,release.id),'/',false);await repo.updateRelease(release.id,{state:'ready',error:null});await this.switchTo(release.id);await repo.updateRelease(release.id,{published_at:new Date().toISOString()}).catch(error=>this.onError?.(error));}catch(error){this.lastError=error;this.onError?.(error);await repo.updateRelease(release.id,{state:'failed',error:error.statusCode?error.message:'Publication failed. Check the server log and try again.'}).catch(()=>{});}finally{this.busy=false;}})();
      return release;
    }catch(error){this.busy=false;throw error;}
  }
  async switchTo(id){if(!uuid.test(id))throw new AppError(422,'Invalid release.');const folder=path.join(this.releaseRoot,id);try{await stat(path.join(folder,'index.html'));}catch{throw new AppError(409,'This release has no local build. Publish a new release.');}const temp=path.join(this.stateRoot,`active-${randomUUID()}.tmp`);await writeFile(temp,JSON.stringify({id}));await rename(temp,this.pointer);this.currentId=id;this.currentRoot=folder;}
  async activate(repo,id){if(this.busy)throw new AppError(409,'A publish is already running.');const release=await repo.getRelease(id);if(!release||release.state!=='ready')throw new AppError(409,'Only a completed release can be restored.');await this.switchTo(id);return{activeReleaseId:id};}
}

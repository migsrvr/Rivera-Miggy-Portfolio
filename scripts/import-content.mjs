import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {LocalOriginals} from '../server/storage.mjs';
import {validateDraft} from '../src/model.mjs';

export async function contentIsEmpty(database){
  const result=await database.query('select not (exists(select 1 from portfolio.content_entries) or exists(select 1 from portfolio.project_experiences) or exists(select 1 from portfolio.assets) or exists(select 1 from portfolio.releases)) as empty');
  return result.rows[0].empty;
}
export async function insertContent(tx,source){
  for(const entry of source.entries)await tx.query('insert into portfolio.content_entries(collection,id,data,position,visible,sample,archived,updated_at) values ($1,$2,$3,$4,$5,$6,$7,coalesce($8::timestamptz,now()))',[entry.collection,entry.id,JSON.stringify(entry.data),entry.position??0,entry.visible??true,entry.sample??false,entry.archived??false,entry.updated_at??null]);
  for(const link of source.relationships)await tx.query('insert into portfolio.project_experiences(project_id,experience_id,sample) values ($1,$2,$3)',[link.project_id,link.experience_id,link.sample??false]);
  for(const asset of source.assets)await tx.query('insert into portfolio.assets(id,storage_path,original_name,mime_type,size,visibility,archived,created_at) values ($1,$2,$3,$4,$5,$6,$7,coalesce($8::timestamptz,now()))',[asset.id,asset.storage_path,asset.original_name,asset.mime_type,asset.size,asset.visibility??'private',asset.archived??false,asset.created_at??null]);
  // Final states are inserted directly, retaining immutable historical snapshots.
  for(const release of source.releases)await tx.query('insert into portfolio.releases(id,state,snapshot,error,created_at,published_at) values ($1,$2,$3,$4,coalesce($5::timestamptz,now()),$6)',[release.id,release.state,JSON.stringify(release.snapshot),release.error??null,release.created_at??null,release.published_at??null]);
}
export async function lockContent(tx){await tx.query('lock table portfolio.content_entries,portfolio.project_experiences,portfolio.assets,portfolio.releases in share row exclusive mode');}
export async function importContent(database,file,{originalsRoot=path.resolve('.local/originals')}={}){
  const source=JSON.parse(await readFile(file,'utf8'));
  if(source?.schemaVersion!==1||!['entries','relationships','assets','releases'].every(key=>Array.isArray(source[key])))throw new Error('Unsupported content export; schemaVersion 1 and all content arrays are required.');
  validateDraft(source);
  return database.transaction(async tx=>{
    await lockContent(tx);
    if(!await contentIsEmpty(tx))throw new Error('Import requires an empty target content store. Existing content was preserved.');
    if(source.assets.length){
      const originals=new LocalOriginals(path.join(path.dirname(path.resolve(file)),'originals'));
      const target=new LocalOriginals(originalsRoot);
      for(const asset of source.assets){
        const bytes=await originals.get(asset.storage_path);
        if(bytes.length!==Number(asset.size))throw new Error('Exported original size does not match asset metadata.');
        try{await target.put(asset.storage_path,bytes);}catch(error){
          if(error.code!=='EEXIST')throw error;
          if(!(await target.get(asset.storage_path)).equals(bytes))throw new Error('An existing private original differs from the export.');
        }
      }
    }
    await insertContent(tx,source);
    return Object.fromEntries(['entries','relationships','assets','releases'].map(key=>[key,source[key].length]));
  });
}
async function main(){
  if(process.argv.length!==3)throw new Error('Usage: node scripts/import-content.mjs <export.json>');
  const {prepareEnvironment}=await import('./local-setup.mjs');const {createDatabase}=await import('../server/database.mjs');const config=await prepareEnvironment(),database=createDatabase(config);
  try{const counts=await importContent(database,path.resolve(process.argv[2]),{originalsRoot:path.join(config.root,'.local','originals')});console.log(`Imported ${counts.entries} entries, ${counts.relationships} relationships, ${counts.assets} assets, and ${counts.releases} releases.`);}finally{await database.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{console.error('Content import failed. Verify the export, private originals, migrations, and empty target. Existing database content was preserved.');process.exitCode=1;});

import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createSeedDraft,validateDraft} from '../src/model.mjs';
import {contentIsEmpty,insertContent,lockContent} from './import-content.mjs';
export async function seedContent(database){
  const draft=createSeedDraft();validateDraft(draft);
  return database.transaction(async tx=>{
    await lockContent(tx);
    if(!await contentIsEmpty(tx))return {seeded:false,entries:0,relationships:0};
    await insertContent(tx,{...draft,assets:[],releases:[]});
    return {seeded:true,entries:draft.entries.length,relationships:draft.relationships.length};
  });
}
async function main(){
  const {prepareEnvironment}=await import('./local-setup.mjs');const {createDatabase}=await import('../server/database.mjs');const database=createDatabase(await prepareEnvironment());
  try{const result=await seedContent(database);console.log(result.seeded?`Seeded ${result.entries} draft entries and ${result.relationships} relationships.`:'Existing content preserved; nothing was seeded.');}finally{await database.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{console.error('Content seed failed. Check DATABASE_URL and database migrations.');process.exitCode=1;});

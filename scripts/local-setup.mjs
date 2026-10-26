import {appendFile,readFile,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {migrate} from './migrate.mjs';
async function optionalFile(file){try{return await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')return '';throw error;}}
function parseEnvironment(source){
  const values={};
  for(const line of source.split(/\r?\n/)){
    const match=line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(!match)continue;
    let value=match[2];
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    values[match[1]]=value;
  }
  return values;
}
export async function prepareEnvironment(root=process.cwd(),env=process.env){
  const localFile=path.join(root,'.env.local'),local=await optionalFile(localFile);
  const values={...parseEnvironment(await optionalFile(path.join(root,'.env'))),...parseEnvironment(local),...env};
  if(!values.DATABASE_URL)throw new Error('Configure server-only DATABASE_URL in .env, .env.local, or the environment first.');
  let secret=values.SESSION_SECRET;
  if(!secret){secret=randomBytes(48).toString('hex');await appendFile(localFile,`${local&&!local.endsWith('\n')?'\n':''}SESSION_SECRET=${secret}\n`,{mode:0o600});}
  if(secret.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters. Existing secrets are never replaced automatically.');
  return {root,databaseUrl:values.DATABASE_URL,secret};
}
export async function localSetup({root=process.cwd(),database,env=process.env}={}){
  const config=await prepareEnvironment(root,env),ownsDatabase=!database;
  if(!database){const {createDatabase}=await import('../server/database.mjs');database=createDatabase(config);}
  try{
    await mkdir(path.join(root,'.local'),{recursive:true});
    await migrate(database);
    const owner=(await database.query('select id from portfolio.owner where singleton=true')).rows[0];
    if(!owner){const {setupOwner}=await import('./setup-owner.mjs');const credentials=await optionalFile(path.join(root,'.local','owner-credentials.json'));await setupOwner(database,{root,mode:credentials?'preserve':'generate'});}
    const {contentIsEmpty,importContent}=await import('./import-content.mjs');
    let content='preserved';
    if(await contentIsEmpty(database)){
      const file=path.join(root,'.local','migration','supabase-export.json');
      if(await optionalFile(file)){await importContent(database,file,{originalsRoot:path.join(root,'.local','originals')});content='imported';}
      else{const {seedContent}=await import('./seed-content.mjs');await seedContent(database);content='seeded';}
    }
    return {owner:owner?'preserved':'configured',content};
  }finally{if(ownsDatabase)await database.close();}
}
async function main(){await localSetup();console.log('Setup complete. Existing content and owner credentials were preserved. Run npm run dev.');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{console.error('Setup did not complete. Configure DATABASE_URL and a valid SESSION_SECRET, then retry.');process.exitCode=1;});

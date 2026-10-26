import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function setupOwner(database,{root=process.cwd(),mode='interactive',email='owner@portfolio.local',password}={}){
  if(!['interactive','generate','preserve'].includes(mode))throw new Error('Unknown owner setup mode.');
  const credentialsFile=path.join(root,'.local','owner-credentials.json');
  if(mode==='preserve')({email,password}=JSON.parse(await readFile(credentialsFile,'utf8')));
  if(mode==='generate')password=randomBytes(32).toString('base64url');
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<12)throw new Error('Owner email and a password of at least 12 characters are required.');
  email=email.trim().toLowerCase();
  const {hashPassword}=await import('../server/auth.mjs');
  const hash=await hashPassword(password);
  return database.transaction(async tx=>{
    await tx.query('select pg_advisory_xact_lock(19786263,2)');
    const owner=(await tx.query('select id from portfolio.owner where singleton=true for update')).rows[0];
    if(mode==='generate'){
      if(owner)throw new Error('An owner already exists; generation would replace credentials. Use --preserve or interactive reset.');
      await mkdir(path.dirname(credentialsFile),{recursive:true});
      await writeFile(credentialsFile,`${JSON.stringify({email,password},null,2)}\n`,{mode:0o600,flag:'wx'});
    }
    const id=owner?.id||randomUUID();
    await tx.query('insert into portfolio.owner(singleton,id,email,password_hash) values (true,$1,$2,$3) on conflict(singleton) do update set email=excluded.email,password_hash=excluded.password_hash,updated_at=now()',[id,email,hash]);
    await tx.query('delete from portfolio.sessions where owner_id=$1',[id]);
    return {id,email};
  });
}
function hiddenPassword(prompt){
  if(!stdin.isTTY)throw new Error('Interactive setup requires a terminal. Use --preserve or --generate.');
  stdout.write(prompt);stdin.setRawMode(true);stdin.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    const finish=error=>{stdin.off('data',receive);stdin.setRawMode(false);stdin.pause();stdout.write('\n');if(error)reject(error);else resolve(value);};
    const receive=buffer=>{for(const character of buffer.toString('utf8')){if(character==='\u0003')return finish(new Error('Owner setup cancelled.'));if(character==='\r'||character==='\n')return finish();if(character==='\u007f'||character==='\b')value=value.slice(0,-1);else if(character>=' ')value+=character;}};
    stdin.on('data',receive);
  });
}
async function main(){
  const args=process.argv.slice(2);
  if(args.length>1||args.some(arg=>!['--generate','--preserve'].includes(arg)))throw new Error('Usage: node scripts/setup-owner.mjs [--generate|--preserve]');
  const mode=args[0]?.slice(2)||'interactive';
  let email,password;
  if(mode==='interactive'){
    const input=createInterface({input:stdin,output:stdout});email=(await input.question('Owner email [owner@portfolio.local]: ')).trim()||'owner@portfolio.local';input.close();
    password=await hiddenPassword('Password (hidden, at least 12 characters): ');if(password!==await hiddenPassword('Confirm password (hidden): '))throw new Error('Passwords did not match.');
  }
  const {prepareEnvironment}=await import('./local-setup.mjs');const {createDatabase}=await import('../server/database.mjs');const database=createDatabase(await prepareEnvironment());
  try{await setupOwner(database,{mode,email,password});console.log(mode==='generate'?'Owner configured. Credentials saved privately in .local/owner-credentials.json.':'Owner configured; previous sessions revoked.');}finally{await database.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{console.error('Owner setup failed. Check credentials, DATABASE_URL, and database migrations.');process.exitCode=1;});

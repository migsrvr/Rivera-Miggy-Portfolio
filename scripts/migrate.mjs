import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const defaultMigrationsRoot=fileURLToPath(new URL('../db/migrations/',import.meta.url));
export async function migrate(database,{migrationsRoot=defaultMigrationsRoot}={}) {
  const names=(await readdir(migrationsRoot)).filter(name=>/^\d[\w.-]*\.sql$/.test(name)).sort();
  if(!names.length)throw new Error('No PostgreSQL migrations found.');
  const migrations=await Promise.all(names.map(async name=>{const sql=await readFile(path.join(migrationsRoot,name),'utf8');return {name,sql,checksum:createHash('sha256').update(sql).digest('hex')};}));
  return database.transaction(async tx=>{
    await tx.query('select pg_advisory_xact_lock(19786263,1)');
    await tx.query('create schema if not exists portfolio');
    await tx.query('revoke all on schema portfolio from public');
    await tx.query('create table if not exists portfolio.schema_migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now())');
    const applied=new Map((await tx.query('select name,checksum from portfolio.schema_migrations')).rows.map(row=>[row.name,row.checksum]));
    const available=new Set(migrations.map(item=>item.name));
    for(const name of applied.keys())if(!available.has(name))throw new Error(`Applied migration is missing: ${name}`);
    const added=[];
    for(const migration of migrations){
      if(applied.has(migration.name)){if(applied.get(migration.name)!==migration.checksum)throw new Error(`Applied migration checksum differs: ${migration.name}`);continue;}
      await tx.query(migration.sql);
      await tx.query('insert into portfolio.schema_migrations(name,checksum) values ($1,$2)',[migration.name,migration.checksum]);
      added.push(migration.name);
    }
    return added;
  });
}
async function main(){
  const {prepareEnvironment}=await import('./local-setup.mjs');
  const {createDatabase}=await import('../server/database.mjs');
  const database=createDatabase(await prepareEnvironment());
  try{const added=await migrate(database);console.log(`Database migrations complete (${added.length} applied).`);}finally{await database.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{console.error('Database migration failed. Check the server connection and migration files.');process.exitCode=1;});

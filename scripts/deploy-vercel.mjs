// Deploys the active published release as a static site to Vercel.
// Publish in the admin first; this ships exactly what visitors see on localhost.
//   npm run deploy            production deploy
//   npm run deploy -- --preview   preview deploy
import {cp,mkdir,readdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),project='miggy-rivera';
const site=path.join(root,'.local','vercel-site'),preview=process.argv.includes('--preview');
// .jfif logos are JPEGs; Vercel would otherwise serve them as application/octet-stream.
const config={cleanUrls:false,trailingSlash:true,headers:[{source:'/(.*)\\.jfif',headers:[{key:'Content-Type',value:'image/jpeg'}]},{source:'/(.*)\\.mjs',headers:[{key:'Content-Type',value:'text/javascript; charset=utf-8'}]}]};

function run(args){
  return new Promise((resolve,reject)=>{
    const child=spawn('npx',['vercel',...args],{cwd:site,stdio:'inherit',shell:process.platform==='win32'});
    child.on('exit',code=>code===0?resolve():reject(new Error(`vercel ${args[0]} exited with ${code}`)));
  });
}

const {id}=JSON.parse(await readFile(path.join(root,'.local','active-release.json'),'utf8'));
if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('No valid active release. Publish from the admin first.');
const release=path.join(root,'.local','releases',id);
await stat(path.join(release,'index.html'));

// Refresh the staging folder but keep its .vercel project link.
await mkdir(site,{recursive:true});
for(const entry of await readdir(site))if(entry!=='.vercel')await rm(path.join(site,entry),{recursive:true,force:true});
await cp(release,site,{recursive:true});
await writeFile(path.join(site,'vercel.json'),JSON.stringify(config,null,2)+'\n');
console.log(`Staged release ${id} in ${site}`);

try{await stat(path.join(site,'.vercel','project.json'));}
catch{await run(['link','--yes','--project',project]);}
await run(['deploy','--yes',...(preview?[]:['--prod'])]);

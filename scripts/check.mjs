import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
let count=0;
async function check(folder){for(const item of await readdir(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())await check(file);else if(file.endsWith('.mjs')){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);count++;}}}
for(const dir of ['src','server','scripts','admin','tests'])await check(dir);
console.log(`Syntax checked ${count} JavaScript modules.`);

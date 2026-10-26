import {mkdir,readFile,writeFile,realpath,lstat} from 'node:fs/promises';
import path from 'node:path';
import {AppError} from './errors.mjs';

export class LocalOriginals {
  constructor(root){this.root=path.resolve(root);}
  async target(key){
    if(typeof key!=='string'||!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.[a-zA-Z0-9]+$/.test(key))throw new AppError(422,'Invalid original file path.');
    await mkdir(this.root,{recursive:true,mode:0o700});
    const root=await realpath(this.root),parts=key.split('/'),name=parts.pop();let folder=root;
    for(const part of parts){folder=path.join(folder,part);await mkdir(folder,{mode:0o700}).catch(error=>{if(error.code!=='EEXIST')throw error;});const info=await lstat(folder);if(info.isSymbolicLink()||!info.isDirectory())throw new AppError(422,'Invalid original file directory.');}
    const target=path.join(folder,name);try{if((await lstat(target)).isSymbolicLink())throw new AppError(422,'Invalid original file path.');}catch(error){if(error.code!=='ENOENT')throw error;}
    return target;
  }
  async put(key,bytes){if(!Buffer.isBuffer(bytes))throw new TypeError('Original bytes must be a Buffer.');await writeFile(await this.target(key),bytes,{flag:'wx',mode:0o600});}
  async get(key){try{return await readFile(await this.target(key));}catch(error){if(error.code==='ENOENT')throw new AppError(404,'Original file not found.');throw error;}}
}

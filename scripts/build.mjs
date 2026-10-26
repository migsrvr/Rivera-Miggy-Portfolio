import {mkdir,cp,writeFile,readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createSeedDraft,toContent,getRoutes} from '../src/model.mjs';
import {renderPage,escapeHtml} from '../src/render.mjs';

export async function build({content=toContent(createSeedDraft()),outputDir,basePath='/',assetFiles=[]}={}){
  if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath))throw new Error('Invalid basePath');
  const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),dist=path.resolve(outputDir||path.join(root,'dist'));
  const uploads=assetFiles.map(asset=>{
    if(!/^\/assets\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(asset.path)||!Buffer.isBuffer(asset.bytes)||!asset.bytes.length)throw new Error('Invalid build asset');
    return {target:path.join(dist,asset.path),bytes:asset.bytes};
  });
  const snapshot={...content,basePath},routes=getRoutes(snapshot);
  for(const route of routes)if(!/^\/(?:[a-z0-9-]+\/)*$/.test(route.path))throw new Error('Invalid route path');
  await mkdir(dist,{recursive:true});await cp(path.join(root,'public'),dist,{recursive:true});
  for(const file of ['styles.css','client.mjs','media.mjs','assistant.mjs'])await cp(path.join(root,'src',file),path.join(dist,file));
  for(const asset of uploads){await mkdir(path.dirname(asset.target),{recursive:true});await writeFile(asset.target,asset.bytes);}
  const prefix=value=>basePath+value.slice(1);
  const cssPath=path.join(dist,'styles.css'),css=await readFile(cssPath,'utf8');
  await writeFile(cssPath,css.replace(/url\((['"]?)(\/assets\/[^)'"?#]+)\1\)/g,(_,quote,value)=>'url('+quote+prefix(value)+quote+')'));
  const localAssets=new Set(['/media.mjs','/assistant.mjs']);
  for(const route of routes){
    const html=renderPage(route.path,snapshot),target=path.join(dist,route.path,'index.html');
    await mkdir(path.dirname(target),{recursive:true});await writeFile(target,html);
    for(const match of html.matchAll(/(?:href|src)="([^"?#]+)(?:[?#][^"]*)?"/g)){
      const value=match[1];if(value.startsWith(basePath)){const local='/'+value.slice(basePath.length);if(/^\/(?:assets\/|styles\.css$|client\.mjs$)/.test(local))localAssets.add(local);}
    }
  }
  for(const match of css.matchAll(/url\(['"]?(\/assets\/[^)'"?#]+)['"]?\)/g))localAssets.add(match[1]);
  const e=escapeHtml;
  await writeFile(path.join(dist,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found</title><meta name="color-scheme" content="dark"><link rel="stylesheet" href="${e(prefix('/styles.css'))}"></head><body><main class="page-shell not-found"><h1>Page not found.</h1><p>This page may have moved.</p><a class="text-link" href="${e(basePath)}">Back to home<img class="icon" src="${e(prefix('/assets/arrow-right.svg'))}" width="14" height="14" alt=""></a></main></body></html>`);
  for(const asset of localAssets){if(asset.includes('..')||asset.includes('\\'))throw new Error('Unsafe asset path');const info=await stat(path.join(dist,asset));if(!info.isFile()||!info.size)throw new Error('Missing/empty asset '+asset);}
  console.log(`Built ${routes.length} pages; verified ${localAssets.size} local asset references.`);return dist;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();

import {randomUUID} from 'node:crypto';
import {fileTypeFromBuffer} from 'file-type';
import {AppError} from './errors.mjs';
const allowed=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['application/pdf','pdf']]);
export async function inspectUpload(bytes,originalName='upload'){
  if(bytes.length>20*1024*1024)throw new AppError(413,'Files must be no larger than 20 MB.');
  let type;try{type=await fileTypeFromBuffer(bytes);}catch{}
  if(!type||!allowed.has(type.mime))throw new AppError(422,'Upload a JPEG, PNG, WebP image or PDF document.');
  if(type.mime.startsWith('image/')&&bytes.length>10*1024*1024)throw new AppError(413,'Images must be no larger than 10 MB.');
  const id=randomUUID();return{id,storage_path:`${id}.${allowed.get(type.mime)}`,original_name:String(originalName).replace(/[\u0000-\u001f/\\]/g,'_').slice(0,200),mime_type:type.mime,size:bytes.length,visibility:'private',archived:false};
}

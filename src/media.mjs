export function safeExternalUrl(value) {
  if(typeof value!=='string'||!/^https?:\/\//i.test(value.trim()))return null;
  try{const url=new URL(value.trim());return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}

export function videoSource(value) {
  if(typeof value!=='string')return null;
  if(/^\/assets\/[A-Za-z0-9/_-]+\.(mp4|webm|ogg)$/i.test(value))return{type:'video',src:value};
  const safe=safeExternalUrl(value);if(!safe)return null;
  const url=new URL(safe),host=url.hostname.toLowerCase();
  const youtube=['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'];
  let id=null;
  if(['youtu.be','www.youtu.be'].includes(host))id=url.pathname.split('/')[1];
  else if(youtube.includes(host)){const parts=url.pathname.split('/').filter(Boolean);id=url.pathname==='/watch'?url.searchParams.get('v'):['embed','shorts'].includes(parts[0])?parts[1]:null;}
  if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return{type:'youtube',src:`https://www.youtube-nocookie.com/embed/${id}`};
  if(/\.(mp4|webm|ogg)$/i.test(url.pathname))return{type:'video',src:safe};
  return null;
}

export function selectProject(items,id){return items.find(item=>item.id===id)??items[0]??null;}

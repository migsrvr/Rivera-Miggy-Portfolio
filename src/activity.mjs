export function githubUsername(value){
  try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='github.com'||url.port||url.username||url.password)return null;
    const username=url.pathname.replace(/^\/|\/$/g,'');return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)?username:null;
  }catch{return null;}
}

const logos={javascript:'javascript',python:'python',fastapi:'fastapi',flask:'flask',postgresql:'postgresql',supabase:'supabase',sqlite:'sqlite',vercel:'vercel',react:'react',railway:'railway','next.js':'nextdotjs',typescript:'typescript','google gemini':'googlegemini'};
export const techLogo=name=>Object.hasOwn(logos,name.trim().toLowerCase())?logos[name.trim().toLowerCase()]:null;
const badges={'tesseract.js':'OCR',pgvector:'PGV',groq:'GQ'};
export const techBadge=name=>Object.hasOwn(badges,name.trim().toLowerCase())?badges[name.trim().toLowerCase()]:null;
export function stackFor(profile,projects){
  const names=profile.techStack?.length?profile.techStack:projects.flatMap(p=>p.tools||[]),seen=new Set();
  return names.filter(name=>{const key=name.trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;}).slice(0,40);
}

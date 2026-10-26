import {createCipheriv,createDecipheriv,createHash,randomBytes,scrypt as derive,timingSafeEqual,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {AppError} from './errors.mjs';
export class SessionCodec {
  constructor(secret){if(!secret||secret.length<32)throw Error('SESSION_SECRET must contain at least 32 characters.');this.key=createHash('sha256').update(secret).digest();}
  encode(session){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify(session),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');}
  decode(value){try{const raw=Buffer.from(value,'base64url');if(raw.length<29)return null;const decipher=createDecipheriv('aes-256-gcm',this.key,raw.subarray(0,12));decipher.setAuthTag(raw.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)),decipher.final()]).toString('utf8'));}catch{return null;}}
}
const scrypt=promisify(derive);
const digest=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>{const left=Buffer.from(a||''),right=Buffer.from(b||'');return left.length===right.length&&timingSafeEqual(left,right);};
const dummyHash='scrypt$32768$8$1$'+'00'.repeat(16)+'$'+'00'.repeat(64);
export async function hashPassword(password){
  if(typeof password!=='string'||password.length<12||password.length>1024)throw Error('Password must contain 12 to 1024 characters.');
  const salt=randomBytes(16),key=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return `scrypt$32768$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password,hash){
  if(typeof password!=='string'||password.length>1024||typeof hash!=='string')return false;
  const match=hash.match(/^scrypt\$32768\$8\$1\$([0-9a-f]{32})\$([0-9a-f]{128})$/);
  if(!match)return false;
  const key=await scrypt(password,Buffer.from(match[1],'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return timingSafeEqual(key,Buffer.from(match[2],'hex'));
}
export class OwnerAuth {
  constructor(config,database){this.config=config;this.database=database;this.codec=config.configured?new SessionCodec(config.secret):null;}
  setCookie(reply,session){reply.setCookie('portfolio_session',this.codec.encode(session),{httpOnly:true,secure:this.config.secure,sameSite:'strict',path:'/',maxAge:60*60*24*7});}
  clearCookie(reply){reply.clearCookie('portfolio_session',{path:'/',httpOnly:true,secure:this.config.secure,sameSite:'strict'});}
  checkConfigured(){if(!this.config.configured||!this.database)throw new AppError(503,'Neon is not configured. Follow the backend setup guide.');}
  async query(text,values){try{return await this.database.query(text,values);}catch{throw new AppError(503,'The database is unavailable. Check the Neon connection and run setup if needed.');}}
  async login(email,password,reply){
    this.checkConfigured();
    const {rows}=await this.query('SELECT id,email,password_hash FROM portfolio.owner WHERE singleton=true AND lower(email)=lower($1)',[email]);
    const owner=rows[0],valid=await verifyPassword(password,owner?.password_hash||dummyHash);
    if(!owner||!valid)throw new AppError(401,'The email or password is incorrect.');
    const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex'),expiresAt=new Date(Date.now()+7*86400000).toISOString();
    try{await this.database.transaction(async tx=>{
      const current=(await tx.query('SELECT password_hash FROM portfolio.owner WHERE id=$1 AND singleton=true FOR UPDATE',[owner.id])).rows[0];
      if(!current||!equal(current.password_hash,owner.password_hash))throw new AppError(401,'The email or password is incorrect.');
      await tx.query('INSERT INTO portfolio.sessions(token_hash,owner_id,csrf,expires_at) VALUES($1,$2,$3,$4)',[digest(token),owner.id,csrf,expiresAt]);
      await tx.query('DELETE FROM portfolio.sessions WHERE expires_at <= now()');
    });}catch(error){if(error instanceof AppError)throw error;throw new AppError(503,'The database is unavailable. Try signing in again shortly.');}
    this.setCookie(reply,{token,csrf,expiresAt});return{user:{email:owner.email},csrf};
  }
  async authenticate(request,reply){
    this.checkConfigured();const session=this.codec.decode(request.cookies.portfolio_session||'');
    if(!session||typeof session.token!=='string'||!/^[0-9a-f]{64}$/.test(session.token)||typeof session.csrf!=='string')throw new AppError(401,'Please log in to edit the portfolio.');
    const {rows}=await this.query('SELECT o.email,s.csrf FROM portfolio.sessions s JOIN portfolio.owner o ON o.id=s.owner_id WHERE s.token_hash=$1 AND s.expires_at>now() AND o.singleton=true',[digest(session.token)]);
    if(!rows[0]||!equal(rows[0].csrf,session.csrf)){this.clearCookie(reply);throw new AppError(401,'Your session has expired. Please log in again.');}
    return{user:{email:rows[0].email},csrf:session.csrf,session};
  }
  async logout(context,reply){if(context?.session?.token)await this.query('DELETE FROM portfolio.sessions WHERE token_hash=$1',[digest(context.session.token)]);this.clearCookie(reply);}
}

import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function loadConfig(root=process.cwd()){
  const values={};for(const name of ['.env','.env.local']){const file=resolve(root,name);
    if(existsSync(file))for(const line of readFileSync(file,'utf8').split(/\r?\n/)){
      const match=line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);if(match)values[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');
    }
  }
  const env={...values,...process.env};
  const port=Number(env.PORT||4173),origin=env.APP_ORIGIN||`http://127.0.0.1:${port}`;
  const config={root,port,host:env.HOST||'127.0.0.1',origin,secure:env.NODE_ENV==='production',databaseUrl:env.DATABASE_URL,secret:env.SESSION_SECRET,originalsRoot:resolve(root,'.local/originals')};
  config.configured=Boolean(config.databaseUrl&&config.secret?.length>=32);
  if(config.secure&&!origin.startsWith('https://'))throw Error('Production APP_ORIGIN must use HTTPS.');
  return config;
}

import pg from 'pg';

export function connectionOptions(databaseUrl){
  let url;try{url=new URL(databaseUrl);}catch{throw Error('Configure a valid PostgreSQL DATABASE_URL.');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.pathname.slice(1))throw Error('Configure a valid PostgreSQL DATABASE_URL.');
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  // Connection-string SSL options otherwise override pg's verified TLS object.
  for(const name of [...url.searchParams.keys()])if(name!=='channel_binding')url.searchParams.delete(name);
  return {connectionString:url.toString(),ssl:local?false:{rejectUnauthorized:true},max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,statement_timeout:15000,application_name:'rivera-portfolio'};
}

export function createDatabase(config){
  const pool=new pg.Pool(connectionOptions(config.databaseUrl));
  pool.on('error',()=>{});
  return {
    query:(text,values)=>pool.query(text,values),
    async transaction(fn){const client=await pool.connect();try{await client.query('BEGIN');const value=await fn(client);await client.query('COMMIT');return value;}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}},
    close:()=>pool.end(),
  };
}

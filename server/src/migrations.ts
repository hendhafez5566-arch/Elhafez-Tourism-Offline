import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { pool, withTx } from './context.js';

const dir=resolve(fileURLToPath(new URL('../../database/migrations/',import.meta.url)));
export async function runMigrations(){
 await pool.query(`create table if not exists erp_schema_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now())`);
 const files=(await readdir(dir)).filter(x=>/^\d+.*\.sql$/i.test(x)).sort();
 for(const name of files){const sql=await readFile(resolve(dir,name),'utf8'),checksum=createHash('sha256').update(sql).digest('hex'),old=await pool.query('select checksum from erp_schema_migrations where name=$1',[name]);if(old.rowCount){if(old.rows[0].checksum!==checksum)throw new Error(`Migration checksum changed: ${name}`);continue}await withTx(async(c:any)=>{await c.query(sql);await c.query('insert into erp_schema_migrations(name,checksum) values($1,$2)',[name,checksum])});console.log(`Applied migration ${name}`)}
}

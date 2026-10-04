import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const src=join(root,'src');
async function walk(d){let out=[];for(const e of await readdir(d,{withFileTypes:true})){const p=join(d,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
const serverSrc=join(root,'server','src');
const files=[...(await walk(src)),...(await walk(serverSrc))].filter(f=>f.endsWith('.ts'));
const rows=[];let ok=true;
const regularLimit=60000,focusedModuleLimits=new Map();
for(const f of files){const s=await stat(f),r=relative(root,f).replaceAll('\\','/'),limit=r==='src/app.ts'?2048:(focusedModuleLimits.get(r)||regularLimit);rows.push({file:r,bytes:s.size,limit});if(s.size>limit)ok=false;}
rows.sort((a,b)=>b.bytes-a.bytes);
const app=await readFile(join(src,'app.ts'),'utf8');
const monolithFree=!app.includes('const UI=')&&!app.includes('const Accounting=')&&!app.includes('const Actions=');
ok=ok&&monolithFree;
console.log(JSON.stringify({ok,monolithFree,maxAllowedRegularTsBytes:regularLimit,focusedModuleLimits:Object.fromEntries(focusedModuleLimits),largest:rows.slice(0,12)},null,2));
if(!ok)process.exit(1);

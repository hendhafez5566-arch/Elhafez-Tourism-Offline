import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'scripts');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('-smoke.mjs')).sort();
let failed=0;
for(const file of files){
  console.log(`\n===== ${file} =====`);
  const r=spawnSync(process.execPath,[path.join(dir,file)],{cwd:root,stdio:'inherit',env:process.env});
  if(r.status!==0){failed++;console.error(`FAILED ${file} (${r.status})`)}
}
console.log(`\nNode smoke summary: ${files.length-failed}/${files.length} passed`);
if(failed)process.exit(1);

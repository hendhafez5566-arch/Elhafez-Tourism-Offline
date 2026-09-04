import fs from 'node:fs';
import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');
const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.ts'))files.push(p)}};
walk('src');
const source=files.map(read).join('\n');
const ui=read('src/ui/ui.ts');
const delegated=read('src/ui/delegated-actions.ts');
const guided=read('src/core/umrah/guided.ts');
const umrahUi=read('src/core/umrah/ui.ts')+'\n'+read('src/core/umrah/ui-pages.ts');
const output=read('src/documents/output-center.ts');
const pkg=JSON.parse(read('package.json'));
const count=re=>(source.match(re)||[]).length;
const raw={
  onclick:count(/\sonclick\s*=/gi),
  onchange:count(/\sonchange\s*=/gi),
  oninput:count(/\soninput\s*=/gi),
  onsubmit:count(/\sonsubmit\s*=/gi),
  directOnclick:count(/\.onclick\s*=/g)
};
const patch=Number(pkg.version.split('.')[2]||0);
const checks=[
  ['release is at least 32.5.15',pkg.version.startsWith('32.5.')&&patch>=15],
  ['HTML onclick eliminated',raw.onclick===0],
  ['HTML onchange eliminated',raw.onchange===0],
  ['HTML oninput eliminated',raw.oninput===0],
  ['HTML onsubmit eliminated',raw.onsubmit===0],
  ['direct onclick assignments eliminated',raw.directOnclick===0],
  ['delegation contains no eval',!/\beval\s*\(/.test(delegated)&&!/new\s+Function\b/.test(delegated)],
  ['smart filters are structured',ui.includes('data-ui-filter-scope')&&delegated.includes('[data-ui-filter-scope]')],
  ['Umrah history filters are structured',umrahUi.includes("{type:'umrahHistory',kind,value}")&&delegated.includes('[data-umrah-history-kind]')],
  ['guided recommendations are structured',guided.includes("actionType: 'booking'")&&guided.includes("actionType: 'program'")&&delegated.includes('[data-umrah-guide-action]')],
  ['contract edit is whitelisted',umrahUi.includes('data-umrah-contract-edit')&&delegated.includes("case 'hotelContract'")&&delegated.includes("case 'serviceContract'")],
  ['output center actions are structured',output.includes('data-output-action')&&delegated.includes('[data-output-action]')],
  ['program selector uses structured state keys',umrahUi.includes('data-umrah-select-program')&&delegated.includes('dataset.umrahSelectProgram')]
];
const failed=checks.filter(x=>!x[1]);
console.log(JSON.stringify({ok:!failed.length,raw,checks:checks.map(([name,pass])=>({name,pass:!!pass}))},null,2));
if(failed.length)process.exit(1);

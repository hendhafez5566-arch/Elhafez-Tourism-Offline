import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ts=read('tsconfig.json'), delegated=read('src/ui/delegated-actions.ts');
const srcFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&p.endsWith('.ts'))srcFiles.push(p)}}
walk(path.join(root,'src'));
const source=srcFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const rawOnclick=(source.match(/onclick=\"/g)||[]).length;
const rawOnchange=(source.match(/onchange=\"/g)||[]).length;
const rawOninput=(source.match(/oninput=\"/g)||[]).length;
const rawOnsubmit=(source.match(/onsubmit=\"/g)||[]).length;
const checks=[
 ['delegated module compiled before UI',ts.indexOf('src/ui/delegated-actions.ts')>=0&&ts.indexOf('src/ui/delegated-actions.ts')<ts.indexOf('src/ui/ui.ts')],
 ['central handler exists',delegated.includes('const UIDelegatedActions')&&delegated.includes('handle(target:Element|null,e:Event,ui:any)')],
 ['page navigation delegated',delegated.includes("[data-ui-page]")&&source.includes('data-ui-page="')],
 ['plain Forms.open delegated',delegated.includes("[data-form-open]")&&!/onclick="Forms\.open\(\\'[^\\']+\\'\)"/.test(source)],
 ['Quick Create delegated',delegated.includes("[data-quick-create-type]")&&!source.includes('onclick="UmrahCore_QuickCreate.open')],
 ['font preview delegated',delegated.includes("[data-font-family-preview]")&&delegated.includes("[data-font-scale-preview]")&&!source.includes('onclick="UI.previewFont')],
 ['invoice print delegated',delegated.includes("[data-print-invoice]")&&!source.includes('onclick="Print.invoice')],
 ['attachment preview delegated',delegated.includes("[data-attachment-preview]")&&!source.includes('onclick="Attachments.preview')],
 ['inline onclick ceiling protected',rawOnclick<=330],
 ['inline onchange reduced to generic hooks only',rawOnchange<=2],
 ['inline oninput eliminated',rawOninput===0],
 ['inline onsubmit eliminated',rawOnsubmit===0]
];
const failed=checks.filter(([,ok])=>!ok);
console.log(JSON.stringify({ok:!failed.length,rawOnclick,rawOnchange,rawOninput,rawOnsubmit,checks:checks.map(([name,pass])=>({name,pass}))},null,2));
if(failed.length)process.exit(1);

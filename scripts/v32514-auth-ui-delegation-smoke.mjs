import { uiText } from './lib/split-sources.mjs';
import {readFile,readdir} from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const [pkgText,auth,ui,delegated]=await Promise.all([read('package.json'),read('src/security/auth.ts'),uiText(),read('src/ui/delegated-actions.ts')]);
const pkg=JSON.parse(pkgText),patch=Number(pkg.version.split('.').at(-1));
const files=(await readdir(new URL('../src/',import.meta.url),{recursive:true})).filter(f=>f.endsWith('.ts'));
const source=(await Promise.all(files.map(f=>read(`src/${f}`)))).join('\n');
const rawOnclick=(source.match(/\sonclick\s*=/g)||[]).length;
const checks=[
 ['release remains at least 32.5.14',patch>=14],
 ['pre-login auth delegation installed',auth.includes('installScreenDelegation()')&&auth.includes("this.installScreenDelegation();const remoteRequired=")],
 ['Auth source has no onclick assignment',!auth.includes('onclick=')&&!auth.includes('.onclick=')],
 ['password visibility uses delegated auth action',auth.includes('data-auth-password-toggle="1"')&&auth.includes("el.dataset.authPasswordToggle!==undefined")],
 ['recovery navigation uses auth data actions',auth.includes('data-auth-action="login"')&&auth.includes('data-auth-action="reset-cancel"')],
 ['workspace module navigation delegated',ui.includes('data-workspace-page="${i[0]}"')&&!ui.includes("onclick=\"return UI.openWorkspaceModule" )&&delegated.includes("hit('[data-workspace-page]')" )],
 ['mobile search delegated',ui.includes('data-ui-mobile-search="1"')&&delegated.includes("hit('[data-ui-mobile-search]')" )],
 ['search result navigation delegated',ui.includes('data-ui-search-result="${x.page}"')&&delegated.includes("hit('[data-ui-search-result]')" )],
 ['table paging delegated',ui.includes('data-ui-page-table="${key}"')&&delegated.includes("hit('[data-ui-page-table]')" )],
 ['party modal actions delegated',ui.includes('data-ui-party-actions="${safeType}"')&&ui.includes('data-ui-party-more="${safeType}"')],
 ['explicit inline onclick ceiling improved',rawOnclick<=311]
];
for(const [name,ok] of checks)assert(ok,name);
console.log(JSON.stringify({ok:true,rawOnclick,checks:checks.map(([name,pass])=>({name,pass}))},null,2));

import { readFile, stat } from 'node:fs/promises';
import { umrahPagesText, uiText, pagesText } from './lib/split-sources.mjs';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const checks=[];const check=(name,pass,detail='')=>{checks.push({name,pass:!!pass,detail});if(!pass)process.exitCode=1};
const [pages,cleanPages,ui,delegated,party,actions,umrahData,umrahUi,umrahContracts,umrahPrint,styles,printing,tsconfig,copyStatic,manifest,gradle,pkg]=await Promise.all([
 pagesText(),read('src/ui/clean-pages.ts'),uiText(),read('src/ui/delegated-actions.ts'),read('src/ui/party360.ts'),Promise.all(['actions','actions-handlers-master','actions-handlers-documents','actions-handlers-finance','actions-handlers-crm','actions-handlers-reports-settings','actions-handlers-advanced'].map(n=>read(`src/ui/${n}.ts`))).then(a=>a.join('\n')),read('src/core/umrah/data.ts'),(read('src/core/umrah/ui.ts')+umrahPagesText()),read('src/core/umrah/contracts.ts'),read('src/core/umrah/actions-print.ts'),read('src/styles.css'),read('src/reports/printing.ts'),read('tsconfig.json'),read('scripts/copy-static.mjs'),read('pwa/manifest.webmanifest'),read('android/app/build.gradle'),read('package.json')
]);
const cleanPartyControl=t=>new RegExp(`(?:UI|\\(UI as any\\))\\.partyControls\\('${t}',x\\.id`).test(cleanPages);
for(const t of ['customer','supplier','agent']) check(`master ${t} uses unified إجراءات + المزيد controls`,cleanPartyControl(t));
check('unified control renders exactly Actions and More entry points',ui.includes("<span>الإجراءات</span>")&&ui.includes("<span>المزيد</span>")&&delegated.includes('Actions.openPartyActions')&&delegated.includes('Party360.openMore'));
check('More supports customers, suppliers and agents',party.includes('customer:{')&&party.includes('supplier:{')&&party.includes('agent:{'));
check('More management owns edit/delete/direct WhatsApp/documents',party.includes('تعديل</button>')&&party.includes('حذف</button>')&&party.includes('واتساب</button>')&&party.includes('المستندات</button>')&&party.includes('data-party-action="documents"'));
check('More documents use real print sources without duplicating transaction creation',party.includes('Actions.statement(type,id)')&&party.includes('Print.invoice(docId)')&&party.includes("Print.voucher('receipt',docId)")&&party.includes("Print.voucher('payment',docId)")&&!party.includes('Actions.openPartyActions(')&&!party.includes("Forms.open('receipt'")&&!party.includes("Forms.open('payment'"));
check('visible More wording no longer exposes old 360 label',!party.includes('ملف موحد 360°')&&!party.includes('ملف 360°'));
const opStart=actions.indexOf('openPartyActions(type,id)'),opEnd=actions.indexOf('saveInterface()',opStart),opBlock=actions.slice(opStart,opEnd>opStart?opEnd:actions.length);
check('operations menu contains no WhatsApp/edit/delete duplication',opStart>=0&&opBlock.includes('إجراءات —')&&!opBlock.includes('openWhatsApp')&&!opBlock.includes('Actions.statement')&&!opBlock.includes(">تعديل</button>")&&!opBlock.includes(">حذف</button>"));
check('global modal context stack restores parent dialogs system-wide',ui.includes('UI._modalStack=[]')&&ui.includes('UI.captureModal=function')&&ui.includes('UI.restoreModal=function')&&ui.includes('UI.installGlobalModalStack=function')&&ui.includes("document.addEventListener('pointerdown',arm,true)")&&ui.includes('new MutationObserver')&&ui.includes('if(this._modalStack.length)'));
check('modal stack preserves nested form values and scroll position',ui.includes('UI.captureModalControls=function')&&ui.includes('UI.restoreModalControls=function')&&ui.includes('controls:this.captureModalControls(f)')&&ui.includes('scrollTop:body.scrollTop'));
check('modal stack preserves ancestry through replace-style dialogs',ui.includes('ancestry:this._modalStack.slice()')&&ui.includes('this._modalStack=pending.ancestry.slice()'));
check('Umrah bridge uses same unified party controls',umrahData.includes('partyControls(type, id)')&&umrahData.includes('.partyControls(type, id, { compact: true })'));
const umrahCombined=umrahUi+umrahContracts+umrahPrint;
check('Umrah party links no longer use a visible 360 button',!umrahCombined.includes('ملف 360°')&&!umrahCombined.includes('party360-trigger'));
check('comfort theme exists in CSS',styles.includes('body[data-theme="comfort"]'));
check('comfort theme exists in settings',pages.includes('value="comfort"')&&pages.includes('هادئ احترافي'));
check('print font selection follows settings with safe local fallback',printing.includes('fontImports')&&printing.includes('s.fontFamily')&&printing.includes('Tahoma')&&printing.includes('Arial,sans-serif'));
check('print logo is compacted for oversized embedded logos',printing.includes('compactPrintLogo')&&printing.includes('max=320'));
const tc=JSON.parse(tsconfig);check('production source maps disabled',tc.compilerOptions.sourceMap===false);check('production comments stripped',tc.compilerOptions.removeComments===true);check('stale source map cleanup enabled',copyStatic.includes("dist/app.js.map"));
const packageVersion=JSON.parse(pkg).version,[vMajor,vMinor,vPatch]=packageVersion.split('.').map(Number),androidCode=vMajor*1000+vMinor*100+vPatch;
check('Android release version matches package release',gradle.includes(`versionCode ${androidCode}`)&&gradle.includes(`versionName \"${packageVersion}\"`));
check('package release version is valid semantic version',/^\d+\.\d+\.\d+$/.test(packageVersion));
try{await stat(new URL('../dist/app.js.map',import.meta.url));check('dist source map removed',false)}catch{check('dist source map removed',true)}
console.log(JSON.stringify({ok:checks.every(x=>x.pass),checks},null,2));

import fs from 'node:fs';
import { umrahPagesText, uiText } from './lib/split-sources.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const mobile=read('src/mobile.ts');
const ui=uiText();
const css=read('src/styles.css');
const umrah=(read('src/core/umrah/ui.ts')+umrahPagesText());
const del=read('src/core/delete-center.ts');
const rootPkg=JSON.parse(read('package.json'));
const serverPkg=JSON.parse(read('server/package.json'));
const context=read('server/src/context.ts');
const checks=[
 ['root/server release versions are identical',rootPkg.version===serverPkg.version],
 ['health version comes from server package',context.includes("new URL('../package.json',import.meta.url)")&&context.includes('appVersion=')],
 ['Android header current',mobile.includes(`X-ERP-Mobile-Version','${rootPkg.version}'`)&&mobile.includes(`'X-ERP-Mobile-Version':'${rootPkg.version}'`)],
 ['release checker does not force timer reload',mobile.includes('A new Railway release is applied once')&&mobile.includes("source!=='timer'")&&mobile.includes('applyPendingRelease')],
 ['release reload guarded once per server version',mobile.includes("RELEASE_APPLY_KEY='erp_native_release_apply_v2'")&&mobile.includes('if(last===remote)return false')],
 ['pull refresh finds page or nested scroll owner',mobile.includes('findScrollOwner')&&mobile.includes('atTop(scrollOwner)')&&mobile.includes('capture:true')],
 ['pull refresh available on view modals while edit forms protected',mobile.includes("closest?.('.modal.show')")&&mobile.includes("dataset?.mode!=='view'")],
 ['compact unified smart filter renderer',ui.includes('filterOption(label,count,on,action')&&ui.includes('simple-filter-option')&&ui.includes('simple-filter-count')],
 ['compact filter dimensions',css.includes('.simple-filter-option.smart-filter-kpi')&&css.includes('min-height:36px')&&css.includes('.simple-list-filter.smart-filter-grid')&&css.includes('@media(max-width:780px)')],
 ['Umrah history tabs use same smart-filter style',umrah.includes("UI.filterOption(label,count,mode===value,{type:'umrahHistory',kind,value}")],
 ['traveler safe-delete is exposed only when allowed',umrah.includes("DeleteCenter.canRemoveTraveler(t.id)?DeleteCenter.button('umrahTraveler'")&&del.includes('travelerDeleteBlockers(id)')],
 ['traveler delete requires cancelled booking',del.includes("if(b.status!=='cancelled')out.push('الحجز ليس ملغيًا')")],
 ['traveler delete blocks historical operational evidence',del.includes('له تذكرة مصدرة')&&del.includes('له سجل تأشيرة')&&del.includes('مرتبط بتكلفة مورد/إثبات تشغيلي')]
];
let bad=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++}
if(bad)process.exit(1);
console.log(`v32.4.83 checks: ${checks.length}/${checks.length}`);

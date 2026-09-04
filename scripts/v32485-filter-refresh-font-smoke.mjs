import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const css=read('src/styles.css');
const ui=read('src/ui/ui.ts');
const mobile=read('src/mobile.ts');
const umrah=(read('src/core/umrah/ui.ts')+read('src/core/umrah/ui-pages.ts'));
const store=read('src/persistence/browser-store.ts');
const pages=read('src/ui/pages.ts');
const delegated=read('src/ui/delegated-actions.ts');
const runtime=read('src/core/runtime.ts');
const rootPkg=JSON.parse(read('package.json'));
const serverPkg=JSON.parse(read('server/package.json'));
const checks=[
 ['release aligned', rootPkg.version===serverPkg.version && runtime.includes(`version:'${rootPkg.version}'`)],
 ['record scope has dedicated class', umrah.includes('record-scope-toolbar') && css.includes('.record-scope-toolbar .umrah-history-tabs>.simple-filter-option')],
 ['record scope labels remain fully readable', css.includes('.record-scope-toolbar') && css.includes('.simple-filter-option .simple-filter-label') && css.includes('white-space:nowrap')],
 ['record scope active palette is distinct', css.includes('.record-scope-toolbar .umrah-history-tabs>.simple-filter-option.filter-active') && css.includes('background:var(--navy)')],
 ['pull refresh requires deliberate pull', mobile.includes('SHOW_THRESHOLD=34') && mobile.includes('ARM_THRESHOLD=92')],
 ['pull refresh resets on aborted gestures', mobile.includes('const resetPull=') && mobile.includes('if(!atTop(scrollOwner)){resetPull();return}') && mobile.includes("touchcancel',()=>resetPull()")],
 ['portable Arabic font catalog', ui.includes('SystemFontCatalog') && ui.includes('fonts.googleapis.com') && ui.includes("cairo:{") && ui.includes("tajawal:{") && ui.includes("kufi:{")],
 ['legacy font choices migrate to working fonts', store.includes("legacyFonts={system:'cairo',segoe:'tajawal',arial:'noto'}")],
 ['font settings expose working families', pages.includes('data-font-family-preview="cairo"') && pages.includes('data-font-family-preview="tajawal"') && pages.includes('data-font-family-preview="kufi"') && delegated.includes('[data-font-family-preview]') && delegated.includes('ui.previewFontFamily(value,el)')],
 ['font-size controls are styled', css.includes('.font-size-options{display:grid') && css.includes('.font-size-option.active')],
 ['Umrah dashboard KPIs are drill filters', umrah.includes("className:'dashboard-filter-grid'") && umrah.includes("targetScope:'umrah-programs',targetKey:'open',targetPage:'programs'") && umrah.includes("targetScope:'umrah-bookings',targetKey:'hold',targetPage:'bookings'")],
 ['action smart filters persist active state', ui.includes('data-ui-filter-scope') && read('src/ui/delegated-actions.ts').includes('ui.listFilters[scope]=key')]
];
let bad=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++}
if(bad)process.exit(1);
console.log(`v32.4.85 checks: ${checks.length}/${checks.length}`);

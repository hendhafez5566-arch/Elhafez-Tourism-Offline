import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const printing=read('src/reports/printing.ts');
const narratives=read('src/finance/insights.ts');
const ui=read('src/ui/ui.ts');
const delegated=read('src/ui/delegated-actions.ts');
const html=read('index.html');
const android=read('android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java');
const pages=read('src/ui/pages.ts');
const checks=[
 ['compact invoice print uses short line narrative',printing.includes("DocumentNarrative.invoiceLine(inv,l,i,'short')")],
 ['default generated invoice summary is not repeated in print body',printing.includes("inv.printDescription?`<div class=\"print-description-block\"><b>البيان</b>" )],
 ['statement narrative has explicit compact party-netting wording',narratives.includes("l.refType==='party-netting'")&&narratives.includes('عكس مقاصة')],
 ['unified statement separates role into its own print column',printing.includes('<th>البيان</th><th>الدور</th>')&&printing.includes('class="print-role-chip"')],
 ['internal control account appears only in full statement mode',printing.includes('print-internal-detail')&&printing.includes("opts.level==='full'" )],
 ['Generic PDF share uses native A4 PDF canvas engine',android.includes('PrintAttributes.MediaSize.ISO_A4')&&android.includes('PrintedPdfDocument')&&android.includes('view.draw(canvas)')],
 ['Generic PDF share paginates the full WebView into A4 pages',android.includes('pageCount')&&android.includes('sourcePageHeight')&&android.includes('document.startPage(pageIndex)')],
 ['shortcut toggle exists in topbar and is delegated',html.includes('data-ui-toggle-shortcut="1"')&&delegated.includes("[data-ui-toggle-shortcut]" )],
 ['shortcuts are per-user and capped',ui.includes('elhafez-shortcuts:${Auth.user?.id')&&ui.includes('.slice(0,12)')&&ui.includes('اختصاراتي')],
 ['activity visible cap intentionally remains 1000',pages.includes('.slice(0,1000)')]
];
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,p])=>!p))process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));

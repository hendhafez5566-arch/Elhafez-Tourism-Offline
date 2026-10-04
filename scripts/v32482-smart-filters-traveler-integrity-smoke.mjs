import fs from 'node:fs';
import { umrahPagesText, uiText, pagesText } from './lib/split-sources.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const ui=uiText(), pages=pagesText(), clean=read('src/ui/clean-pages.ts'), umrah=(read('src/core/umrah/ui.ts')+umrahPagesText()), ops=['operations','operations-identity','operations-contracts','operations-programs','operations-schedule','operations-bookings','operations-travelers'].map(n=>read(`src/core/umrah/${n}.ts`)).join('\n'), del=read('src/core/delete-center.ts'), css=read('src/styles.css');
const checks=[
 ['smart filter engine',ui.includes('smartFilterStrip(scope,cards=[]')&&ui.includes('applyListFilter(scope,items,rules={})')],
 ['smart filter CSS active state',css.includes('.smart-filter-kpi.filter-active')],
 ['customer filters',clean.includes("UI.smartFilterStrip('customers'")],
 ['supplier filters',clean.includes("UI.smartFilterStrip('suppliers'")],
 ['agent filters',clean.includes("UI.smartFilterStrip('agents'")],
 ['PO filters',clean.includes("UI.smartFilterStrip('purchaseorders'")],
 ['voucher filters',clean.includes("UI.smartFilterStrip(page,cards)")&&clean.includes("page=receipt?'receipts':'payments'")],
 ['invoice filters',clean.includes("UI.smartFilterStrip('invoices'")],
 ['Umrah program/booking filters',umrah.includes("UI.smartFilterStrip('umrah-programs'")&&umrah.includes("UI.smartFilterStrip('umrah-bookings'")],
 ['traveler readiness/filter cards',umrah.includes("UI.smartFilterStrip('umrah-travelers'")&&umrah.includes('مكرر محتمل')],
 ['strong traveler identity guard',ops.includes('UmrahCore_travelerIdentityKey')&&ops.includes('UmrahCore_duplicateTravelerGroups')&&ops.includes('هذا المسافر لديه ملف بالفعل داخل نفس البرنامج')],
 ['safe program delete cascades booking/travelers',del.includes('removedBookings:bookingIds.size')&&del.includes('removedTravelers:travelerIds.size')],
 ['financial audit retention preserved',del.includes("deleteMode='audit-retained'")&&del.includes('retainedForAudit:true')]
];
let bad=0;for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)bad++}if(bad)process.exit(1);console.log(`v32.4.82 checks: ${checks.length}/${checks.length}`);

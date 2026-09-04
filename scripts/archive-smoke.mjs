import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
process.env.DATABASE_URL||='postgres://test:test@127.0.0.1:1/test';
const serverPg=resolve(fileURLToPath(new URL('../server/node_modules/pg',import.meta.url))),rootPg=resolve(fileURLToPath(new URL('../node_modules/pg',import.meta.url)));
let testPgStub=false;
if(!existsSync(serverPg)&&!existsSync(rootPg)){
  mkdirSync(serverPg,{recursive:true});
  writeFileSync(resolve(serverPg,'package.json'),JSON.stringify({name:'pg',version:'0.0.0-archive-test',type:'module',main:'index.js'}));
  writeFileSync(resolve(serverPg,'index.js'),"export class Pool{constructor(c={}){this.config=c}async query(){throw new Error('archive test stub has no database')}async connect(){throw new Error('archive test stub has no database')}async end(){}};export default {Pool};\n");
  testPgStub=true;
}
const {__archiveTest}=await import('../server/dist/archives.js');
if(testPgStub)process.on('exit',()=>{try{rmSync(resolve(fileURLToPath(new URL('../server/node_modules',import.meta.url))),{recursive:true,force:true})}catch{}});
const payload={meta:{schema:'erp-v32'},company:{name:'Test'},settings:{baseCurrency:'EGP'},accounts:[{id:'1200',type:'asset'},{id:'4100',type:'revenue'},{id:'3200',type:'equity'}],customers:[{id:'C1',name:'عميل'}],suppliers:[],agents:[],users:[],branches:[],currencies:[],fxRates:[],taxCodes:[],costCenters:[],treasuries:[],serviceTypes:[],commissionRules:[],recurringJournals:[],printNarratives:[],fiscalYears:[],periods:[],invoices:[{id:'I-PAID',date:'2026-05-01',status:'paid'},{id:'I-OPEN',date:'2026-06-01',status:'partial'}],receipts:[{id:'R1',date:'2026-05-02',status:'posted'}],payments:[],bookings:[],umrahBookings:[],approvals:[],cheques:[],documents:[],journals:[{id:'J1',no:'J1',date:'2026-05-01',status:'posted',lines:[{accountId:'1200',currency:'EGP',partyType:'customer',partyId:'C1',debit:100,credit:0,baseDebit:100,baseCredit:0},{accountId:'4100',currency:'EGP',debit:0,credit:100,baseDebit:0,baseCredit:100}]}]};
const plan=__archiveTest.buildPlan(payload,'2026-12-31');
assert.equal(plan.check.blockers.length,0);
assert.equal(plan.active.invoices.length,1);
assert.equal(plan.active.invoices[0].id,'I-OPEN');
assert.equal(plan.archived.invoices,1);
assert.equal(plan.archived.receipts,1);
assert.equal(plan.opening.lines.some(x=>x.accountId==='1200'&&x.partyId==='C1'),true);
assert.equal(plan.opening.lines.some(x=>x.accountId==='3200'),true);
const debit=plan.opening.lines.reduce((n,x)=>n+Number(x.baseDebit||0),0),credit=plan.opening.lines.reduce((n,x)=>n+Number(x.baseCredit||0),0);
assert(Math.abs(debit-credit)<=0.01);
assert(plan.nextBytes>0&&plan.currentBytes>0);
assert.equal(__archiveTest.digest(payload),__archiveTest.digest(structuredClone(payload)));
console.log(JSON.stringify({ok:true,archivedRecords:plan.archivedRecords,openingLines:plan.opening.lines.length,currentBytes:plan.currentBytes,nextBytes:plan.nextBytes,balanced:true}));

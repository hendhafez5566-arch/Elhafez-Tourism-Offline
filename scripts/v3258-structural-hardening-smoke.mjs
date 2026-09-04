import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=p=>fs.readFileSync(p,'utf8');
const clientSrc=read('src/persistence/state-patch.ts')+'\n;globalThis.__StatePatch=StatePatch;';
const clientJs=ts.transpileModule(clientSrc,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const box={structuredClone};vm.createContext(box);vm.runInContext(clientJs,box);const diff=box.__StatePatch.diff.bind(box.__StatePatch);
const serverSrc=read('server/src/state-patch.ts');
const serverJs=ts.transpileModule(serverSrc,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};const ctx={module:mod,exports:mod.exports,structuredClone};vm.createContext(ctx);vm.runInContext(serverJs,ctx);const apply=ctx.module.exports.applyStatePatch;
const base={meta:{schema:'x'},settings:{a:1},customers:[{id:'C1',name:'A'},{id:'C2',name:'B'}],invoices:[{id:'I1',status:'open',amount:10},{id:'I2',status:'open',amount:20}],tags:['a','b']};
const next={meta:{schema:'x'},settings:{a:2},customers:[{id:'C2',name:'B2'},{id:'C3',name:'C'}],invoices:[{id:'I1',status:'paid',amount:10},{id:'I2',status:'open',amount:20}],tags:['a','c']};
const patch=diff(base,next),round=apply(base,patch),same=JSON.stringify(round)===JSON.stringify(next);
const largeBase={meta:{schema:'x'},invoices:Array.from({length:5000},(_,i)=>({id:`I${i}`,no:`INV${i}`,status:'open',amount:i,partyId:`C${i%200}`}))},largeNext=structuredClone(largeBase);largeNext.invoices[4321]={...largeNext.invoices[4321],status:'paid'};const largePatch=diff(largeBase,largeNext),largeRound=apply(largeBase,largePatch),largeSame=JSON.stringify(largeRound)===JSON.stringify(largeNext);
const patchBytes=Buffer.byteLength(JSON.stringify(largePatch)),fullBytes=Buffer.byteLength(JSON.stringify(largeNext));
const historyMigration=read('database/migrations/011_pinned_state_history.sql'),migration=read('database/migrations/010_entity_record_mirror.sql'),entity=read('server/src/entity-mirror.ts'),server=read('server/src/server.ts'),store=read('src/persistence/server-store.ts'),terms=read('src/accounting/terms.ts'),authRecovery=read('server/src/auth-recovery.ts'),inventory=read('src/core/umrah/contracts-inventory.ts');
const checks=[
 ['patch round-trip exact',same],
 ['large patch round-trip exact',largeSame],
 ['single-record patch is materially smaller',patchBytes<fullBytes/100],
 ['client sends record-level patch',store.includes('StatePatch.diff(baseSnapshot,pending)')&&store.includes('"patch"')],
 ['server accepts patch',server.includes('applyStatePatch(patchBase,patch)')],
 ['normalized entity table exists',migration.includes('create table if not exists erp_entity_records')],
 ['normalized entity indexes exist',(migration.match(/create index if not exists erp_entity_records_/g)||[]).length>=6],
 ['migration backfills core records',migration.includes("('purchaseOrders')")&&migration.includes("('umrahBookings')")&&migration.includes("('journals')")],
 ['migration tolerates duplicate legacy ids',migration.includes('select distinct on (tenant_key,collection_key,entity_id)')&&entity.includes('const unique=[...new Map')],
 ['main save mirrors only changed collections',server.includes('syncEntityMirror(c,t,row.payload,payload,changes.map')],
 ['mirror update is record incremental',entity.includes('changedRows')&&entity.includes('entity_id=any($3::text[])')&&entity.includes('on conflict(tenant_key,collection_key,entity_id)')],
 ['reset/restore checkpoints are pinned',historyMigration.includes('pinned boolean')&&server.includes('factory-reset-before')&&server.includes('external-restore-before')],
 ['ordinary history cleanup excludes pinned snapshots',server.includes('pinned=false and id not in')],
 ['payment terms date math is explicit and typechecked',terms.includes('paymentTermsAddDays')&&!terms.includes('@ts-nocheck')&&!terms.includes('?dateAdd(date,d):date')],
 ['auth recovery audit keeps revision',authRecovery.includes('revision?:number')&&authRecovery.includes('tenant_key,revision,user_id')&&!authRecovery.includes('@ts-nocheck')],
 ['contract inventory rules are typechecked',!inventory.includes('@ts-nocheck')&&inventory.includes('normalizeRules(o: Record<string, any>')]
];
const failed=checks.filter(x=>!x[1]);console.log(JSON.stringify({ok:!failed.length,patchBytes,fullBytes,ratio:Number((patchBytes/fullBytes).toFixed(3)),checks:checks.map(([name,pass])=>({name,pass}))},null,2));if(failed.length)process.exit(1);

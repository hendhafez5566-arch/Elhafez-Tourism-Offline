import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mod=await import(new URL('../server/dist/entity-mirror-core.js',import.meta.url));
const {mirrorPayloadSummary,hydrateMirroredPayload}=mod;
const payload={company:{name:'Test'},customers:[{id:'C2',name:'B'},{id:'C1',name:'A'}],invoices:[{id:'I1',customerId:'C1',total:100}],umrahTickets:[],settings:{baseCurrency:'EGP'}};
const summary=mirrorPayloadSummary(payload);
assert.equal(summary.safe,true);
assert.equal(summary.rowCount,3);
assert.deepEqual(summary.presentKeys.filter(x=>['customers','invoices','umrahTickets'].includes(x)),['customers','invoices','umrahTickets']);
const base=structuredClone(payload);delete base.customers;delete base.invoices;delete base.umrahTickets;
const rows=[
 {collection_key:'customers',ordinal:0,entity_id:'C2',data:payload.customers[0]},
 {collection_key:'customers',ordinal:1,entity_id:'C1',data:payload.customers[1]},
 {collection_key:'invoices',ordinal:0,entity_id:'I1',data:payload.invoices[0]}
];
assert.deepEqual(hydrateMirroredPayload(base,rows,summary.presentKeys),payload);
assert.equal(mirrorPayloadSummary({...payload,customers:[{id:'C1'},{id:'C1'}]}).safe,false);
assert.equal(mirrorPayloadSummary({...payload,customers:[{name:'missing-id'}]}).safe,false);
const stateSource=fs.readFileSync(path.join(root,'server/src/repository/postgres-state-repository.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'database/migrations/012_entity_mirror_read_source.sql'),'utf8');
assert.match(stateSource,/mirrorRevision===revision/);
assert.match(stateSource,/fallback=await c\.query\('select payload/);
assert.match(migration,/erp_entity_mirror_meta/);
console.log('entity mirror read-source smoke: passed');

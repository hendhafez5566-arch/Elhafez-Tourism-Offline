const {mergeConcurrentPayload}=await import('../server/dist/state-merge.js');

const clone=value=>structuredClone(value);
const base={
 meta:{updatedAt:'2026-08-22T10:00:00.000Z',schema:'erp-v32'},
 settings:{baseCurrency:'EGP',fontScale:1},
 customers:[{id:'C1',name:'عميل أول',phone:'0100'},{id:'C2',name:'عميل ثان',phone:'0200'}],
 receipts:[],auditLog:[],sequences:{receipt:10}
};

const current=clone(base);
current.meta.updatedAt='2026-08-22T10:01:00.000Z';
current.customers[0].phone='0111';
current.receipts.unshift({id:'R-SERVER',no:'REC-11',amount:100});
current.auditLog.unshift({id:'A-SERVER',action:'receipt'});

const submitted=clone(base);
submitted.meta.updatedAt='2026-08-22T10:02:00.000Z';
submitted.customers[1].name='عميل ثان محدث';
submitted.auditLog.unshift({id:'A-CLIENT',action:'customer-update'});

const merged=mergeConcurrentPayload(base,submitted,current);
if(merged.customers.find(x=>x.id==='C1')?.phone!=='0111')throw new Error('Server-side independent customer edit was lost');
if(merged.customers.find(x=>x.id==='C2')?.name!=='عميل ثان محدث')throw new Error('Client-side independent customer edit was lost');
if(!merged.receipts.some(x=>x.id==='R-SERVER'))throw new Error('Independent server record addition was lost');
if(!merged.auditLog.some(x=>x.id==='A-SERVER')||!merged.auditLog.some(x=>x.id==='A-CLIENT'))throw new Error('Independent audit additions did not merge');

const sameRecordCurrent=clone(base),sameRecordSubmitted=clone(base);
sameRecordCurrent.customers[0].phone='0999';
sameRecordSubmitted.customers[0].name='اسم جديد';
const sameRecordMerged=mergeConcurrentPayload(base,sameRecordSubmitted,sameRecordCurrent);
if(sameRecordMerged.customers[0].phone!=='0999'||sameRecordMerged.customers[0].name!=='اسم جديد')throw new Error('Independent fields on one record did not merge');

let overlappingFieldBlocked=false,sequenceConflictBlocked=false;
try{const a=clone(base),b=clone(base);a.customers[0].phone='0300';b.customers[0].phone='0400';mergeConcurrentPayload(base,a,b)}catch(e){overlappingFieldBlocked=e?.statusCode===409}
try{const a=clone(base),b=clone(base);a.sequences.receipt=11;b.sequences.receipt=12;mergeConcurrentPayload(base,a,b)}catch(e){sequenceConflictBlocked=e?.statusCode===409}
if(!overlappingFieldBlocked)throw new Error('Overlapping field edit was not blocked');
if(!sequenceConflictBlocked)throw new Error('Concurrent document numbering was not blocked');

console.log(JSON.stringify({ok:true,merged:['independent records','independent fields','record additions','audit additions'],blocked:['same field conflict','sequence conflict']},null,2));

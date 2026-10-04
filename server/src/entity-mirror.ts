import { pool } from './context.js';
import { MIRRORED_COLLECTION_KEYS, MIRRORED_COLLECTIONS, mirrorPayloadSummary } from './entity-mirror-core.js';
export { MIRRORED_COLLECTION_KEYS, MIRRORED_COLLECTIONS, mirrorPayloadSummary, hydrateMirroredPayload } from './entity-mirror-core.js';
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
const map=(items:any[])=>new Map((items||[]).filter(x=>x&&String(x.id||'')).map(x=>[String(x.id),x]));
async function upsert(c:any,t:string,name:string,items:any[]){if(!items.length)return;const unique=[...new Map(items.filter(x=>x&&String(x.id||'')).map(x=>[String(x.id),x])).values()];if(!unique.length)return;await c.query(`
 insert into erp_entity_records(tenant_key,collection_key,entity_id,ordinal,branch_id,record_date,status,record_no,party_id,program_id,data,updated_at)
 select $1,$2,x.item->>'id',coalesce((x.item->>'__mirrorOrdinal')::int,0),coalesce(x.item->>'branchId',''),coalesce(x.item->>'date',x.item->>'createdAt',''),coalesce(x.item->>'status',''),coalesce(x.item->>'no',''),coalesce(x.item->>'partyId',x.item->>'customerId',x.item->>'supplierId',''),coalesce(x.item->>'programId',''),x.item-'__mirrorOrdinal',now()
 from jsonb_array_elements($3::jsonb) x(item)
 on conflict(tenant_key,collection_key,entity_id) do update set ordinal=excluded.ordinal,branch_id=excluded.branch_id,record_date=excluded.record_date,status=excluded.status,record_no=excluded.record_no,party_id=excluded.party_id,program_id=excluded.program_id,data=excluded.data,updated_at=now()`,[t,name,JSON.stringify(unique)])}

export function stripMirroredPayload(payload:any){const out=structuredClone(payload||{});for(const name of MIRRORED_COLLECTIONS)delete out[name];return out}
export async function entityBackedWritePlan(c:any,t:string,payload:any){
 const summary=mirrorPayloadSummary(payload);if(!summary.safe)throw Object.assign(new Error('entity_storage_invalid'),{statusCode:409});
 const count=await c.query('select count(*)::bigint as count from erp_entity_records where tenant_key=$1',[t]),actual=Number(count.rows[0]?.count||0);
 if(actual!==summary.rowCount)throw Object.assign(new Error('entity_storage_incomplete'),{statusCode:503});
 return{storageMode:'entity-backed',payload:stripMirroredPayload(payload),rowCount:summary.rowCount,presentKeys:summary.presentKeys};
}

export async function syncEntityMirror(c:any,t:string,before:any,after:any,changed?:Iterable<string>){
 const names=changed?[...new Set([...changed].filter(x=>MIRRORED_COLLECTIONS.has(x)))]:[...MIRRORED_COLLECTIONS];
 for(const name of names){const oldList=Array.isArray(before?.[name])?before[name]:[],newList=Array.isArray(after?.[name])?after[name]:[],bm=map(oldList),am=map(newList),oldIndex=new Map(oldList.map((x:any,i:number)=>[String(x?.id||''),i])),deleted:string[]=[],changedRows:any[]=[];
  for(const id of bm.keys())if(!am.has(id))deleted.push(id);
  const survivingOld=oldList.map((x:any)=>String(x?.id||'')).filter((id:string)=>id&&am.has(id)),existingNew=newList.map((x:any)=>String(x?.id||'')).filter((id:string)=>id&&bm.has(id)),inserted=newList.filter((x:any)=>x&&String(x.id||'')&&!bm.has(String(x.id))).map((x:any)=>String(x.id)),appendedOnly=inserted.every((id:string,i:number)=>String(newList[newList.length-inserted.length+i]?.id||'')===id),needsReorder=!same(survivingOld,existingNew)||!appendedOnly;
  for(let i=0;i<newList.length;i++){const item=newList[i],id=String(item?.id||'');if(!id)continue;const old=bm.get(id);if(!old||!same(old,item)||needsReorder&&oldIndex.get(id)!==i)changedRows.push({...item,__mirrorOrdinal:i})}
  if(deleted.length)await c.query('delete from erp_entity_records where tenant_key=$1 and collection_key=$2 and entity_id=any($3::text[])',[t,name,deleted]);
  await upsert(c,t,name,changedRows)
 }
}
export async function rebuildEntityMirror(c:any,t:string,payload:any){await c.query('delete from erp_entity_records where tenant_key=$1',[t]);for(const name of MIRRORED_COLLECTIONS){const list=Array.isArray(payload?.[name])?payload[name]:[],rows=list.filter((x:any)=>x&&String(x.id||'')).map((x:any,i:number)=>({...x,__mirrorOrdinal:i}));await upsert(c,t,name,rows)}}

export async function markEntityMirrorRevision(c:any,t:string,revision:number,payload:any){
 const summary=mirrorPayloadSummary(payload);if(!summary.safe){await c.query('delete from erp_entity_mirror_meta where tenant_key=$1',[t]);return false}
 const count=await c.query('select count(*)::bigint as count from erp_entity_records where tenant_key=$1',[t]),actual=Number(count.rows[0]?.count||0);
 if(actual!==summary.rowCount){await c.query('delete from erp_entity_mirror_meta where tenant_key=$1',[t]);return false}
 await c.query(`insert into erp_entity_mirror_meta(tenant_key,revision,row_count,present_keys,updated_at) values($1,$2,$3,$4::text[],now()) on conflict(tenant_key) do update set revision=excluded.revision,row_count=excluded.row_count,present_keys=excluded.present_keys,updated_at=now()`,[t,Number(revision||0),actual,summary.presentKeys]);
 return true;
}

export async function readEntityMirror(c:any,t:string,revision:number,rowCount:number,presentKeys:string[]){
 const r=await c.query('select collection_key,entity_id,ordinal,data from erp_entity_records where tenant_key=$1 order by collection_key,ordinal,entity_id',[t]);
 if(r.rows.length!==Number(rowCount||0))return null;
 return{rows:r.rows,presentKeys:Array.isArray(presentKeys)?presentKeys:[]};
}

export async function initializeEntityMirrorMetadata(){
 let ready=0,fallback=0;
 const backed=await pool.query(`select s.tenant_key,s.revision,s.entity_row_count,s.entity_present_keys,(select count(*)::bigint from erp_entity_records e where e.tenant_key=s.tenant_key) actual_rows from erp_state s where s.storage_mode='entity-backed' order by s.tenant_key`);
 for(const row of backed.rows){const actual=Number(row.actual_rows||0),expected=Number(row.entity_row_count||0);if(actual===expected){await pool.query(`insert into erp_entity_mirror_meta(tenant_key,revision,row_count,present_keys,updated_at) values($1,$2,$3,$4::text[],now()) on conflict(tenant_key) do update set revision=excluded.revision,row_count=excluded.row_count,present_keys=excluded.present_keys,updated_at=now()`,[row.tenant_key,Number(row.revision||0),expected,row.entity_present_keys||[]]);ready++}else fallback++}
 const existing=await pool.query(`select count(*)::int as count from erp_state s join erp_entity_mirror_meta m on m.tenant_key=s.tenant_key and m.revision=s.revision where s.storage_mode<>'entity-backed'`);ready+=Number(existing.rows[0]?.count||0);
 const states=await pool.query(`select s.tenant_key,s.revision,s.payload from erp_state s left join erp_entity_mirror_meta m on m.tenant_key=s.tenant_key where s.storage_mode<>'entity-backed' and m.revision is distinct from s.revision order by s.tenant_key`);
 for(const row of states.rows){if(await markEntityMirrorRevision(pool,String(row.tenant_key),Number(row.revision||0),row.payload))ready++;else fallback++}
 return{ready,fallback,total:ready+fallback};
}

export async function entityMirrorStatus(t:string){
 const r=await pool.query(`select s.revision as state_revision,s.storage_mode,s.entity_row_count,s.entity_present_keys,m.revision as mirror_revision,coalesce(m.row_count,0)::bigint as expected_rows,(select count(*)::bigint from erp_entity_records e where e.tenant_key=s.tenant_key) as actual_rows,m.updated_at from erp_state s left join erp_entity_mirror_meta m on m.tenant_key=s.tenant_key where s.tenant_key=$1`,[t]);
 if(!r.rowCount)return{ready:false,mode:'missing',stateRevision:0,mirrorRevision:0,expectedRows:0,actualRows:0};
 const row=r.rows[0],stateRevision=Number(row.state_revision||0),mirrorRevision=Number(row.mirror_revision||0),actualRows=Number(row.actual_rows||0),mode=String(row.storage_mode||'legacy-full'),stateExpected=Number(row.entity_row_count||0),expectedRows=mode==='entity-backed'?stateExpected:Number(row.expected_rows||0),manifestReady=mode!=='entity-backed'||stateExpected===actualRows;
 return{ready:manifestReady&&stateRevision===mirrorRevision&&expectedRows===actualRows,mode,stateRevision,mirrorRevision,expectedRows,actualRows,presentKeys:row.entity_present_keys||[],updatedAt:row.updated_at||null};
}

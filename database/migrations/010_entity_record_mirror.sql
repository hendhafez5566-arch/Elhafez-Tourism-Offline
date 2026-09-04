-- v32.5.8: normalized operational/accounting record mirror.
-- This is an online, backwards-compatible migration: erp_state remains readable while
-- high-value ERP entities gain row-level indexes and transactional incremental updates.
create table if not exists erp_entity_records (
  tenant_key text not null,
  collection_key text not null,
  entity_id text not null,
  ordinal integer not null default 0,
  branch_id text not null default '',
  record_date text not null default '',
  status text not null default '',
  record_no text not null default '',
  party_id text not null default '',
  program_id text not null default '',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_key, collection_key, entity_id)
);
create index if not exists erp_entity_records_tenant_collection_idx on erp_entity_records(tenant_key,collection_key,ordinal);
create index if not exists erp_entity_records_tenant_branch_idx on erp_entity_records(tenant_key,branch_id,collection_key) where branch_id<>'';
create index if not exists erp_entity_records_tenant_date_idx on erp_entity_records(tenant_key,collection_key,record_date) where record_date<>'';
create index if not exists erp_entity_records_tenant_status_idx on erp_entity_records(tenant_key,collection_key,status) where status<>'';
create index if not exists erp_entity_records_tenant_party_idx on erp_entity_records(tenant_key,party_id,collection_key) where party_id<>'';
create index if not exists erp_entity_records_tenant_program_idx on erp_entity_records(tenant_key,program_id,collection_key) where program_id<>'';
create index if not exists erp_entity_records_data_gin_idx on erp_entity_records using gin(data jsonb_path_ops);

with mirrored(collection_key) as (values
 ('customers'),('suppliers'),('agents'),('quotations'),('purchaseOrders'),('programs'),('bookings'),('travelers'),('services'),
 ('invoices'),('invoiceAdjustments'),('receipts'),('payments'),('expenses'),('transfers'),('cheques'),('commissions'),
 ('journals'),('manualJournalDrafts'),('cashCounts'),('bankReconciliations'),('fxRevaluations'),('approvals'),
 ('umrahSeasons'),('umrahHotelContracts'),('umrahFlightBlocks'),('umrahTransportContracts'),('umrahVisaContracts'),
 ('umrahContractReservations'),('umrahPrograms'),('umrahProgramSegments'),('umrahProgramCosts'),('umrahBookings'),
 ('umrahTravelers'),('umrahHotelRooms'),('umrahVisaBatches'),('umrahVisaItems'),('umrahTickets'),('umrahBusRuns'),
 ('umrahOperationTasks'),('umrahIncidents'),('umrahSupplierCommitments')
)
 , extracted as (
 select s.tenant_key,m.collection_key,x.item->>'id' as entity_id,(x.ord-1)::integer as ordinal,
        coalesce(x.item->>'branchId','') as branch_id,coalesce(x.item->>'date',x.item->>'createdAt','') as record_date,
        coalesce(x.item->>'status','') as status,coalesce(x.item->>'no','') as record_no,
        coalesce(x.item->>'partyId',x.item->>'customerId',x.item->>'supplierId','') as party_id,
        coalesce(x.item->>'programId','') as program_id,x.item as data
 from erp_state s
 join mirrored m on true
 cross join lateral jsonb_array_elements(case when jsonb_typeof(s.payload->m.collection_key)='array' then s.payload->m.collection_key else '[]'::jsonb end) with ordinality x(item,ord)
 where coalesce(x.item->>'id','')<>''
)
insert into erp_entity_records(tenant_key,collection_key,entity_id,ordinal,branch_id,record_date,status,record_no,party_id,program_id,data)
select distinct on (tenant_key,collection_key,entity_id) tenant_key,collection_key,entity_id,ordinal,branch_id,record_date,status,record_no,party_id,program_id,data
from extracted
order by tenant_key,collection_key,entity_id,ordinal desc
on conflict(tenant_key,collection_key,entity_id) do update set
 ordinal=excluded.ordinal,branch_id=excluded.branch_id,record_date=excluded.record_date,status=excluded.status,
 record_no=excluded.record_no,party_id=excluded.party_id,program_id=excluded.program_id,data=excluded.data,updated_at=now();

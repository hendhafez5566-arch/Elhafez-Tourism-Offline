-- v32.5.11: promote the normalized entity mirror to a verified read source.
-- erp_state remains the compatibility/write snapshot. Reads only use the mirror when
-- its recorded revision exactly matches erp_state; otherwise the server falls back.
create table if not exists erp_entity_mirror_meta (
  tenant_key text primary key references erp_state(tenant_key) on delete cascade,
  revision bigint not null default 0,
  row_count bigint not null default 0 check(row_count>=0),
  present_keys text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);
create index if not exists erp_entity_mirror_meta_revision_idx on erp_entity_mirror_meta(revision);

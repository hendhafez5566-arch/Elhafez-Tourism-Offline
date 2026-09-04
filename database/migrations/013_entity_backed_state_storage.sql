-- v32.5.12: allow erp_state to store only non-entity state after the normalized rows are verified.
-- Existing companies remain legacy-full until a safe transactional write promotes them.
alter table erp_state add column if not exists storage_mode text not null default 'legacy-full';
alter table erp_state add column if not exists entity_row_count bigint not null default 0;
alter table erp_state add column if not exists entity_present_keys text[] not null default '{}'::text[];
create index if not exists erp_state_storage_mode_idx on erp_state(storage_mode);

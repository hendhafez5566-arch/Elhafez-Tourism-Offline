-- v32.5.8: preserve recovery checkpoints across reset/restore while keeping short concurrency history lean.
alter table erp_state_history add column if not exists reason text not null default 'state-write';
alter table erp_state_history add column if not exists pinned boolean not null default false;
create index if not exists erp_state_history_tenant_pinned_revision_idx on erp_state_history(tenant_key,pinned,revision desc);

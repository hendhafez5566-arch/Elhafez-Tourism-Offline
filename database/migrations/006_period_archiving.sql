alter table erp_backups add column if not exists checksum_sha256 text not null default '';
alter table erp_backups add column if not exists verified_at timestamptz;

create table if not exists erp_period_archives (
  id bigserial primary key,
  tenant_key text not null,
  period_key text not null,
  period_label text not null,
  period_start date,
  period_end date not null,
  source_revision bigint not null,
  schema_version text not null default '',
  payload jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  checksum_sha256 text not null,
  backup_id bigint not null references erp_backups(id),
  status text not null default 'verified' check(status in ('verified','superseded')),
  created_by text not null default '',
  created_at timestamptz not null default now(),
  unique(tenant_key,period_key)
);
create index if not exists erp_period_archives_tenant_end_idx on erp_period_archives(tenant_key,period_end desc);

create table if not exists erp_archive_events (
  id bigserial primary key,
  tenant_key text not null,
  archive_id bigint references erp_period_archives(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  user_id text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists erp_archive_events_tenant_created_idx on erp_archive_events(tenant_key,created_at desc);

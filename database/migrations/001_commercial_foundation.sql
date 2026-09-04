create table if not exists erp_state (
  tenant_key text primary key,
  schema_version text not null default '',
  payload jsonb not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists erp_state_updated_at_idx on erp_state(updated_at desc);

create table if not exists erp_state_history (
  id bigserial primary key,
  tenant_key text not null,
  revision bigint not null,
  schema_version text not null default '',
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists erp_state_history_tenant_revision_idx on erp_state_history(tenant_key,revision desc);

create table if not exists erp_sessions (
  token_hash text primary key,
  tenant_key text not null,
  user_id text not null,
  ip_address text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table erp_sessions add column if not exists ip_address text not null default '';
alter table erp_sessions add column if not exists user_agent text not null default '';
alter table erp_sessions add column if not exists last_seen_at timestamptz not null default now();
create index if not exists erp_sessions_tenant_user_idx on erp_sessions(tenant_key,user_id);
create index if not exists erp_sessions_expires_idx on erp_sessions(expires_at);

create table if not exists erp_files (
  tenant_key text not null,
  file_id text not null,
  file_name text not null default '',
  mime text not null default 'application/octet-stream',
  size bigint not null default 0,
  data bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(tenant_key,file_id)
);

create table if not exists erp_installations (
  tenant_key text primary key,
  installation_id text not null,
  installed_at timestamptz not null default now(),
  trial_expires_at timestamptz not null,
  last_license_check_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists erp_audit_events (
  id bigserial primary key,
  tenant_key text not null,
  revision bigint,
  user_id text not null default '',
  action text not null,
  changes jsonb not null default '[]'::jsonb,
  ip_address text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists erp_audit_events_tenant_created_idx on erp_audit_events(tenant_key,created_at desc);

create table if not exists erp_backups (
  id bigserial primary key,
  tenant_key text not null,
  revision bigint not null,
  schema_version text not null default '',
  label text not null default '',
  source text not null default 'manual',
  payload jsonb not null,
  created_by text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists erp_backups_tenant_created_idx on erp_backups(tenant_key,created_at desc);

create table if not exists erp_backup_files (
  backup_id bigint not null references erp_backups(id) on delete cascade,
  file_id text not null,
  file_name text not null default '',
  mime text not null default 'application/octet-stream',
  size bigint not null default 0,
  data bytea not null,
  primary key(backup_id,file_id)
);

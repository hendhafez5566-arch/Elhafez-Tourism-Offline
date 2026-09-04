-- ERP Professional Suite v2 — secure PostgreSQL persistence
create table if not exists erp_state (
  tenant_key text primary key,
  schema_version text not null default '',
  payload jsonb not null,
  storage_mode text not null default 'legacy-full',
  entity_row_count bigint not null default 0,
  entity_present_keys text[] not null default '{}'::text[],
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
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists erp_sessions_tenant_user_idx on erp_sessions(tenant_key,user_id);
create index if not exists erp_sessions_expires_idx on erp_sessions(expires_at);
create table if not exists erp_users (
  tenant_key text not null,
  user_id text not null,
  username_normalized text not null,
  active boolean not null default true,
  user_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key(tenant_key,user_id),
  unique(tenant_key,username_normalized)
);
create index if not exists erp_users_tenant_active_idx on erp_users(tenant_key,active);
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
create table if not exists erp_backups (
  id bigserial primary key,
  tenant_key text not null,
  revision bigint not null,
  schema_version text not null default '',
  label text not null default '',
  source text not null default 'manual',
  payload jsonb not null,
  created_by text not null default '',
  checksum_sha256 text not null default '',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
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
  status text not null default 'verified',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  unique(tenant_key,period_key)
);

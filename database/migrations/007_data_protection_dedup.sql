create table if not exists erp_file_blobs (
  tenant_key text not null,
  sha256 text not null,
  size bigint not null default 0,
  mime text not null default 'application/octet-stream',
  data bytea not null,
  created_at timestamptz not null default now(),
  primary key(tenant_key,sha256)
);
create table if not exists erp_file_refs (
  tenant_key text not null,
  file_id text not null,
  file_name text not null default '',
  mime text not null default 'application/octet-stream',
  size bigint not null default 0,
  sha256 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(tenant_key,file_id),
  foreign key(tenant_key,sha256) references erp_file_blobs(tenant_key,sha256) on delete restrict
);
create index if not exists erp_file_refs_tenant_hash_idx on erp_file_refs(tenant_key,sha256);
create table if not exists erp_backup_file_refs (
  backup_id bigint not null references erp_backups(id) on delete cascade,
  file_id text not null,
  file_name text not null default '',
  mime text not null default 'application/octet-stream',
  size bigint not null default 0,
  sha256 text not null,
  primary key(backup_id,file_id)
);
create index if not exists erp_backup_file_refs_hash_idx on erp_backup_file_refs(sha256);
alter table erp_backups add column if not exists pinned boolean not null default false;
alter table erp_backups add column if not exists integrity_status text not null default 'pending';
alter table erp_backups add column if not exists size_bytes bigint not null default 0;
alter table erp_backups add column if not exists attachment_count integer not null default 0;
alter table erp_period_archives add column if not exists attachment_manifest jsonb not null default '[]'::jsonb;
alter table erp_period_archives add column if not exists size_bytes bigint not null default 0;
alter table erp_period_archives add column if not exists integrity_status text not null default 'verified';
alter table erp_period_archives alter column backup_id drop not null;
alter table erp_period_archives drop constraint if exists erp_period_archives_backup_id_fkey;
alter table erp_period_archives add constraint erp_period_archives_backup_id_fkey foreign key(backup_id) references erp_backups(id) on delete set null;

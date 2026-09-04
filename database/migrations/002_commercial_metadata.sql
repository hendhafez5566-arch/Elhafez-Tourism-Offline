-- Reserved migration for v30 commercial metadata. Kept intentionally idempotent.
create index if not exists erp_files_tenant_updated_idx on erp_files(tenant_key,updated_at desc);
create index if not exists erp_backups_tenant_revision_idx on erp_backups(tenant_key,revision desc);

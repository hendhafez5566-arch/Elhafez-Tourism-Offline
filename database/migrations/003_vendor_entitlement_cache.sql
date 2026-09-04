-- Central vendor entitlement cache. Isolated from accounting and operational tables.
alter table erp_installations add column if not exists cached_license_token text not null default '';
alter table erp_installations add column if not exists last_license_error text not null default '';
create index if not exists erp_installations_license_check_idx on erp_installations(last_license_check_at);

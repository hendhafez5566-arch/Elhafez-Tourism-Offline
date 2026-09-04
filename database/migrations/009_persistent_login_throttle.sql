-- v32.5.7: persist authentication throttling across Node restarts and replicas.
create table if not exists erp_login_attempts (
  attempt_key text primary key,
  tenant_key text not null,
  ip_address text not null default '',
  username_normalized text not null default '',
  failure_count integer not null default 0 check (failure_count >= 0),
  blocked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);
create index if not exists erp_login_attempts_tenant_last_idx on erp_login_attempts(tenant_key,last_attempt_at desc);
create index if not exists erp_login_attempts_blocked_idx on erp_login_attempts(blocked_until) where blocked_until is not null;

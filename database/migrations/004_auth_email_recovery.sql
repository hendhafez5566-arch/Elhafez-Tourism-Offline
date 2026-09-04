-- Email verification and password recovery tokens. Isolated from ERP/accounting data.
create table if not exists erp_auth_tokens (
  token_hash text primary key,
  tenant_key text not null,
  user_id text not null,
  purpose text not null check (purpose in ('verify_email','reset_password')),
  email text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index if not exists erp_auth_tokens_tenant_user_idx on erp_auth_tokens(tenant_key,user_id,purpose,created_at desc);
create index if not exists erp_auth_tokens_expires_idx on erp_auth_tokens(expires_at);

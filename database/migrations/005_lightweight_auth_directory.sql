create table if not exists erp_users (
  tenant_key text not null,
  user_id text not null,
  username_normalized text not null,
  active boolean not null default true,
  user_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_key, user_id),
  unique (tenant_key, username_normalized)
);
create index if not exists erp_users_tenant_active_idx on erp_users(tenant_key, active);

insert into erp_users(tenant_key,user_id,username_normalized,active,user_data)
select s.tenant_key,u->>'id',lower(trim(u->>'username')),coalesce((u->>'active')::boolean,true),u
from erp_state s cross join lateral jsonb_array_elements(coalesce(s.payload->'users','[]'::jsonb)) u
where coalesce(u->>'id','')<>'' and coalesce(trim(u->>'username'),'')<>''
on conflict(tenant_key,user_id) do update set
 username_normalized=excluded.username_normalized,
 active=excluded.active,
 user_data=excluded.user_data,
 updated_at=now();

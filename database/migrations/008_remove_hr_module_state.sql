-- v32.4.60: remove the retired HR module payload without touching ERP accounting records.
-- The same cleanup is applied to the three short-lived concurrency history snapshots.

update erp_state
set payload = payload #- '{integratedModules,hr}'
where payload #> '{integratedModules,hr}' is not null;

update erp_state_history
set payload = payload #- '{integratedModules,hr}'
where payload #> '{integratedModules,hr}' is not null;

-- Remove the obsolete HR workspace descriptor from persisted UI settings.
update erp_state
set payload = jsonb_set(
  payload,
  '{settings,workspaces}',
  coalesce((
    select jsonb_agg(x)
    from jsonb_array_elements(payload #> '{settings,workspaces}') x
    where x->>'id' <> 'hr'
  ), '[]'::jsonb),
  true
)
where jsonb_typeof(payload #> '{settings,workspaces}')='array'
  and exists (
    select 1 from jsonb_array_elements(payload #> '{settings,workspaces}') x
    where x->>'id'='hr'
  );

update erp_state_history
set payload = jsonb_set(
  payload,
  '{settings,workspaces}',
  coalesce((
    select jsonb_agg(x)
    from jsonb_array_elements(payload #> '{settings,workspaces}') x
    where x->>'id' <> 'hr'
  ), '[]'::jsonb),
  true
)
where jsonb_typeof(payload #> '{settings,workspaces}')='array'
  and exists (
    select 1 from jsonb_array_elements(payload #> '{settings,workspaces}') x
    where x->>'id'='hr'
  );

-- New company states are entity-backed. Existing legacy-full rows are migrated
-- transactionally by the repository during startup before the server listens.
alter table erp_state alter column storage_mode set default 'entity-backed';

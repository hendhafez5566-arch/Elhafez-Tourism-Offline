// Part 5 — single entry point for company-state persistence (NOT YET WIRED: server.ts and others still import ./state.js directly).
// Purpose: give use-cases one interface so storage internals (JSON payload vs entity rows) can change behind it.
// Today it only delegates to the existing, tested functions in ../state.ts; it adds no SQL and changes no behaviour.
import { currentState, currentStateForUpdate, persistStateRecord, insertStateRecord } from '../state.js';
export interface StoredState { payload: any; schema_version: string; revision: number; updated_at: Date | string; storageMode?: string }
export interface StateSaveResult { revision: number; storageMode: string; updated_at?: Date | string }
export interface CompanyStateRepository {
  load(tenant: string): Promise<StoredState | null>;
  loadForUpdate(tx: any, tenant: string): Promise<StoredState | null>;
  save(tx: any, tenant: string, payload: any, schemaVersion?: string): Promise<StateSaveResult>;
  create(tx: any, tenant: string, payload: any, schemaVersion: string, revision?: number): Promise<StateSaveResult>;
}
export const stateRepository: CompanyStateRepository = {
  load: (tenant) => currentState(tenant) as Promise<StoredState | null>,
  loadForUpdate: (tx, tenant) => currentStateForUpdate(tx, tenant) as Promise<StoredState | null>,
  save: (tx, tenant, payload, schemaVersion) => persistStateRecord(tx, tenant, payload, schemaVersion) as Promise<StateSaveResult>,
  create: (tx, tenant, payload, schemaVersion, revision = 1) => insertStateRecord(tx, tenant, payload, schemaVersion, revision) as Promise<StateSaveResult>
};

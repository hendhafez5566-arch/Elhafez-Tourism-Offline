// Single production entry point for company-state persistence. Storage internals
// remain private to state.ts; HTTP and backup use-cases depend on this boundary.
import { currentState, currentStateForUpdate, persistStateRecord, insertStateRecord } from './postgres-state-repository.js';
export {
  clientPayload,
  mergeUserSecrets,
  assertUserDirectoryChangeAllowed,
  mergeScopedPayload,
  mergeConcurrentPayload
} from './postgres-state-repository.js';
export { migrateLegacyFullStates } from './postgres-state-repository.js';
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
export const loadState = stateRepository.load;
export const loadStateForUpdate = stateRepository.loadForUpdate;
export const saveState = stateRepository.save;
export const createState = stateRepository.create;
// Compatibility names for server use-cases; implementations still live inside
// this repository package rather than at the application/server root.
export { loadState as currentState, loadStateForUpdate as currentStateForUpdate, saveState as persistStateRecord };

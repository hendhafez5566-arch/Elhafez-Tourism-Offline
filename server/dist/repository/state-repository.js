import { currentState, currentStateForUpdate, persistStateRecord, insertStateRecord } from './postgres-state-repository.js';
export { clientPayload, mergeUserSecrets, assertUserDirectoryChangeAllowed, mergeScopedPayload, mergeConcurrentPayload } from './postgres-state-repository.js';
export { migrateLegacyFullStates } from './postgres-state-repository.js';
export const stateRepository = {
    load: (tenant) => currentState(tenant),
    loadForUpdate: (tx, tenant) => currentStateForUpdate(tx, tenant),
    save: (tx, tenant, payload, schemaVersion) => persistStateRecord(tx, tenant, payload, schemaVersion),
    create: (tx, tenant, payload, schemaVersion, revision = 1) => insertStateRecord(tx, tenant, payload, schemaVersion, revision)
};
export const loadState = stateRepository.load;
export const loadStateForUpdate = stateRepository.loadForUpdate;
export const saveState = stateRepository.save;
export const createState = stateRepository.create;
export { loadState as currentState, loadStateForUpdate as currentStateForUpdate, saveState as persistStateRecord };

// Part 5 — orchestration of the legacy-full -> entity-backed migration, independent of the database driver.
// `db` is an adapter (see scripts/state-migrate-cli.mjs for the PostgreSQL one; the smoke test has an in-memory one).
import { buildPlan, hydrate } from './migration-plan.mjs';
import { fingerprint, compare } from './state-verify.mjs';
const sum = fp => ({ counts: Object.fromEntries(Object.entries(fp.counts).filter(([, v]) => v)), totalsByCurrency: fp.totalsByCurrency });

// Read-only. Never writes. Returns a report object.
export async function dryRun(db, tenant) {
  return db.readOnly(async tx => {
    const st = await tx.getState(tenant);
    if (!st) return { tenant, status: 'not_found' };
    if (st.storage_mode === 'entity-backed') return { tenant, status: 'already_entity_backed', revision: st.revision, rows: await tx.countRows(tenant) };
    const plan = buildPlan(st.payload), fp = fingerprint(st.payload), mirror = await tx.readRows(tenant);
    const mirrorHydrated = hydrate(plan.stripped, mirror, plan.presentKeys), vs = compare(fp, fingerprint(mirrorHydrated));
    return { tenant, status: plan.safe ? 'ready' : 'blocked', revision: st.revision, wouldWriteRows: plan.rowCount, existingMirrorRows: mirror.length, blockedReasons: plan.reasons.slice(0, 50),
      payloadSummary: sum(fp), existingMirrorMatchesPayload: vs.ok, mirrorDifferences: vs.problems.slice(0, 20), sourceUnbalancedCurrencies: vs.unbalancedBefore };
  });
}

// Writes inside ONE transaction. Throws (=> rollback) on any verification failure.
export async function apply(db, tenant, { backupNote = '' } = {}) {
  return db.transaction(async tx => {
    const st = await tx.getStateForUpdate(tenant);
    if (!st) throw new Error('tenant_not_found');
    if (st.storage_mode !== 'legacy-full') throw new Error('not_legacy_full:' + st.storage_mode);
    const plan = buildPlan(st.payload);
    if (!plan.safe) throw new Error('unsafe_data: ' + plan.reasons.slice(0, 5).join(' | '));
    const before = fingerprint(st.payload);
    if (Object.values(before.totalsByCurrency).some(t => t.debit !== t.credit)) throw new Error('source_journals_unbalanced');
    const backupId = await tx.insertBackup({ tenant, revision: st.revision, storage_mode: st.storage_mode, payload: st.payload, rows: (await tx.countRows(tenant)), note: backupNote });
    await tx.replaceRows(tenant, plan.rows);
    const rows = await tx.readRows(tenant);
    if (rows.length !== plan.rowCount) throw new Error(`row_count_mismatch ${rows.length} != ${plan.rowCount}`);
    const after = fingerprint(hydrate(plan.stripped, rows, plan.presentKeys)), cmp = compare(before, after);
    if (!cmp.ok) throw new Error('verification_failed: ' + cmp.problems.slice(0, 10).join(' | '));
    await tx.setEntityBacked(tenant, { stripped: plan.stripped, rowCount: plan.rowCount, presentKeys: plan.presentKeys, revision: st.revision });
    return { tenant, status: 'migrated', backupId, revision: st.revision, rows: plan.rowCount, verified: sum(after) };
  });
}

// Independent check AFTER commit, exactly how the server reads an entity-backed company.
export async function verifyAfter(db, tenant, backupId) {
  return db.readOnly(async tx => {
    const st = await tx.getState(tenant), bk = await tx.getBackup(backupId);
    if (!st || !bk) return { ok: false, problems: ['state or backup missing'] };
    if (st.storage_mode !== 'entity-backed') return { ok: false, problems: ['storage_mode=' + st.storage_mode] };
    const rows = await tx.readRows(tenant);
    if (rows.length !== Number(st.entity_row_count)) return { ok: false, problems: [`rows ${rows.length} != entity_row_count ${st.entity_row_count}`] };
    return compare(fingerprint(bk.payload), fingerprint(hydrate(st.payload, rows, st.entity_present_keys)));
  });
}

// Safe rollback: turn the CURRENT entity-backed state back into legacy-full (keeps writes made since the migration).
export async function rollbackToLegacy(db, tenant) {
  return db.transaction(async tx => {
    const st = await tx.getStateForUpdate(tenant);
    if (!st) throw new Error('tenant_not_found');
    if (st.storage_mode !== 'entity-backed') throw new Error('not_entity_backed:' + st.storage_mode);
    const rows = await tx.readRows(tenant);
    if (rows.length !== Number(st.entity_row_count)) throw new Error('rows_inconsistent_refusing_rollback');
    const full = hydrate(st.payload, rows, st.entity_present_keys);
    await tx.setLegacyFull(tenant, full);
    return { tenant, status: 'rolled_back_to_legacy_full', rows: rows.length };
  });
}

// Exact restore of the payload as it was at backup time. LOSES everything saved after the migration => needs force.
export async function restoreBackup(db, tenant, backupId, { force = false } = {}) {
  if (!force) throw new Error('restore_loses_newer_changes: pass force');
  return db.transaction(async tx => {
    const bk = await tx.getBackup(backupId);
    if (!bk || bk.tenant_key !== tenant) throw new Error('backup_not_found_for_tenant');
    await tx.getStateForUpdate(tenant);
    await tx.setLegacyFull(tenant, bk.payload, { dropRows: true });
    return { tenant, status: 'restored_from_backup', backupId };
  });
}

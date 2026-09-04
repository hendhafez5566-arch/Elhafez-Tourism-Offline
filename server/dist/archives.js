import { createHash } from 'node:crypto';
import { pool, withTx } from './context.js';
import { currentState, currentStateForUpdate, persistStateRecord } from './state.js';
import { createBackup, liveFileManifest, fileBlobsForManifest, garbageCollectBlobs } from './backups.js';
import { syncEntityMirror } from './entity-mirror.js';
const OPEN = new Set(['draft', 'open', 'partial', 'pending', 'approved', 'confirmed', 'active', 'inprogress', 'reserved', 'issued', 'received', 'deposited', 'scheduled', 'processing', 'cancelrequested']);
const CLOSED = new Set(['paid', 'settled', 'closed', 'completed', 'cancelled', 'canceled', 'void', 'reversed', 'rejected', 'cleared', 'expired', 'done', 'posted']);
const datedCollections = ['quotations', 'purchaseOrders', 'bookings', 'travelers', 'roomAllocations', 'services', 'invoices', 'invoiceAdjustments', 'receipts', 'payments', 'cheques', 'expenses', 'prepaidSchedules', 'commissions', 'manualJournalDrafts', 'journals', 'documents', 'transfers', 'cashCounts', 'bankReconciliations', 'fxRevaluations', 'approvals', 'auditLog', 'dataImports', 'supportNotes', 'umrahContractReservations', 'umrahBookings', 'umrahTravelers', 'umrahHotelRooms', 'umrahVisaBatches', 'umrahVisaItems', 'umrahTickets', 'umrahBusRuns', 'umrahOperationTasks', 'umrahIncidents', 'umrahSupplierCommitments', 'umrahActivity', 'umrahOutbox'];
const canonical = (x) => x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? `[${x.map(canonical).join(',')}]` : `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}`;
const digest = (x) => createHash('sha256').update(canonical(x)).digest('hex');
const blobDigest = (x) => createHash('sha256').update(Buffer.from(x)).digest('hex');
const recDate = (x) => String(x?.date || x?.createdAt || x?.updatedAt || x?.dueDate || x?.startDate || '').slice(0, 10);
const status = (x) => String(x?.status || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
const isClosed = (name, x) => { const s = status(x); if (OPEN.has(s))
    return false; if (['receipts', 'payments', 'journals', 'documents', 'auditLog', 'transfers', 'cashCounts', 'bankReconciliations', 'fxRevaluations'].includes(name))
    return ['posted', 'reversed', 'void', 'closed', 'completed', 'cleared'].includes(s) || !s; return CLOSED.has(s); };
const bytes = (x) => Buffer.byteLength(JSON.stringify(x));
function accountType(payload, id) { return String((payload.accounts || []).find((a) => String(a.id) === String(id))?.type || ''); }
function openingJournal(payload, cutoff, nextDate) { const groups = new Map(); for (const j of payload.journals || []) {
    if (j?.status !== 'posted' || String(j.date || '') > cutoff)
        continue;
    for (const l of j.lines || []) {
        const type = accountType(payload, l.accountId);
        if (['revenue', 'expense'].includes(type))
            continue;
        const key = [l.accountId, l.currency || payload.settings?.baseCurrency || 'EGP', l.partyType || '', l.partyId || '', l.treasuryId || '', l.costCenterId || ''].join('|'), g = groups.get(key) || { accountId: l.accountId, currency: l.currency || payload.settings?.baseCurrency || 'EGP', partyType: l.partyType || '', partyId: l.partyId || '', treasuryId: l.treasuryId || '', costCenterId: l.costCenterId || '', native: 0, base: 0 };
        g.native += Number(l.debit || 0) - Number(l.credit || 0);
        g.base += Number(l.baseDebit || 0) - Number(l.baseCredit || 0);
        groups.set(key, g);
    }
} const lines = []; let baseNet = 0; for (const g of groups.values()) {
    if (Math.abs(g.base) <= .005 && Math.abs(g.native) <= .000001)
        continue;
    baseNet += g.base;
    const common = { accountId: g.accountId, currency: g.currency, partyType: g.partyType || undefined, partyId: g.partyId || undefined, treasuryId: g.treasuryId || undefined, costCenterId: g.costCenterId || undefined };
    if (Math.abs(g.native) > .000001) {
        const rate = Math.abs(g.base / g.native) || 1;
        lines.push({ ...common, debit: g.native > 0 ? g.native : 0, credit: g.native < 0 ? -g.native : 0, rate, baseDebit: g.base > 0 ? g.base : 0, baseCredit: g.base < 0 ? -g.base : 0, baseOnly: false });
    }
    else
        lines.push({ ...common, debit: 0, credit: 0, rate: 0, baseDebit: g.base > 0 ? g.base : 0, baseCredit: g.base < 0 ? -g.base : 0, baseOnly: true });
} if (Math.abs(baseNet) > .01)
    lines.push({ accountId: '3200', currency: payload.settings?.baseCurrency || 'EGP', debit: baseNet < 0 ? -baseNet : 0, credit: baseNet > 0 ? baseNet : 0, rate: 1, baseDebit: baseNet < 0 ? -baseNet : 0, baseCredit: baseNet > 0 ? baseNet : 0, baseOnly: false }); if (!lines.length)
    return null; return { id: `ARCH-OPEN-${nextDate}`, no: `OPEN-${nextDate.slice(0, 4)}`, date: nextDate, memo: `أرصدة افتتاحية مرحّلة حتى ${cutoff}`, refType: 'period-archive-opening', refId: cutoff, status: 'posted', createdAt: new Date().toISOString(), createdBy: 'system', lines }; }
function audit(payload, cutoff) { const blockers = [], warnings = []; for (const j of payload.journals || []) {
    if (j?.status !== 'posted' || String(j.date || '') > cutoff)
        continue;
    const d = (j.lines || []).reduce((s, l) => s + Number(l.baseDebit || 0), 0), c = (j.lines || []).reduce((s, l) => s + Number(l.baseCredit || 0), 0);
    if (Math.abs(d - c) > .01)
        blockers.push(`القيد ${j.no || j.id} غير متزن بفارق ${Math.abs(d - c).toFixed(2)}`);
} for (const p of payload.periods || []) {
    const end = String(p.endDate || p.to || '');
    if (end && end <= cutoff && String(p.status || '').toLowerCase() !== 'closed')
        blockers.push(`الفترة ${p.name || p.month || p.id} لم تُغلق بعد`);
} for (const name of ['invoices', 'bookings', 'umrahBookings', 'approvals', 'cheques']) {
    const n = (payload[name] || []).filter((x) => recDate(x) && recDate(x) <= cutoff && !isClosed(name, x)).length;
    if (n)
        warnings.push(`${n} سجل مفتوح في ${name} سيُرحّل للفترة الجديدة`);
} return { blockers: blockers.slice(0, 100), warnings: warnings.slice(0, 100) }; }
function collectRefs(obj, refs) { if (!obj || typeof obj !== 'object')
    return; if (Array.isArray(obj)) {
    for (const x of obj)
        collectRefs(x, refs);
    return;
} for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v) {
        if (k === 'customerId')
            refs.customers.add(v);
        else if (k === 'supplierId')
            refs.suppliers.add(v);
        else if (k === 'agentId')
            refs.agents.add(v);
        else if (k === 'branchId')
            refs.branches.add(v);
        else if (k === 'programId' || k === 'umrahProgramId')
            refs.umrahPrograms.add(v);
        else if (k === 'createdBy' || k === 'updatedBy' || k === 'userId')
            refs.users.add(v);
        else if (k === 'partyId') {
            const pt = String(obj.partyType || '');
            if (pt === 'supplier')
                refs.suppliers.add(v);
            else if (pt === 'agent')
                refs.agents.add(v);
            else
                refs.customers.add(v);
        }
    }
    collectRefs(v, refs);
} }
function periodPayload(payload, archivedParts, archivedAttachments, cutoff) { const refs = { customers: new Set(), suppliers: new Set(), agents: new Set(), branches: new Set(), users: new Set(), umrahPrograms: new Set() }; collectRefs(archivedParts, refs); const out = { meta: { ...(payload.meta || {}), archiveReadOnly: true, archivePeriodEnd: cutoff, archivedAt: new Date().toISOString() }, company: payload.company || {}, settings: payload.settings || {}, license: { ...(payload.license || {}), activationKey: '' }, accounts: payload.accounts || [], currencies: payload.currencies || [], fxRates: (payload.fxRates || []).filter((x) => !recDate(x) || recDate(x) <= cutoff), taxCodes: payload.taxCodes || [], costCenters: payload.costCenters || [], treasuries: payload.treasuries || [], serviceTypes: payload.serviceTypes || [], fiscalYears: payload.fiscalYears || [], periods: (payload.periods || []).filter((x) => !String(x.endDate || x.to || '') || String(x.endDate || x.to || '') <= cutoff), customers: (payload.customers || []).filter((x) => refs.customers.has(String(x.id))), suppliers: (payload.suppliers || []).filter((x) => refs.suppliers.has(String(x.id))), agents: (payload.agents || []).filter((x) => refs.agents.has(String(x.id))), branches: (payload.branches || []).filter((x) => refs.branches.has(String(x.id))), users: (payload.users || []).filter((x) => refs.users.has(String(x.id))).map((u) => { const x = { ...u }; delete x.passwordHash; delete x.passwordSalt; delete x.password; return x; }), umrahPrograms: (payload.umrahPrograms || []).filter((x) => refs.umrahPrograms.has(String(x.id))), attachments: archivedAttachments }; for (const name of datedCollections)
    out[name] = archivedParts[name] || []; for (const name of ['umrahProgramSegments', 'umrahProgramCosts'])
    out[name] = (payload[name] || []).filter((x) => refs.umrahPrograms.has(String(x.programId))); return out; }
function buildPlan(payload, cutoff) { const nextDate = new Date(`${cutoff}T12:00:00Z`); nextDate.setUTCDate(nextDate.getUTCDate() + 1); const next = nextDate.toISOString().slice(0, 10), active = structuredClone(payload), archived = {}, retained = {}, parts = {}, archivedIds = new Set(); for (const name of datedCollections) {
    const arr = Array.isArray(payload[name]) ? payload[name] : [], old = [], keep = [];
    for (const x of arr) {
        const d = recDate(x);
        if (d && d <= cutoff && isClosed(name, x)) {
            old.push(x);
            if (x?.id)
                archivedIds.add(String(x.id));
        }
        else
            keep.push(x);
    }
    parts[name] = old;
    archived[name] = old.length;
    retained[name] = keep.length;
    active[name] = keep;
} const oldAtt = [], keepAtt = []; for (const a of payload.attachments || []) {
    if (archivedIds.has(String(a.entityId || '')) || (recDate(a) && recDate(a) <= cutoff && archivedIds.has(String(a.id || ''))))
        oldAtt.push(a);
    else
        keepAtt.push(a);
} active.attachments = keepAtt; archived.attachments = oldAtt.length; retained.attachments = keepAtt.length; const opening = openingJournal(payload, cutoff, next); active.journals = (active.journals || []).filter((j) => String(j.date || '') > cutoff || j.status !== 'posted'); if (opening)
    active.journals.unshift(opening); active.documents = (active.documents || []).filter((d) => String(d.date || '') > cutoff || !isClosed('documents', d)); if (opening)
    active.documents.unshift({ id: `DOC-${opening.id}`, no: opening.no, date: next, type: 'journal', refId: opening.id, refNo: opening.no, title: opening.memo, status: 'posted' }); active.meta = { ...active.meta, currentPeriodStart: next, lastArchivedThrough: cutoff, lastArchiveAt: new Date().toISOString() }; const archivePayload = periodPayload(payload, parts, oldAtt, cutoff), check = audit(payload, cutoff), currentBytes = bytes(payload), nextBytes = bytes(active); return { active, opening, archivePayload, archivedAttachmentIds: oldAtt.map((x) => String(x.id || '')).filter(Boolean), archived, retained, check, currentBytes, nextBytes, reductionBytes: Math.max(0, currentBytes - nextBytes), totalRecords: Object.values(payload).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0), archivedRecords: Object.values(archived).reduce((n, v) => n + Number(v || 0), 0) }; }
function summary(payload, plan, manifest, cutoff) { return { period: cutoff.slice(0, 4), periodEnd: cutoff, closedAt: new Date().toISOString(), customers: (payload.customers || []).length, suppliers: (payload.suppliers || []).length, invoices: (payload.invoices || []).length, bookings: (payload.bookings || []).length + (payload.umrahBookings || []).length, journals: (payload.journals || []).length, attachments: manifest.length, records: plan.archivedRecords || datedCollections.reduce((n, name) => n + (Array.isArray(payload[name]) ? payload[name].length : 0), 0) + manifest.length }; }
async function archiveManifest(t, attachmentIds) { const all = await liveFileManifest(t), set = new Set(attachmentIds); return all.filter((x) => set.has(String(x.id))); }
export async function archivePreview(t, cutoff) { if (!/^\d{4}-12-31$/.test(cutoff))
    throw Object.assign(new Error('الأرشفة السنوية تكون حتى 31/12 من السنة المطلوبة'), { statusCode: 400 }); if (cutoff >= new Date().toISOString().slice(0, 10))
    throw Object.assign(new Error('لا يمكن أرشفة الفترة الحالية قبل انتهائها'), { statusCode: 409 }); const exists = await pool.query(`select 1 from erp_period_archives where tenant_key=$1 and extract(year from period_end)=extract(year from $2::date) limit 1`, [t, cutoff]); if (exists.rowCount)
    throw Object.assign(new Error('هذه السنة مؤرشفة بالفعل'), { statusCode: 409 }); const st = await currentState(t); if (!st?.payload)
    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const plan = buildPlan(st.payload, cutoff), checksum = digest(st.payload), token = digest({ t, revision: Number(st.revision), cutoff, checksum }); return { periodEnd: cutoff, revision: Number(st.revision), token, checksum, archived: plan.archived, retained: plan.retained, check: plan.check, currentBytes: plan.currentBytes, nextBytes: plan.nextBytes, reductionBytes: plan.reductionBytes, totalRecords: plan.totalRecords, archivedRecords: plan.archivedRecords, opening: plan.opening ? { lines: plan.opening.lines.length, date: plan.opening.date } : null }; }
export async function closeAndArchive(t, userId, input) { const cutoff = String(input?.periodEnd || ''), expectedRevision = Number(input?.revision || 0), token = String(input?.token || ''); if (!token)
    throw Object.assign(new Error('نفّذ معاينة الأرشفة أولًا'), { statusCode: 409 }); const st = await currentState(t); if (!st?.payload)
    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const plan0 = buildPlan(st.payload, cutoff); if (plan0.check.blockers.length)
    throw Object.assign(new Error(`لا يمكن الأرشفة: ${plan0.check.blockers[0]}`), { statusCode: 409 }); const safety = await createBackup(t, `قبل إغلاق فترة ${cutoff.slice(0, 4)}`, 'pre-period', userId); return withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [`archive:${t}`]); const row = await currentStateForUpdate(c, t); if (!row)
    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const checksum = digest(row.payload), valid = digest({ t, revision: Number(row.revision), cutoff, checksum }); if (Number(row.revision) !== expectedRevision || valid !== token)
    throw Object.assign(new Error('تغيرت البيانات بعد المعاينة. أعد المعاينة.'), { statusCode: 409 }); const plan = buildPlan(row.payload, cutoff); if (plan.check.blockers.length)
    throw Object.assign(new Error(`لا يمكن الأرشفة: ${plan.check.blockers[0]}`), { statusCode: 409 }); const manifest = await archiveManifest(t, plan.archivedAttachmentIds), archiveChecksum = digest({ data: plan.archivePayload, attachments: manifest }), sum = summary(plan.archivePayload, plan, manifest, cutoff), size = bytes(plan.archivePayload) + manifest.reduce((n, x) => n + Number(x.size || 0), 0), periodKey = cutoff.slice(0, 4); const ar = await c.query(`insert into erp_period_archives(tenant_key,period_key,period_label,period_start,period_end,source_revision,schema_version,payload,summary,checksum_sha256,backup_id,status,created_by,attachment_manifest,size_bytes,integrity_status) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,'verified',$12,$13::jsonb,$14,'verified') returning id,created_at`, [t, periodKey, `أرشيف ${periodKey}`, `${periodKey}-01-01`, cutoff, Number(row.revision), row.schema_version, JSON.stringify(plan.archivePayload), JSON.stringify(sum), archiveChecksum, safety.id, userId, JSON.stringify(manifest), size]); await syncEntityMirror(c, t, row.payload, plan.active); const up = await persistStateRecord(c, t, plan.active, row.schema_version); if (plan.archivedAttachmentIds.length)
    await c.query('delete from erp_file_refs where tenant_key=$1 and file_id=any($2::text[])', [t, plan.archivedAttachmentIds]); await c.query('insert into erp_archive_events(tenant_key,archive_id,action,details,user_id) values($1,$2,$3,$4::jsonb,$5)', [t, ar.rows[0].id, 'close', JSON.stringify(sum), userId]); await c.query('delete from erp_sessions where tenant_key=$1 and user_id<>$2', [t, userId]); return { ok: true, id: Number(ar.rows[0].id), revision: up.revision, updatedAt: up.updated_at, summary: sum, checksum: archiveChecksum, sizeBytes: size }; }); }
export async function listArchives(t) { const r = await pool.query(`select id,period_key,period_label,period_start,period_end,source_revision,schema_version,summary,checksum_sha256,status,created_by,created_at,size_bytes,integrity_status,jsonb_array_length(coalesce(attachment_manifest,'[]'::jsonb)) attachment_count from erp_period_archives where tenant_key=$1 order by period_end desc,id desc`, [t]); return r.rows.map((x) => ({ ...x, id: Number(x.id), source_revision: Number(x.source_revision), size_bytes: Number(x.size_bytes || 0), attachment_count: Number(x.attachment_count || 0) })); }
export async function verifyArchive(t, id) { const r = await pool.query('select payload,checksum_sha256,attachment_manifest from erp_period_archives where tenant_key=$1 and id=$2', [t, id]); if (!r.rowCount)
    throw Object.assign(new Error('archive_not_found'), { statusCode: 404 }); const row = r.rows[0], manifest = row.attachment_manifest || []; let ok = digest({ data: row.payload, attachments: manifest }) === String(row.checksum_sha256 || ''); const blobs = await fileBlobsForManifest(t, manifest), map = new Map(blobs.map((x) => [x.sha256, x])); for (const m of manifest) {
    const b = map.get(m.sha256);
    if (!b || blobDigest(b.data) !== m.sha256) {
        ok = false;
        break;
    }
} await pool.query('update erp_period_archives set integrity_status=$3 where tenant_key=$1 and id=$2', [t, id, ok ? 'verified' : 'failed']); return { ok, status: ok ? 'verified' : 'failed', checksum: row.checksum_sha256 }; }
export async function getArchive(t, id) { const r = await pool.query('select id,period_label,period_end,payload,summary,checksum_sha256,created_at,size_bytes,integrity_status,attachment_manifest from erp_period_archives where tenant_key=$1 and id=$2', [t, id]); if (!r.rowCount)
    throw Object.assign(new Error('archive_not_found'), { statusCode: 404 }); const row = r.rows[0]; return { ...row, id: Number(row.id), size_bytes: Number(row.size_bytes || 0), readOnly: true }; }
export async function exportArchive(t, id) { const a = await getArchive(t, id), check = await verifyArchive(t, id); if (!check.ok)
    throw Object.assign(new Error('archive_integrity_failed'), { statusCode: 409 }); const blobs = await fileBlobsForManifest(t, a.attachment_manifest || []); return { format: 'erp-professional-suite-archive', formatVersion: 4, kind: 'archive', schema: a.payload?.meta?.schema || '', appVersion: a.payload?.meta?.version || '', companyId: String(a.payload?.company?.companyId || ''), companyName: String(a.payload?.company?.name || ''), archiveThrough: String(a.period_end).slice(0, 10), label: a.period_label, exportedAt: new Date().toISOString(), checksum: a.checksum_sha256, data: a.payload, attachments: a.attachment_manifest || [], blobs: blobs.map((b) => ({ sha256: b.sha256, mime: b.mime, size: b.size, data: Buffer.from(b.data).toString('base64') })) }; }
export async function deleteArchive(t, id, userId) { const r = await pool.query('delete from erp_period_archives where tenant_key=$1 and id=$2 returning id', [t, id]); if (!r.rowCount)
    throw Object.assign(new Error('archive_not_found'), { statusCode: 404 }); await pool.query('insert into erp_archive_events(tenant_key,archive_id,action,details,user_id) values($1,null,$2,$3::jsonb,$4)', [t, 'delete', JSON.stringify({ archiveId: id }), userId]); await garbageCollectBlobs(t); return { ok: true }; }
export async function migrateLegacyArchives() { const rows = await pool.query(`select id,tenant_key,period_end,payload,checksum_sha256,attachment_manifest from erp_period_archives order by id`); for (const a of rows.rows) {
    if (Array.isArray(a.attachment_manifest) && a.attachment_manifest.length && a.payload?.meta?.archiveReadOnly)
        continue;
    try {
        const plan = buildPlan(a.payload, String(a.period_end).slice(0, 10)), manifest = await archiveManifest(a.tenant_key, plan.archivedAttachmentIds), payload = plan.archivePayload, checksum = digest({ data: payload, attachments: manifest }), sum = summary(payload, plan, manifest, String(a.period_end).slice(0, 10)), size = bytes(payload) + manifest.reduce((n, x) => n + Number(x.size || 0), 0);
        await pool.query(`update erp_period_archives set payload=$2::jsonb,summary=$3::jsonb,checksum_sha256=$4,attachment_manifest=$5::jsonb,size_bytes=$6,integrity_status='verified',backup_id=null where id=$1`, [a.id, JSON.stringify(payload), JSON.stringify(sum), checksum, JSON.stringify(manifest), size]);
    }
    catch (e) {
        console.warn('Legacy archive migration skipped', a.id, e?.message || e);
    }
} }
export async function purgeLegacyServerCopies(t) { return { backups: (await pool.query('select count(*)::int n from erp_backup_files bf join erp_backups b on b.id=bf.backup_id where b.tenant_key=$1', [t])).rows[0].n, archives: 0 }; }
export async function legacyServerCopyCounts(t) { const b = (await pool.query('select count(*)::int n from erp_backup_files bf join erp_backups x on x.id=bf.backup_id where x.tenant_key=$1', [t])).rows[0].n; return { backupFiles: b }; }
export const __archiveTest = { buildPlan, digest, audit, periodPayload };

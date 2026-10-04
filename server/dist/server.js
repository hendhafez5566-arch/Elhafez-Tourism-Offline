import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pbkdf2 } from 'node:crypto';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { pool, port, tenant, json, bodyJson, bodyBuffer, sha, safeEq, sessionCookie, securityHeaders, fileResponseHeaders, withTx, clientIp, userAgent, appVersion, vendorAgentKey, apiCorsHeaders, allowFactoryReset } from './context.js';
import { runMigrations } from './migrations.js';
import { licenseStatus, moduleAllowed, writeAllowed, acceptVendorEntitlement } from './license.js';
import { auth, createSession, listSessions, requestSessionToken } from './session.js';
import { loadState as currentState, loadStateForUpdate as currentStateForUpdate, clientPayload, mergeUserSecrets, assertUserDirectoryChangeAllowed, mergeScopedPayload, mergeConcurrentPayload, saveState as persistStateRecord, createState as insertStateRecord } from './repository/state-repository.js';
import { applyStatePatch } from './state-patch.js';
import { syncEntityMirror, rebuildEntityMirror, initializeEntityMirrorMetadata, entityMirrorStatus } from './entity-mirror.js';
import { assertStateChangeAllowed, assertBranchChangesAllowed, assertCommercialLimits, assertRecordLifecycle, assertFinancialImmutability, assertApprovalWorkflow, hasPermission, allowedBranches } from './authz.js';
import { emailRecoveryStatus, issueEmailVerification, requestRecovery, verifyEmailToken, resetPasswordWithToken } from './auth-recovery.js';
import { archivePreview, closeAndArchive, listArchives, getArchive, exportArchive, deleteArchive, verifyArchive, migrateLegacyArchives, purgeLegacyServerCopies, legacyServerCopyCounts } from './archives.js';
import { createBackup, listBackups, setBackupPinned, deleteBackup, cleanOldBackups, restoreBackup, verifyBackup, maybeAutoBackup, backupBeforeUpgrade, migrateLegacyFiles, storeLiveFile, readLiveFile, deleteLiveFile } from './backups.js';
import { ensureVendorSchema, vendorPublicStatus, vendorOwnerAllowed, handleVendorApi, handleVendorPublicApi, vendorStartupSync, vendorAutomaticRollout } from './vendor.js';
const vendorMode = false;
const staticRoot = resolve(fileURLToPath(new URL('../../dist/', import.meta.url)));
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.map': 'application/json; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const staticCache = new Map();
const CRITICAL_AUDIT_COLLECTIONS = ['users', 'branches', 'accounts', 'costCenters', 'treasuries', 'currencies', 'taxCodes', 'journals', 'manualJournalDrafts', 'invoices', 'invoiceAdjustments', 'receipts', 'payments', 'expenses', 'transfers', 'cheques', 'cashCounts', 'fxRevaluations', 'purchaseOrders', 'quotations', 'bookings', 'services', 'programs', 'umrahPrograms', 'umrahBookings', 'umrahSupplierCommitments', 'periods', 'fiscalYears', 'settings'];
const pbkdf2Async = promisify(pbkdf2);
async function verifyPassword(user, password) { if (user?.passwordAlgo === 'pbkdf2-sha256' && user?.passwordHash) {
    const it = Math.max(100000, Number(user.passwordIterations || 210000)), candidate = (await pbkdf2Async(password, String(user.passwordSalt || ''), it, 32, 'sha256')).toString('hex');
    return safeEq(candidate, String(user.passwordHash));
} if (user?.passwordHash) {
    const candidate = sha(`${user.passwordSalt || ''}|${password}`);
    return safeEq(candidate, String(user.passwordHash));
} return String(user?.password || '') === password; }
async function syncUserDirectory(c, t, users) { await c.query('delete from erp_users where tenant_key=$1', [t]); for (const user of users || []) {
    const id = String(user?.id || ''), username = String(user?.username || '').trim().toLowerCase();
    if (!id || !username)
        continue;
    await c.query(`insert into erp_users(tenant_key,user_id,username_normalized,active,user_data,updated_at) values($1,$2,$3,$4,$5::jsonb,now())`, [t, id, username, user?.active !== false, JSON.stringify(user)]);
} }
async function repairLegacyResetStates() {
    const rows = await pool.query(`select tenant_key,payload from erp_state where coalesce(payload->'meta'->>'setupComplete','false')<>'true' and coalesce(payload->'meta'->>'resetAt','')<>'' and coalesce(payload->'meta'->>'resetPending','false')<>'true'`);
    for (const row of rows.rows) {
        const t = String(row.tenant_key || 'default'), resetAt = String(row.payload?.meta?.resetAt || '');
        let admins = [], backupId = 0;
        const dir = await pool.query('select user_data from erp_users where tenant_key=$1 and active=true', [t]);
        admins = dir.rows.map((x) => x.user_data).filter((u) => u?.active !== false && admin(u));
        if (!admins.length) {
            const backups = await pool.query(`select id,payload from erp_backups where tenant_key=$1 and created_at<=coalesce($2::timestamptz,now()) and coalesce(integrity_status,'verified')<>'failed' order by created_at desc,id desc limit 20`, [t, resetAt || null]);
            for (const b of backups.rows) {
                const candidates = (b.payload?.meta?.setupComplete === true ? b.payload?.users : []) || [], found = candidates.filter((u) => u?.active !== false && admin(u));
                if (found.length) {
                    admins = found.map((u) => structuredClone(u));
                    backupId = Number(b.id || 0);
                    break;
                }
            }
        }
        await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [`legacy-reset:${t}`]); const cur = await currentStateForUpdate(c, t); if (!cur)
            return; const payload = structuredClone(cur.payload || {}); if (payload?.meta?.setupComplete === true || payload?.meta?.resetPending === true)
            return; payload.meta = { ...(payload.meta || {}), resetPending: true, resetExistingLogin: admins.length > 0, resetLegacyCompatibility: true, resetLegacyRecoveredAt: new Date().toISOString(), ...(backupId ? { resetLegacyAdminBackupId: backupId } : {}) }; await persistStateRecord(c, t, payload, cur.schema_version); if (admins.length)
            await syncUserDirectory(c, t, admins); });
        console.log(`[reset] legacy reset repaired for ${t}; previous admin login ${admins.length ? 'available' : 'not available'}${backupId ? ` from backup ${backupId}` : ''}`);
    }
    return rows.rowCount || 0;
}
function loginKey(req, t, username) { return `${t}|${clientIp(req)}|${username.toLowerCase()}`; }
async function loginBlocked(key) { await pool.query(`delete from erp_login_attempts where last_attempt_at<now()-interval '1 day'`); const r = await pool.query('select blocked_until from erp_login_attempts where attempt_key=$1', [key]); if (!r.rowCount || !r.rows[0].blocked_until)
    return 0; return Math.max(0, new Date(r.rows[0].blocked_until).getTime() - Date.now()); }
async function loginFailed(key, req, t, username) { const ip = clientIp(req), name = username.toLowerCase(); await withTx(async (c) => { await c.query(`insert into erp_login_attempts(attempt_key,tenant_key,ip_address,username_normalized,failure_count,last_attempt_at) values($1,$2,$3,$4,0,now()) on conflict(attempt_key) do nothing`, [key, t, ip, name]); const r = await c.query('select failure_count,last_attempt_at,blocked_until from erp_login_attempts where attempt_key=$1 for update', [key]), row = r.rows[0] || {}, last = Date.parse(String(row.last_attempt_at || '')), fresh = Number.isFinite(last) && Date.now() - last <= 15 * 60_000, count = (fresh ? Number(row.failure_count || 0) : 0) + 1, block = count >= 5; await c.query(`update erp_login_attempts set failure_count=$2,blocked_until=$3,last_attempt_at=now(),tenant_key=$4,ip_address=$5,username_normalized=$6 where attempt_key=$1`, [key, block ? 0 : count, block ? new Date(Date.now() + 5 * 60_000) : null, t, ip, name]); }); }
async function loginSucceeded(key) { await pool.query('delete from erp_login_attempts where attempt_key=$1', [key]); }
function admin(user) { return user?.role === 'admin' || user?.permissions?.all; }
async function auditEvent(c, t, a, action, changes, revision) { await c.query(`insert into erp_audit_events(tenant_key,revision,user_id,action,changes,ip_address,user_agent) values($1,$2,$3,$4,$5::jsonb,$6,$7)`, [t, revision || null, a?.user?.id || '', action, JSON.stringify(changes || []), a?.req ? clientIp(a.req) : '', a?.req ? userAgent(a.req) : '']); }
async function serveStatic(req, res) { let pathname; try {
    pathname = decodeURIComponent((req.url || '/').split('?')[0]);
}
catch {
    return json(res, 400, { error: 'Bad URL' });
} if (pathname === '/')
    pathname = '/index.html'; const relative = pathname.replace(/^\/+/, ''), file = normalize(join(staticRoot, relative)), inside = file === staticRoot || file.startsWith(staticRoot + sep); if (!inside)
    return json(res, 403, { error: 'Forbidden' }); try {
    let entry = staticCache.get(file);
    if (!entry) {
        const s = await stat(file);
        if (!s.isFile())
            throw new Error();
        const data = await readFile(file), type = contentTypes[extname(file)] || 'application/octet-stream', compressible = /^(text\/|application\/(javascript|json))/.test(type), gzip = compressible && data.length >= 1024 ? gzipSync(data, { level: 5 }) : null, etag = `\"${sha(data).slice(0, 24)}\"`;
        entry = { data, gzip: gzip && gzip.length < data.length ? gzip : null, etag, type };
        staticCache.set(file, entry);
    }
    const versioned = /[?&]v=[^&]+/.test(req.url || ''), isIndex = pathname === '/index.html', isServiceWorker = pathname === '/sw.js', cacheControl = isIndex || isServiceWorker ? 'no-store' : versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300', accepts = String(req.headers['accept-encoding'] || ''), useGzip = !!entry.gzip && /\bgzip\b/i.test(accepts), data = useGzip && entry.gzip ? entry.gzip : entry.data;
    if (req.headers['if-none-match'] === entry.etag) {
        res.writeHead(304, { ...securityHeaders(), 'ETag': entry.etag, 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' });
        return res.end();
    }
    const h = { ...securityHeaders(), 'Content-Type': entry.type, 'Content-Length': String(data.length), 'Cache-Control': cacheControl, 'ETag': entry.etag, 'Vary': 'Accept-Encoding' };
    if (useGzip)
        h['Content-Encoding'] = 'gzip';
    res.writeHead(200, h);
    res.end(data);
}
catch {
    json(res, 404, { error: 'Not found' });
} }
const server = http.createServer(async (req, res) => {
    try {
        const requestUrl = new URL(req.url || '/', 'http://erp.local'), url = requestUrl.pathname, t = tenant(req);
        if (!url.startsWith('/api/'))
            return serveStatic(req, res);
        if (req.method === 'OPTIONS') {
            const cors = apiCorsHeaders(req);
            if (!Object.keys(cors).length)
                return json(res, 403, { error: 'cors_origin_denied' });
            res.writeHead(204, { ...securityHeaders(), ...cors, 'Content-Length': '0', 'Vary': 'Origin' });
            return res.end();
        }
        if (url === '/api/health' && req.method === 'GET') {
            const healthQuery = { text: 'select 1', query_timeout: 3000 };
            await pool.query(healthQuery);
            return json(res, 200, { ok: true, database: 'postgresql', version: appVersion });
        }
        const forceLicenseRefresh = url === '/api/license' && req.method === 'GET' && requestUrl.searchParams.get('refresh') === '1';
        const license = await licenseStatus(t, forceLicenseRefresh);
        if (url === '/api/bootstrap' && req.method === 'GET') {
            const a = await auth(req, t), st = await currentState(t);
            if (st?.payload)
                maybeAutoBackup(t, st).catch(e => console.warn('Automatic snapshot failed', e?.message || e));
            return json(res, 200, { setupComplete: !!st?.payload?.meta?.setupComplete, resetPending: !!st?.payload?.meta?.resetPending, existingLoginAvailable: !!st?.payload?.meta?.resetExistingLogin, authenticated: !!a, userId: a?.user?.id || '', revision: Number(st?.revision || 0), license, emailRecovery: emailRecoveryStatus(), vendor: vendorPublicStatus(a?.user), company: st ? { name: st.payload?.company?.name || '', logo: st.payload?.company?.logo || '', productName: (!st.payload?.settings?.productName || ['ERP Professional Suite', 'Elhafez Travel ERP'].includes(st.payload?.settings?.productName)) ? 'Elhafez' : st.payload.settings.productName, companyId: st.payload?.company?.companyId || '' } : null });
        }
        if (url === '/api/license' && req.method === 'GET')
            return json(res, 200, license);
        if (await handleVendorPublicApi(req, res, url))
            return;
        if (url === '/api/vendor-agent/entitlement' && req.method === 'POST') {
            const b = await bodyJson(req, 64 * 1024), next = await acceptVendorEntitlement(t, String(b?.token || ''));
            return json(res, 200, { ok: true, status: next.status, mode: next.mode, edition: next.edition, expiresAt: next.expiresAt, source: next.source });
        }
        if (url === '/api/vendor-agent/security' && req.method === 'POST') {
            const provided = String(req.headers['x-erp-vendor-key'] || '').trim();
            if (!vendorAgentKey || !safeEq(provided, vendorAgentKey))
                return json(res, 403, { error: 'forbidden' });
            const b = await bodyJson(req, 64 * 1024), action = String(b?.action || ''), st = await currentState(t);
            if (!st?.payload)
                return json(res, 404, { error: 'company_not_initialized' });
            const adminUser = (st.payload.users || []).find((u) => u.role === 'admin' && u.active !== false);
            if (!adminUser)
                return json(res, 404, { error: 'company_admin_not_found' });
            if (action === 'logout_all') {
                const deleted = await pool.query('delete from erp_sessions where tenant_key=$1 returning token_hash', [t]);
                return json(res, 200, { ok: true, action, sessionsEnded: deleted.rowCount || 0 });
            }
            if (action === 'force_password_change') {
                const payload = structuredClone(st.payload), target = (payload.users || []).find((u) => u.id === adminUser.id);
                target.mustChangePassword = true;
                const revision = await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [t]); const locked = await currentStateForUpdate(c, t); if (!locked)
                    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const next = structuredClone(locked.payload), lockedTarget = (next.users || []).find((u) => u.id === adminUser.id); if (!lockedTarget)
                    throw Object.assign(new Error('company_admin_not_found'), { statusCode: 404 }); lockedTarget.mustChangePassword = true; await c.query('insert into erp_state_history(tenant_key,revision,schema_version,payload) values($1,$2,$3,$4::jsonb)', [t, locked.revision, locked.schema_version || '', JSON.stringify(locked.payload)]); const u = await persistStateRecord(c, t, next, locked.schema_version); await c.query('delete from erp_sessions where tenant_key=$1', [t]); await auditEvent(c, t, { user: { id: 'vendor-owner' }, req }, 'vendor-force-password-change', [{ collection: 'users', updated: 1 }], u.revision); return u.revision; });
                return json(res, 200, { ok: true, action, revision });
            }
            if (action === 'send_recovery') {
                if (!String(adminUser.email || '').trim())
                    return json(res, 409, { error: 'company_admin_email_missing' });
                const out = adminUser.emailVerifiedAt ? await requestRecovery(t, adminUser.email, req) : await issueEmailVerification(t, adminUser, req);
                return json(res, 200, { ok: true, action, email: String(adminUser.email).replace(/^(.{2}).*(@.*)$/, '$1***$2'), sent: !!(('sent' in out) && out.sent), verificationRequired: !adminUser.emailVerifiedAt });
            }
            return json(res, 400, { error: 'unsupported_security_action' });
        }
        if (url === '/api/vendor-agent/backup' && req.method === 'POST') {
            const provided = String(req.headers['x-erp-vendor-key'] || '').trim();
            if (!vendorAgentKey || !safeEq(provided, vendorAgentKey))
                return json(res, 403, { error: 'forbidden' });
            return json(res, 200, { ok: true, externalOnly: true, serverBackup: false });
        }
        if (url === '/api/auth/setup' && req.method === 'POST') {
            const existing = await currentState(t);
            if (existing?.payload?.meta?.setupComplete)
                return json(res, 409, { error: 'تم إعداد هذه الشركة بالفعل' });
            if (!writeAllowed(license))
                return json(res, 402, { error: 'انتهت الفترة التجريبية. فعّل الترخيص قبل إعداد نسخة جديدة' });
            const b = await bodyJson(req), payload = b?.data, setupPassword = String(b?.setupPassword || ''), adminUser = (payload?.users || []).find((u) => u.role === 'admin' && u.active !== false);
            if (!payload || typeof payload !== 'object' || !payload?.meta?.setupComplete || !adminUser?.id || !adminUser?.passwordHash)
                return json(res, 400, { error: 'بيانات الإعداد غير مكتملة' });
            if (!setupPassword || !(await verifyPassword(adminUser, setupPassword)))
                return json(res, 400, { error: 'تعذر التحقق من كلمة مرور مدير النظام أثناء الإعداد' });
            if (!String(adminUser.username || '').trim())
                return json(res, 400, { error: 'اسم مستخدم المدير مطلوب' });
            const adminEmail = String(adminUser.email || '').trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminEmail.length > 254)
                return json(res, 400, { error: 'بريد مدير النظام مطلوب ويجب أن يكون صحيحًا' });
            adminUser.email = adminEmail;
            adminUser.emailVerifiedAt = '';
            if ((payload.users || []).filter((u) => u.active !== false).length > license.maxUsers)
                return json(res, 403, { error: 'عدد المستخدمين يتجاوز حد الترخيص' });
            if ((payload.branches || []).filter((x) => x.active !== false).length > license.maxBranches)
                return json(res, 403, { error: 'عدد الفروع يتجاوز حد الترخيص' });
            payload.license = { ...payload.license, ...license, activationKey: '' };
            payload.company = { ...payload.company, companyId: payload.company?.companyId || existing?.payload?.company?.companyId || license.companyId || license.installationId };
            payload.meta = { ...(payload.meta || {}), setupComplete: true, resetPending: false, resetExistingLogin: false };
            const schemaVersion = String(payload?.meta?.schema || existing?.schema_version || '');
            const setupRevision = await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [t]); if (existing) {
                if (!existing?.payload?.meta?.resetPending)
                    throw Object.assign(new Error('هذه النسخة غير مهيأة للإعداد الجديد'), { statusCode: 409 });
                await rebuildEntityMirror(c, t, payload);
                const up = await persistStateRecord(c, t, payload, schemaVersion);
                await syncUserDirectory(c, t, payload.users || []);
                await auditEvent(c, t, { user: adminUser, req }, 'setup-after-reset', [{ collection: 'system', added: 1 }], up.revision);
                return up.revision;
            } await rebuildEntityMirror(c, t, payload); await insertStateRecord(c, t, payload, schemaVersion, 1); await c.query('insert into erp_state_history(tenant_key,revision,schema_version,payload) values($1,1,$2,$3::jsonb)', [t, schemaVersion, JSON.stringify(payload)]); await syncUserDirectory(c, t, payload.users || []); await auditEvent(c, t, { user: adminUser, req }, 'setup', [{ collection: 'system', added: 1 }], 1); return 1; });
            const ss = await createSession(req, t, adminUser.id), verification = await issueEmailVerification(t, adminUser, req).catch(e => { console.warn('Initial email verification failed', e?.message || e); return { sent: false, configured: emailRecoveryStatus().configured }; });
            return json(res, 200, { ok: true, setupComplete: true, authenticated: true, userId: adminUser.id, revision: setupRevision, license, vendor: vendorPublicStatus(adminUser), emailVerificationSent: !!verification?.sent, emailRecoveryConfigured: !!verification?.configured, data: clientPayload(payload, adminUser, license) }, { 'Set-Cookie': ss.header });
        }
        if (url === '/api/auth/email/verify' && req.method === 'POST') {
            const b = await bodyJson(req, 64 * 1024), out = await verifyEmailToken(t, b?.token, req);
            return json(res, 200, out);
        }
        if (url === '/api/auth/recovery/request' && req.method === 'POST') {
            const b = await bodyJson(req, 64 * 1024), out = await requestRecovery(t, b?.email, req);
            return json(res, 200, out);
        }
        if (url === '/api/auth/recovery/reset' && req.method === 'POST') {
            const b = await bodyJson(req, 64 * 1024), out = await resetPasswordWithToken(t, b?.token, b?.password, req);
            return json(res, 200, out);
        }
        if (url === '/api/auth/login' && req.method === 'POST') {
            const b = await bodyJson(req), username = String(b?.username || '').trim(), password = String(b?.password || ''), key = loginKey(req, t, username), blocked = await loginBlocked(key);
            if (blocked > 0)
                return json(res, 429, { error: 'محاولات دخول كثيرة. حاول مرة أخرى بعد عدة دقائق' });
            const ur = await pool.query('select user_data from erp_users where tenant_key=$1 and username_normalized=$2 and active=true limit 1', [t, username.toLowerCase()]), user = ur.rows[0]?.user_data;
            if (!user || !(await verifyPassword(user, password))) {
                await loginFailed(key, req, t, username);
                return json(res, 401, { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            }
            let st = await currentState(t), resetRestored = false;
            if (!st?.payload?.meta?.setupComplete) {
                if (!st?.payload?.meta?.resetPending)
                    return json(res, 409, { error: 'النظام يحتاج الإعداد لأول مرة' });
                if (!admin(user))
                    return json(res, 403, { error: 'بعد إعادة التهيئة يجب الدخول بحساب المدير السابق' });
                const restored = await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [t]); const row = await currentStateForUpdate(c, t); if (!row)
                    throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const payload = structuredClone(row.payload || {}); if (payload?.meta?.setupComplete)
                    return { payload, schema_version: row.schema_version, revision: Number(row.revision) }; if (!payload?.meta?.resetPending)
                    throw Object.assign(new Error('النظام يحتاج الإعداد لأول مرة'), { statusCode: 409 }); payload.users = [structuredClone(user)]; payload.meta = { ...(payload.meta || {}), setupComplete: true, resetPending: false, resetExistingLogin: false, resetRestoredAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; const up = await persistStateRecord(c, t, payload, row.schema_version); await syncUserDirectory(c, t, [user]); await auditEvent(c, t, { user, req }, 'reset-existing-login', [{ collection: 'system', restored: 1 }], up.revision); return { payload, schema_version: row.schema_version, revision: up.revision }; });
                st = restored;
                resetRestored = true;
            }
            if (!st)
                throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 });
            const activeBranches = (st.payload?.branches || []).filter((b) => b.active !== false);
            if (activeBranches.length && !admin(user)) {
                const allowed = allowedBranches(user, st.payload);
                if (!allowed || allowed.size === 0)
                    return json(res, 403, { error: 'لا يوجد فرع نشط مسموح لهذا المستخدم. راجع مسؤول النظام' });
            }
            await loginSucceeded(key);
            const ss = await createSession(req, t, user.id);
            return json(res, 200, { ok: true, userId: user.id, revision: Number(st.revision), license, vendor: vendorPublicStatus(user), readOnly: !writeAllowed(license), resetRestored, data: clientPayload(st.payload, user, license) }, { 'Set-Cookie': ss.header });
        }
        if (url === '/api/auth/logout' && req.method === 'POST') {
            const token = requestSessionToken(req);
            if (token)
                await pool.query('delete from erp_sessions where token_hash=$1 and tenant_key=$2', [sha(token), t]);
            return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        const aRaw = await auth(req, t);
        if (!aRaw)
            return json(res, 401, { error: 'unauthorized' });
        const a = aRaw;
        a.req = req;
        const hydrateState = async () => { if (a.payload)
            return a; const st = await currentState(t); if (!st?.payload)
            throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); Object.assign(a, { payload: st.payload, revision: Number(st.revision), schemaVersion: st.schema_version || null, updatedAt: st.updated_at || null }); return a; };
        if (url === '/api/vendor/status' && req.method === 'GET')
            return json(res, 200, vendorPublicStatus(a.user));
        if (url === '/api/license' && req.method === 'POST')
            return json(res, 405, { error: 'يتم إدارة الترخيص من مركز المالك، ويمكن تحديث حالته من صفحة الترخيص داخل النظام' });
        if (url.startsWith('/api/vendor/')) {
            if (!vendorOwnerAllowed(a.user))
                return json(res, 404, { error: 'vendor_not_available' });
            await hydrateState();
            if (await handleVendorApi(req, res, url, a))
                return;
        }
        const fileMatch = url.match(/^\/api\/files\/([^/]+)$/);
        if (fileMatch && req.method === 'GET') {
            if (!hasPermission(a.user, 'documents', 'view'))
                return json(res, 403, { error: 'forbidden' });
            const id = decodeURIComponent(fileMatch[1]), f = await readLiveFile(t, id);
            if (!f)
                return json(res, 404, { error: 'file_not_found' });
            const data = Buffer.from(f.data);
            res.writeHead(200, { ...securityHeaders(), ...fileResponseHeaders(f.mime || '', f.file_name || id), 'Content-Length': String(data.length), 'Cache-Control': 'private, no-store' });
            return res.end(data);
        }
        if (fileMatch && req.method === 'PUT') {
            if (!writeAllowed(license))
                return json(res, 402, { error: 'الترخيص منتهي — الوضع قراءة فقط' });
            if (!hasPermission(a.user, 'documents', 'add'))
                return json(res, 403, { error: 'forbidden' });
            const id = decodeURIComponent(fileMatch[1]), data = await bodyBuffer(req, 21 * 1024 * 1024);
            if (!data.length)
                return json(res, 400, { error: 'empty_file' });
            const name = decodeURIComponent(String(req.headers['x-file-name'] || id)).slice(0, 500), mime = String(req.headers['content-type'] || 'application/octet-stream').slice(0, 200), out = await storeLiveFile(t, id, name, mime, data);
            return json(res, 200, { ok: true, size: data.length, sha256: out.sha256 });
        }
        if (fileMatch && req.method === 'DELETE') {
            if (!writeAllowed(license))
                return json(res, 402, { error: 'الترخيص منتهي — الوضع قراءة فقط' });
            if (!hasPermission(a.user, 'documents', 'delete'))
                return json(res, 403, { error: 'forbidden' });
            const id = decodeURIComponent(fileMatch[1]);
            await deleteLiveFile(t, id);
            return json(res, 200, { ok: true });
        }
        await hydrateState();
        if (url === '/api/data-protection/export-state' && req.method === 'GET') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const data = structuredClone(a.payload);
            if (data.license)
                data.license = { ...data.license, ...license, activationKey: '' };
            return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' });
        }
        if (url === '/api/data-protection/purge-legacy' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await purgeLegacyServerCopies(t));
        }
        if (url === '/api/archives/preview' && req.method === 'POST') {
            if (!admin(a.user) && !hasPermission(a.user, 'periods', 'approve'))
                return json(res, 403, { error: 'forbidden' });
            const b = await bodyJson(req, 64 * 1024);
            return json(res, 200, await archivePreview(t, String(b?.periodEnd || '')));
        }
        if (url === '/api/archives/close' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            if (!writeAllowed(license))
                return json(res, 402, { error: 'الترخيص منتهي — الوضع قراءة فقط' });
            const b = await bodyJson(req, 128 * 1024), out = await closeAndArchive(t, a.user.id, b);
            return json(res, 200, out);
        }
        if (url === '/api/archives' && req.method === 'GET') {
            if (!admin(a.user) && !hasPermission(a.user, 'periods', 'view'))
                return json(res, 403, { error: 'forbidden' });
            return json(res, 200, { items: await listArchives(t) });
        }
        const archiveMatch = url.match(/^\/api\/archives\/(\d+)$/);
        if (archiveMatch && req.method === 'GET') {
            if (!admin(a.user) && !hasPermission(a.user, 'periods', 'view'))
                return json(res, 403, { error: 'forbidden' });
            return json(res, 200, await getArchive(t, Number(archiveMatch[1])));
        }
        const archiveExportMatch = url.match(/^\/api\/archives\/(\d+)\/export$/);
        if (archiveExportMatch && req.method === 'GET') {
            if (!admin(a.user) && !hasPermission(a.user, 'periods', 'view'))
                return json(res, 403, { error: 'forbidden' });
            return json(res, 200, await exportArchive(t, Number(archiveExportMatch[1])));
        }
        const archiveVerifyMatch = url.match(/^\/api\/archives\/(\d+)\/verify$/);
        if (archiveVerifyMatch && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await verifyArchive(t, Number(archiveVerifyMatch[1])));
        }
        if (archiveMatch && req.method === 'DELETE') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await deleteArchive(t, Number(archiveMatch[1]), a.user.id));
        }
        if (url === '/api/backups' && req.method === 'GET') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, { items: await listBackups(t) });
        }
        if (url === '/api/backups' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const b = await bodyJson(req, 64 * 1024);
            return json(res, 200, await createBackup(t, String(b?.label || 'نسخة خادمية'), 'snapshot', a.user.id));
        }
        if (url === '/api/backups/cleanup' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await cleanOldBackups(t));
        }
        const backupMatch = url.match(/^\/api\/backups\/(\d+)$/);
        if (backupMatch && req.method === 'DELETE') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await deleteBackup(t, Number(backupMatch[1])));
        }
        const backupPinMatch = url.match(/^\/api\/backups\/(\d+)\/pin$/);
        if (backupPinMatch && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const b = await bodyJson(req, 16 * 1024);
            return json(res, 200, await setBackupPinned(t, Number(backupPinMatch[1]), !!b?.pinned));
        }
        const backupVerifyMatch = url.match(/^\/api\/backups\/(\d+)\/verify$/);
        if (backupVerifyMatch && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, await verifyBackup(t, Number(backupVerifyMatch[1])));
        }
        const backupRestoreMatch = url.match(/^\/api\/backups\/(\d+)\/restore$/);
        if (backupRestoreMatch && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const out = await restoreBackup(t, Number(backupRestoreMatch[1]));
            return json(res, 200, out, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        if (url === '/api/state/main' && req.method === 'GET') {
            return json(res, 200, { data: clientPayload(a.payload, a.user, license), schemaVersion: a.schemaVersion ?? null, revision: Number(a.revision ?? 0), updatedAt: a.updatedAt ?? null, license });
        }
        if (url === '/api/state/restore' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const b = await bodyJson(req, 64 * 1024 * 1024);
            if (String(b?.confirm || '') !== 'EXTERNAL-RESTORE' || !b?.data)
                return json(res, 400, { error: 'restore_confirmation_required' });
            const incoming = structuredClone(b.data);
            const out = await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [t]); const row = await currentStateForUpdate(c, t); if (!row)
                throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); await c.query(`insert into erp_state_history(tenant_key,revision,schema_version,payload,reason,pinned) values($1,$2,$3,$4::jsonb,'external-restore-before',true)`, [t, Number(row.revision), row.schema_version, JSON.stringify(row.payload)]); const currentCompany = String(row.payload?.company?.companyId || license.companyId || ''), incomingCompany = String(incoming?.company?.companyId || incoming?.license?.companyId || ''); if (currentCompany && incomingCompany && currentCompany !== incomingCompany)
                throw Object.assign(new Error('هذه النسخة تخص شركة مختلفة'), { statusCode: 409 }); if (!Array.isArray(incoming.users) || !Array.isArray(incoming.accounts))
                throw Object.assign(new Error('ملف النسخة غير صالح'), { statusCode: 400 }); if ((incoming.users || []).filter((u) => u.active !== false).length > license.maxUsers)
                throw Object.assign(new Error(`النسخة تحتوي مستخدمين أكثر من حد الترخيص (${license.maxUsers})`), { statusCode: 403 }); if ((incoming.branches || []).filter((x) => x.active !== false).length > license.maxBranches)
                throw Object.assign(new Error(`النسخة تحتوي فروعًا أكثر من حد الترخيص (${license.maxBranches})`), { statusCode: 403 }); const payload = mergeUserSecrets(row.payload, incoming); payload.company = { ...payload.company, companyId: currentCompany || incomingCompany || license.companyId || '' }; payload.license = { ...payload.license, ...license, activationKey: '' }; const fileIds = [...new Set((b?.fileIds || []).map((x) => String(x || '')).filter(Boolean))]; if (fileIds.length) {
                await c.query('delete from erp_file_refs where tenant_key=$1 and not(file_id=any($2::text[]))', [t, fileIds]);
                await c.query('delete from erp_files where tenant_key=$1 and not(file_id=any($2::text[]))', [t, fileIds]);
            }
            else {
                await c.query('delete from erp_file_refs where tenant_key=$1', [t]);
                await c.query('delete from erp_files where tenant_key=$1', [t]);
            } ; await rebuildEntityMirror(c, t, payload); const up = await persistStateRecord(c, t, payload, String(payload?.meta?.schema || row.schema_version)); await syncUserDirectory(c, t, payload.users || []); await c.query('delete from erp_auth_tokens where tenant_key=$1', [t]); await c.query('delete from erp_sessions where tenant_key=$1', [t]); return { revision: up.revision }; });
            return json(res, 200, { ok: true, revision: out.revision }, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        if (url === '/api/state/main' && req.method === 'PUT') {
            if (!writeAllowed(license))
                return json(res, 402, { error: 'الترخيص منتهي — البيانات متاحة للقراءة والنسخ الاحتياطي فقط' });
            const b = await bodyJson(req, 64 * 1024 * 1024), baseData = b?.baseData, patch = b?.patch, baseRevision = Number(b?.baseRevision || 0), hasPatch = !!patch && typeof patch === 'object', direct = b?.data;
            if (!hasPatch && (!direct || typeof direct !== 'object'))
                return json(res, 400, { error: 'بيانات النظام مطلوبة' });
            let submitted = direct && typeof direct === 'object' ? direct : null, schemaVersion = '';
            const out = await withTx(async (c) => { const row = await currentStateForUpdate(c, t); if (!row)
                return { conflict: true, revision: 0 }; const rev = Number(row.revision), revisionMismatch = baseRevision !== rev; let mergeBase = baseData && typeof baseData === 'object' ? baseData : null; if (!mergeBase && baseRevision !== rev && baseRevision > 0) {
                const hist = await c.query('select payload from erp_state_history where tenant_key=$1 and revision=$2 order by id desc limit 1', [t, baseRevision]);
                if (hist.rowCount)
                    mergeBase = clientPayload(hist.rows[0].payload, a.user, license);
            } const currentVisible = clientPayload(row.payload, a.user, license); if (hasPatch) {
                const patchBase = mergeBase || (!revisionMismatch ? currentVisible : null);
                if (patchBase)
                    submitted = applyStatePatch(patchBase, patch);
            } if (!submitted || typeof submitted !== 'object')
                return { conflict: true, revision: rev }; schemaVersion = String(submitted?.meta?.schema || row.schema_version || ''); const visible = mergeBase ? currentVisible : null, rebased = mergeBase ? mergeConcurrentPayload(mergeBase, submitted, visible) : (baseRevision === rev ? submitted : null); if (!rebased)
                return { conflict: true, revision: rev }; const merged = mergeScopedPayload(row.payload, rebased, a.user), sessionUser = (merged?.users || []).find((u) => u.id === a.user.id && u.active !== false); if (!sessionUser)
                throw Object.assign(new Error('المستخدم الحالي غير موجود أو غير نشط'), { statusCode: 403 }); assertUserDirectoryChangeAllowed(a.user, row.payload, merged); const changes = assertStateChangeAllowed(a.user, row.payload, merged, license, moduleAllowed); assertBranchChangesAllowed(a.user, row.payload, merged); assertCommercialLimits(a.user, row.payload, merged); assertRecordLifecycle(row.payload, merged); assertFinancialImmutability(row.payload, merged); assertApprovalWorkflow(a.user, row.payload, merged); if ((merged.users || []).filter((u) => u.active !== false).length > license.maxUsers)
                throw Object.assign(new Error(`الترخيص يسمح بحد أقصى ${license.maxUsers} مستخدمًا`), { statusCode: 403 }); if ((merged.branches || []).filter((x) => x.active !== false).length > license.maxBranches)
                throw Object.assign(new Error(`الترخيص يسمح بحد أقصى ${license.maxBranches} فرعًا`), { statusCode: 403 }); merged.license = { ...merged.license, ...license, activationKey: '' }; const payload = mergeUserSecrets(row.payload, merged), historyCritical = new Set(['users', 'branches', 'accounts', 'journals', 'invoices', 'invoiceAdjustments', 'receipts', 'payments', 'expenses', 'transfers', 'treasuries', 'periods', 'fiscalYears', 'partyNettings']), keepHistory = changes.some((x) => historyCritical.has(String(x.collection || ''))) || rev % 25 === 0; await syncEntityMirror(c, t, row.payload, payload, changes.map((x) => String(x.collection || ''))); if (keepHistory)
                await c.query("insert into erp_state_history(tenant_key,revision,schema_version,payload,reason,pinned) values($1,$2,$3,$4::jsonb,'state-write',false)", [t, rev, row.schema_version, JSON.stringify(row.payload)]); const up = await persistStateRecord(c, t, payload, schemaVersion); if (changes.some((x) => x.collection === 'users'))
                await syncUserDirectory(c, t, payload.users || []); const newRev = up.revision; await auditEvent(c, t, a, 'state-write', changes, newRev); if (keepHistory)
                await c.query(`delete from erp_state_history where tenant_key=$1 and pinned=false and id not in(select id from erp_state_history where tenant_key=$1 and pinned=false order by revision desc,id desc limit 3)`, [t]); return { conflict: false, revision: newRev, updatedAt: up.updated_at, changes, merged: revisionMismatch || !!baseData }; });
            if (out.conflict)
                return json(res, 409, { error: 'state_conflict', revision: out.revision });
            return json(res, 200, { ok: true, revision: out.revision, updatedAt: out.updatedAt, changes: out.changes, merged: out.merged === true });
        }
        if (url === '/api/state/history' && req.method === 'GET') {
            if (!hasPermission(a.user, 'audit', 'view'))
                return json(res, 403, { error: 'forbidden' });
            const r = await pool.query('select revision,schema_version,reason,pinned,created_at from erp_state_history where tenant_key=$1 order by pinned desc,revision desc limit 20', [t]);
            return json(res, 200, { items: r.rows });
        }
        if (url === '/api/sessions' && req.method === 'GET') {
            if (!admin(a.user) && !hasPermission(a.user, 'sessions', 'view'))
                return json(res, 403, { error: 'admin_required' });
            return json(res, 200, { items: await listSessions(t, a.payload) });
        }
        const sessionMatch = url.match(/^\/api\/sessions\/([a-f0-9]{16,64})$/i);
        if (sessionMatch && req.method === 'DELETE') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const prefix = sessionMatch[1];
            await pool.query('delete from erp_sessions where tenant_key=$1 and token_hash like $2', [t, prefix + '%']);
            return json(res, 200, { ok: true });
        }
        if (url === '/api/audit' && req.method === 'GET') {
            if (!hasPermission(a.user, 'activity', 'view') && !admin(a.user))
                return json(res, 403, { error: 'forbidden' });
            const r = await pool.query('select id,revision,user_id,action,changes,ip_address,user_agent,created_at from erp_audit_events where tenant_key=$1 order by id desc limit 1000', [t]);
            return json(res, 200, { items: r.rows });
        }
        if (url === '/api/audit' && req.method === 'DELETE') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            const range = String(requestUrl.searchParams.get('range') || '30d'), days = { day: 1, '7d': 7, '30d': 30, '365d': 365 }, windowSql = range === 'all' ? '' : `and created_at>=now()-($3||' days')::interval`;
            const q = await pool.query(`delete from erp_audit_events e where tenant_key=$1 ${windowSql} and action not in('setup','setup-after-reset','reset-existing-login','vendor-force-password-change') and not exists(select 1 from jsonb_array_elements(case when jsonb_typeof(coalesce(e.changes,'[]'::jsonb))='array' then coalesce(e.changes,'[]'::jsonb) else '[]'::jsonb end) x where x->>'collection'=any($2::text[]))`, range === 'all' ? [t, CRITICAL_AUDIT_COLLECTIONS] : [t, CRITICAL_AUDIT_COLLECTIONS, String(days[range] || 30)]);
            const retained = await pool.query(`select count(*)::int count from erp_audit_events e where tenant_key=$1 and exists(select 1 from jsonb_array_elements(case when jsonb_typeof(coalesce(e.changes,'[]'::jsonb))='array' then coalesce(e.changes,'[]'::jsonb) else '[]'::jsonb end) x where x->>'collection'=any($2::text[]))`, [t, CRITICAL_AUDIT_COLLECTIONS]);
            return json(res, 200, { ok: true, deletedTechnical: q.rowCount || 0, retainedCritical: Number(retained.rows[0]?.count || 0) });
        }
        if (url === '/api/integrations/whatsapp/send' && req.method === 'POST') {
            if (!moduleAllowed(license, 'whatsapp'))
                return json(res, 403, { error: 'وحدة WhatsApp غير مفعلة في الترخيص' });
            if (!hasPermission(a.user, 'customers', 'view') && !hasPermission(a.user, 'crm', 'view') && !admin(a.user))
                return json(res, 403, { error: 'forbidden' });
            const phoneId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim(), token = String(process.env.WHATSAPP_ACCESS_TOKEN || '').trim(), version = String(process.env.WHATSAPP_GRAPH_VERSION || 'v23.0').trim();
            if (!phoneId || !token)
                return json(res, 409, { error: 'WhatsApp Cloud API غير مهيأ على الخادم' });
            const b = await bodyJson(req), to = String(b?.to || '').replace(/\D/g, ''), text = String(b?.text || '').trim();
            if (!to || !text)
                return json(res, 400, { error: 'رقم الهاتف ونص الرسالة مطلوبان' });
            if (text.length > 4096)
                return json(res, 400, { error: 'الرسالة طويلة جدًا' });
            const rr = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneId)}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }) }), rb = await rr.json().catch(() => ({}));
            if (!rr.ok)
                return json(res, 502, { error: rb?.error?.message || 'فشل إرسال WhatsApp' });
            await withTx(async (c) => auditEvent(c, t, a, 'whatsapp-send', [{ to, messageId: rb?.messages?.[0]?.id || '' }], undefined));
            return json(res, 200, { ok: true, messageId: rb?.messages?.[0]?.id || '' });
        }
        if (url === '/api/support/diagnostics' && req.method === 'GET') {
            if (!hasPermission(a.user, 'support', 'view') && !admin(a.user))
                return json(res, 403, { error: 'forbidden' });
            const detail = requestUrl.searchParams.get('detail') === '1', [db, files, sessions, entityStorage] = await Promise.all([pool.query(`select pg_database_size(current_database())::bigint size`), pool.query(`select count(*)::int count,coalesce(sum(size),0)::bigint bytes from erp_file_refs where tenant_key=$1`, [t]), pool.query(`select count(*)::int count from erp_sessions where tenant_key=$1 and expires_at>now()`, [t]), entityMirrorStatus(t)]);
            let migrations = [], legacyCopies = {};
            if (detail) {
                const extra = await Promise.all([pool.query(`select name,applied_at from erp_schema_migrations order by name`), legacyServerCopyCounts(t)]);
                migrations = extra[0].rows;
                legacyCopies = extra[1];
            }
            return json(res, 200, { ok: true, version: appVersion, database: 'PostgreSQL', databaseBytes: Number(db.rows[0].size), revision: Number(a.revision || 0), schemaVersion: a.schemaVersion || '', files: files.rows[0], activeSessions: sessions.rows[0].count, backupMode: 'deduplicated-snapshots-plus-external-files', legacyBackupCopies: legacyCopies, license, entityStorage, whatsappConfigured: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN), migrations, company: { name: a.payload?.company?.name || '', companyId: a.payload?.company?.companyId || '' } });
        }
        if (url === '/api/state/factory-reset' && req.method === 'POST') {
            if (!admin(a.user))
                return json(res, 403, { error: 'admin_required' });
            if (!allowFactoryReset)
                return json(res, 403, { error: 'factory_reset_disabled' });
            const b = await bodyJson(req);
            if (String(b?.confirm || '') !== 'RESET_SYSTEM' || String(b?.typed || '') !== 'RESET')
                return json(res, 400, { error: 'confirmation_required' });
            const resetInfo = await withTx(async (c) => { await c.query('select pg_advisory_xact_lock(hashtext($1))', [`reset:${t}`]); const cur = await currentStateForUpdate(c, t); if (!cur)
                throw Object.assign(new Error('company_not_initialized'), { statusCode: 409 }); const old = cur.payload || {}; await c.query(`insert into erp_state_history(tenant_key,revision,schema_version,payload,reason,pinned) values($1,$2,$3,$4::jsonb,'factory-reset-before',true)`, [t, Number(cur.revision), cur.schema_version, JSON.stringify(old)]); const resetAdmins = (old.users || []).filter((u) => u?.active !== false && admin(u)).map((u) => structuredClone(u)), fresh = {}; for (const [k, v] of Object.entries(old))
                fresh[k] = Array.isArray(v) ? [] : (v && typeof v === 'object' ? {} : v); fresh.company = structuredClone(old.company || {}); fresh.settings = structuredClone(old.settings || {}); fresh.license = { ...(old.license || {}), ...license, activationKey: '' }; for (const k of ['accounts', 'currencies', 'taxCodes', 'serviceTypes', 'commissionRules', 'printNarratives', 'umrahSettings', 'umrahMeta', 'umrahSequences'])
                fresh[k] = structuredClone(old[k] || []); fresh.meta = { ...(old.meta || {}), version: appVersion, schema: old.meta?.schema || cur.schema_version, setupComplete: false, resetPending: true, resetExistingLogin: resetAdmins.length > 0, updatedAt: new Date().toISOString(), resetAt: new Date().toISOString(), lastArchivedThrough: '', lastArchiveAt: '' }; fresh.users = []; fresh.branches = []; fresh.treasuries = []; fresh.attachments = []; await rebuildEntityMirror(c, t, fresh); const up = await persistStateRecord(c, t, fresh, cur.schema_version); await c.query('delete from erp_file_refs where tenant_key=$1', [t]); await c.query('delete from erp_files where tenant_key=$1', [t]); await syncUserDirectory(c, t, resetAdmins); await c.query('delete from erp_auth_tokens where tenant_key=$1', [t]); await c.query('delete from erp_sessions where tenant_key=$1', [t]); await auditEvent(c, t, a, 'factory-reset', [{ collection: 'system', reset: 1 }], undefined); return { existingLoginAvailable: resetAdmins.length > 0 }; });
            return json(res, 200, { ok: true, resetPending: true, existingLoginAvailable: resetInfo.existingLoginAvailable, preserved: ['company', 'settings', 'license', 'vendor-connection', 'version', 'previous-admin-login'] }, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        return serveStatic(req, res);
    }
    catch (e) {
        console.error(e);
        return json(res, Number(e?.statusCode || 500), { error: e?.message || 'Internal server error' });
    }
});
async function start() { await runMigrations(); const mirrorInit = await initializeEntityMirrorMetadata().catch(e => { console.warn('Entity mirror metadata initialization failed', e?.message || e); return null; }); if (mirrorInit)
    console.log(`Entity mirror read source ready: ${mirrorInit.ready}/${mirrorInit.total}`); await migrateLegacyFiles().catch(e => console.warn('Legacy file migration failed', e?.message || e)); await migrateLegacyArchives().catch(e => console.warn('Legacy archive migration failed', e?.message || e)); await repairLegacyResetStates().catch(e => console.warn('Legacy reset compatibility repair failed', e?.message || e)); await backupBeforeUpgrade(appVersion).catch(e => console.warn('Pre-upgrade snapshot failed', e?.message || e)); if (vendorMode) {
    await ensureVendorSchema();
    await vendorStartupSync().catch(e => console.warn('Vendor startup sync failed', e?.message || e));
    setTimeout(() => vendorAutomaticRollout().catch(e => console.warn('Vendor automatic rollout failed', e?.message || e)), 15000).unref();
    setInterval(() => vendorAutomaticRollout().catch(e => console.warn('Vendor automatic rollout retry failed', e?.message || e)), 5 * 60_000).unref();
} server.listen(port, '0.0.0.0', () => console.log(`ERP Commercial v${appVersion} listening on 0.0.0.0:${port}`)); }
start().catch(e => { console.error('Failed to start ERP server', e); process.exit(1); });

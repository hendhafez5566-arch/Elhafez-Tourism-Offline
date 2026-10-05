import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { pool, sha, randomToken, withTx, clientIp, userAgent, publicRuntimeUrl } from './context.js';
import { currentStateForUpdate, persistStateRecord } from './repository/state-repository.js';
const recoveryRequests = new Map();
const normalizeEmail = (v) => String(v || '').trim().toLowerCase();
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const mailSettings = () => { const apiKey = String(process.env.RESEND_API_KEY || '').trim(), from = String(process.env.EMAIL_FROM || '').trim(), publicUrl = String(process.env.ERP_PUBLIC_URL || '').trim(); return { apiKey, from, publicUrl, configured: !!(apiKey && from), missing: [!apiKey ? 'RESEND_API_KEY' : '', !from ? 'EMAIL_FROM' : ''].filter(Boolean) }; };
const mailConfigured = () => mailSettings().configured;
function runtimeUrl(req) { if (publicRuntimeUrl)
    return publicRuntimeUrl; const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https', host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim(); return host ? `${proto}://${host}` : ''; }
function recoveryAllowed(req, t, email) { const key = `${t}|${clientIp(req)}|${email}`, n = Date.now(), x = recoveryRequests.get(key); if (!x || x.resetAt <= n) {
    recoveryRequests.set(key, { count: 1, resetAt: n + 15 * 60_000 });
    return true;
} if (x.count >= 4)
    return false; x.count++; return true; }
async function sendMail(to, subject, text, html) { const apiKey = String(process.env.RESEND_API_KEY || '').trim(), from = String(process.env.EMAIL_FROM || '').trim(), replyTo = String(process.env.EMAIL_REPLY_TO || '').trim(); if (!apiKey || !from)
    return { sent: false, configured: false }; const payload = { from, to: [to], subject, text, html }; if (replyTo)
    payload.reply_to = replyTo; try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) {
        console.warn('Email send failed', r.status, b?.message || b?.error || '');
        return { sent: false, configured: true };
    }
    return { sent: true, configured: true, id: String(b?.id || '') };
}
catch (e) {
    console.warn('Email send failed', e?.message || e);
    return { sent: false, configured: true };
} }
async function storeToken(t, user, purpose, email, hours) { const token = randomToken(), hash = sha(token); await pool.query('delete from erp_auth_tokens where tenant_key=$1 and user_id=$2 and purpose=$3 and consumed_at is null', [t, user.id, purpose]); await pool.query(`insert into erp_auth_tokens(token_hash,tenant_key,user_id,purpose,email,expires_at) values($1,$2,$3,$4,$5,now()+($6||' hours')::interval)`, [hash, t, user.id, purpose, email, String(hours)]); return token; }
async function findUserByEmail(t, email) { const r = await pool.query('select payload from erp_state where tenant_key=$1', [t]); if (!r.rowCount)
    return null; return (r.rows[0].payload?.users || []).find((u) => u.active !== false && normalizeEmail(u.email) === email) || null; }
async function audit(c, t, req, userId, action, changes, revision) { await c.query(`insert into erp_audit_events(tenant_key,revision,user_id,action,changes,ip_address,user_agent) values($1,$2,$3,$4,$5::jsonb,$6,$7)`, [t, revision || null, userId, action, JSON.stringify(changes || []), clientIp(req), userAgent(req)]); }
export function emailRecoveryStatus() { const s = mailSettings(); return { configured: s.configured, provider: s.configured ? 'resend' : 'none', missing: s.missing, publicUrlConfigured: !!(s.publicUrl || publicRuntimeUrl) }; }
export async function issueEmailVerification(t, user, req) { const email = normalizeEmail(user?.email); if (!emailOk(email))
    return { sent: false, configured: mailConfigured(), reason: 'invalid_email' }; if (!mailConfigured())
    return { sent: false, configured: false }; const base = runtimeUrl(req); if (!base)
    return { sent: false, configured: true, reason: 'public_url_missing' }; const token = await storeToken(t, user, 'verify_email', email, 24), link = `${base}/?verifyEmail=${encodeURIComponent(token)}`, company = 'Elhafez Tourism — نظام السياحة والحج والعمرة'; return sendMail(email, 'تفعيل البريد الإلكتروني لحساب Elhafez Tourism — نظام السياحة والحج والعمرة', `مرحبًا ${user.name || ''}\n\nفعّل بريدك الإلكتروني من الرابط التالي خلال 24 ساعة:\n${link}\n\nاسم المستخدم: ${user.username || ''}\n\nإذا لم تطلب ذلك فتجاهل الرسالة.`, `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تفعيل البريد الإلكتروني</h2><p>مرحبًا ${escapeHtml(user.name || '')}</p><p>اضغط الزر التالي لتفعيل البريد الخاص بحسابك في ${company}. الرابط صالح لمدة 24 ساعة.</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#173a63;color:#fff;text-decoration:none;border-radius:8px">تفعيل البريد</a></p><p>اسم المستخدم: <b>${escapeHtml(user.username || '')}</b></p><p style="color:#666">إذا لم تطلب ذلك فتجاهل الرسالة.</p></div>`); }
export async function requestRecovery(t, emailRaw, req) { const email = normalizeEmail(emailRaw); if (!emailOk(email))
    throw Object.assign(new Error('اكتب بريدًا إلكترونيًا صحيحًا'), { statusCode: 400 }); if (!mailConfigured())
    throw Object.assign(new Error('خدمة البريد غير مهيأة على الخادم بعد'), { statusCode: 503 }); if (!recoveryAllowed(req, t, email))
    throw Object.assign(new Error('تم إرسال طلبات كثيرة. حاول مرة أخرى بعد 15 دقيقة'), { statusCode: 429 }); const user = await findUserByEmail(t, email); if (!user)
    return { ok: true }; if (!user.emailVerifiedAt) {
    await issueEmailVerification(t, user, req);
    return { ok: true };
} const base = runtimeUrl(req); if (!base)
    throw Object.assign(new Error('رابط النظام العام غير مهيأ'), { statusCode: 503 }); const token = await storeToken(t, user, 'reset_password', email, 0.5), link = `${base}/?resetPassword=${encodeURIComponent(token)}`; await sendMail(email, 'استعادة حساب Elhafez Tourism — نظام السياحة والحج والعمرة', `اسم المستخدم: ${user.username || ''}\n\nلتعيين كلمة مرور جديدة افتح الرابط التالي خلال 30 دقيقة:\n${link}\n\nإذا لم تطلب ذلك فتجاهل الرسالة.`, `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>استعادة الحساب</h2><p>اسم المستخدم الخاص بك: <b>${escapeHtml(user.username || '')}</b></p><p>لتعيين كلمة مرور جديدة اضغط الزر التالي. الرابط صالح لمدة 30 دقيقة ويستخدم مرة واحدة فقط.</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#173a63;color:#fff;text-decoration:none;border-radius:8px">تعيين كلمة مرور جديدة</a></p><p style="color:#666">إذا لم تطلب ذلك فتجاهل الرسالة.</p></div>`); return { ok: true }; }
export async function verifyEmailToken(t, tokenRaw, req) { const token = String(tokenRaw || '').trim(); if (token.length < 32)
    throw Object.assign(new Error('رابط التفعيل غير صالح'), { statusCode: 400 }); const hash = sha(token); return withTx(async (c) => { const tr = await c.query(`select * from erp_auth_tokens where token_hash=$1 and tenant_key=$2 and purpose='verify_email' and consumed_at is null and expires_at>now() for update`, [hash, t]); if (!tr.rowCount)
    throw Object.assign(new Error('رابط التفعيل منتهي أو تم استخدامه'), { statusCode: 400 }); const tok = tr.rows[0], row = await currentStateForUpdate(c, t); if (!row)
    throw Object.assign(new Error('بيانات الشركة غير موجودة'), { statusCode: 404 }); const payload = structuredClone(row.payload), user = (payload.users || []).find((u) => u.id === tok.user_id && u.active !== false); if (!user || normalizeEmail(user.email) !== normalizeEmail(tok.email))
    throw Object.assign(new Error('تعذر مطابقة البريد بالمستخدم'), { statusCode: 400 }); user.emailVerifiedAt = new Date().toISOString(); const rev = Number(row.revision); await c.query('insert into erp_state_history(tenant_key,revision,schema_version,payload) values($1,$2,$3,$4::jsonb)', [t, rev, row.schema_version, JSON.stringify(row.payload)]); const up = await persistStateRecord(c, t, payload, row.schema_version); await c.query('update erp_auth_tokens set consumed_at=now() where token_hash=$1', [hash]); await audit(c, t, req, user.id, 'email-verified', [{ email: tok.email }], up.revision); return { ok: true }; }); }
export async function resetPasswordWithToken(t, tokenRaw, passwordRaw, req) { const token = String(tokenRaw || '').trim(), password = String(passwordRaw || ''); if (token.length < 32)
    throw Object.assign(new Error('رابط الاستعادة غير صالح'), { statusCode: 400 }); if (password.length < 8)
    throw Object.assign(new Error('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف'), { statusCode: 400 }); if (password.length > 200)
    throw Object.assign(new Error('كلمة المرور طويلة جدًا'), { statusCode: 400 }); const hash = sha(token); return withTx(async (c) => { const tr = await c.query(`select * from erp_auth_tokens where token_hash=$1 and tenant_key=$2 and purpose='reset_password' and consumed_at is null and expires_at>now() for update`, [hash, t]); if (!tr.rowCount)
    throw Object.assign(new Error('رابط الاستعادة منتهي أو تم استخدامه'), { statusCode: 400 }); const tok = tr.rows[0], row = await currentStateForUpdate(c, t); if (!row)
    throw Object.assign(new Error('بيانات الشركة غير موجودة'), { statusCode: 404 }); const payload = structuredClone(row.payload), user = (payload.users || []).find((u) => u.id === tok.user_id && u.active !== false); if (!user || normalizeEmail(user.email) !== normalizeEmail(tok.email) || !user.emailVerifiedAt)
    throw Object.assign(new Error('تعذر التحقق من حساب المستخدم'), { statusCode: 400 }); const salt = randomBytes(24).toString('hex'), iterations = 210000; user.passwordSalt = salt; user.passwordIterations = iterations; user.passwordAlgo = 'pbkdf2-sha256'; user.passwordHash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex'); user.password = ''; user.mustChangePassword = false; const rev = Number(row.revision); await c.query('insert into erp_state_history(tenant_key,revision,schema_version,payload) values($1,$2,$3,$4::jsonb)', [t, rev, row.schema_version, JSON.stringify(row.payload)]); const up = await persistStateRecord(c, t, payload, row.schema_version); await c.query('update erp_auth_tokens set consumed_at=now() where token_hash=$1', [hash]); await c.query('delete from erp_sessions where tenant_key=$1 and user_id=$2', [t, user.id]); await audit(c, t, req, user.id, 'password-recovery', [{ email: tok.email }], up.revision); return { ok: true, username: String(user.username || '') }; }); }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)); }

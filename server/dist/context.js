import { Pool } from 'pg';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';
export const port = Number(process.env.PORT || 8080);
export const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl)
    throw new Error('DATABASE_URL is required');
export const pool = new Pool({ connectionString: databaseUrl, max: Number(process.env.PG_POOL_MAX || 10) });
export const fixedTenant = String(process.env.ERP_TENANT || 'default').trim().slice(0, 100) || 'default';
export const allowTenantHeader = String(process.env.ALLOW_TENANT_HEADER || 'false').toLowerCase() === 'true';
export const allowFactoryReset = String(process.env.ALLOW_FACTORY_RESET || 'false').toLowerCase() === 'true';
export const sessionHours = Math.max(1, Number(process.env.SESSION_HOURS || 12));
export const mobileSessionHours = Math.max(24, Number(process.env.MOBILE_SESSION_HOURS || 720));
export const trialDays = Math.max(1, Number(process.env.TRIAL_DAYS || 30));
let packageVersion = '', packageMeta = {};
try {
    packageMeta = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    packageVersion = String(packageMeta?.version || '').trim();
}
catch { }
export const appVersion = String(process.env.ERP_APP_VERSION_OVERRIDE || packageVersion || process.env.ERP_APP_VERSION || '32.3.0');
export const buildCommit = String(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '').trim();
export const vendorMode = false;
export const erpCompanyId = String(process.env.ERP_COMPANY_ID || '').trim().slice(0, 80);
export const vendorLicenseUrl = String(process.env.VENDOR_LICENSE_URL || '').trim().replace(/\/$/, '');
export const vendorAgentKey = String(process.env.VENDOR_AGENT_KEY || '').trim();
export const vendorLicenseCheckMinutes = Math.max(1, Number(process.env.VENDOR_LICENSE_CHECK_MINUTES || 5));
export const licenseGraceHours = Math.max(1, Number(process.env.LICENSE_GRACE_HOURS || 72));
export const publicRuntimeUrl = String(process.env.ERP_PUBLIC_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')).trim().replace(/\/$/, '');
export const releaseChannel = ['stable', 'beta', 'hotfix'].includes(String(packageMeta?.erpRelease?.channel || '').toLowerCase()) ? String(packageMeta.erpRelease.channel).toLowerCase() : 'stable';
export const releaseNotes = String(packageMeta?.erpRelease?.notes || '').trim().slice(0, 4000);
export const releaseMigrationRequired = packageMeta?.erpRelease?.migrationRequired === true;
export function tenant(req) { if (!allowTenantHeader)
    return fixedTenant; const raw = req.headers['x-erp-tenant']; return String(Array.isArray(raw) ? raw[0] : raw || fixedTenant).trim().slice(0, 100) || fixedTenant; }
export function clientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().slice(0, 200); }
export function userAgent(req) { return String(req.headers['user-agent'] || '').slice(0, 500); }
const CSP_ENFORCED = "frame-ancestors 'self'; base-uri 'self'; form-action 'self'";
const CSP_REPORT_ONLY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: http://localhost capacitor://localhost; frame-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
export function securityHeaders() { return { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Cross-Origin-Resource-Policy': 'same-origin', 'Strict-Transport-Security': 'max-age=15552000', 'Content-Security-Policy': CSP_ENFORCED, 'Content-Security-Policy-Report-Only': CSP_REPORT_ONLY }; }
const ACTIVE_MIME = /^(text\/html|application\/xhtml|image\/svg|text\/xml|application\/xml|text\/javascript|application\/javascript|application\/x-javascript|text\/css|text\/xsl|application\/xslt)/i;
export function fileResponseHeaders(mime, name) { const m = String(mime || '').trim(), active = !m || ACTIVE_MIME.test(m), type = active ? 'application/octet-stream' : m; return { 'Content-Type': type, 'Content-Disposition': `${active ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}` }; }
export function apiCorsHeaders(req) { const origin = String(req.headers.origin || '').trim(), allowed = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost']); if (!allowed.has(origin))
    return {}; return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ERP-Mobile, X-ERP-Mobile-Version, X-ERP-Tenant, Content-Encoding, X-File-Name, Cache-Control, Pragma', 'Access-Control-Max-Age': '600', 'Cross-Origin-Resource-Policy': 'cross-origin' }; }
const gzipAsync = promisify(gzip), gunzipAsync = promisify(gunzip);
export async function json(res, status, body, headers = {}) { const req = res.req, cors = req ? apiCorsHeaders(req) : {}, raw = Buffer.from(JSON.stringify(body)), accepts = String(req?.headers?.['accept-encoding'] || ''), canGzip = raw.length >= 4096 && /\bgzip\b/i.test(accepts); let data = raw, encoding = ''; if (canGzip) {
    try {
        const gz = await gzipAsync(raw, { level: 4 });
        if (gz.length < raw.length) {
            data = gz;
            encoding = 'gzip';
        }
    }
    catch { }
} const h = { ...securityHeaders(), ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': String(data.length), 'Cache-Control': 'no-store', 'Vary': Object.keys(cors).length ? 'Accept-Encoding, Origin' : 'Accept-Encoding', ...headers }; if (encoding)
    h['Content-Encoding'] = encoding; res.writeHead(status, h); res.end(data); }
export async function bodyBuffer(req, maxBytes = 25 * 1024 * 1024) { const chunks = []; let size = 0; for await (const chunk of req) {
    const b = Buffer.from(chunk);
    size += b.length;
    if (size > maxBytes)
        throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
    chunks.push(b);
} return Buffer.concat(chunks); }
export async function bodyJson(req, maxBytes = 25 * 1024 * 1024) { let b = await bodyBuffer(req, maxBytes); const enc = String(req.headers['content-encoding'] || '').trim().toLowerCase(); if (enc && enc !== 'identity') {
    if (enc !== 'gzip')
        throw Object.assign(new Error('Unsupported content encoding'), { statusCode: 415 });
    try {
        b = await gunzipAsync(b);
    }
    catch {
        throw Object.assign(new Error('Invalid gzip payload'), { statusCode: 400 });
    }
    if (b.length > maxBytes)
        throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
} return b.length ? JSON.parse(b.toString('utf8')) : {}; }
export function cookies(req) { const out = {}; for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0)
        out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
} return out; }
export const sha = (x) => createHash('sha256').update(x).digest('hex');
export function safeEq(a, b) { const aa = Buffer.from(a), bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
export function randomToken() { return randomBytes(32).toString('hex'); }
export function secureCookie(req) { return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'; }
export const sessionCookieName = `erp_session_${createHash('sha256').update(fixedTenant).digest('hex').slice(0, 12)}`;
export function sessionCookie(req, token, maxAge) { return `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureCookie(req) ? '; Secure' : ''}`; }
export async function withTx(fn) { const c = await pool.connect(); try {
    await c.query('begin');
    const out = await fn(c);
    await c.query('commit');
    return out;
}
catch (e) {
    await c.query('rollback');
    throw e;
}
finally {
    c.release();
} }

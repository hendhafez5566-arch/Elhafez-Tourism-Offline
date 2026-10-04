// Part 6 — server hardening smoke (reads server/src/context.ts; no database needed).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const src = fs.readFileSync(root + 'server/src/context.ts', 'utf8');
let failed = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) failed++; };
ok('enforced CSP has frame-ancestors/base-uri/form-action', /CSP_ENFORCED="frame-ancestors 'self'; base-uri 'self'; form-action 'self'"|CSP_ENFORCED=\"frame-ancestors 'self'; base-uri 'self'; form-action 'self'\"/.test(src));
ok('full CSP is Report-Only, never enforced with script-src', /'Content-Security-Policy-Report-Only':CSP_REPORT_ONLY/.test(src) && !/'Content-Security-Policy':CSP_REPORT_ONLY/.test(src));
ok('report-only CSP forbids inline scripts and objects', /script-src 'self';/.test(src) && /object-src 'none'/.test(src) && !/script-src[^;]*unsafe-inline/.test(src));
ok('HSTS header present', /'Strict-Transport-Security':'max-age=\d+'/.test(src));
ok('dangerous ALLOW_* flags default to false', /ALLOW_TENANT_HEADER\|\|'false'/.test(src) && /ALLOW_FACTORY_RESET\|\|'false'/.test(src));
ok('session cookie is HttpOnly + SameSite', /HttpOnly; SameSite=Lax/.test(src));
const re = src.match(/const ACTIVE_MIME=(\/.*\/i);/); ok('ACTIVE_MIME defined', !!re);
if (re) {
  const ACTIVE = eval(re[1]);
  const fn = (mime, name) => { const m = String(mime || '').trim(), active = !m || ACTIVE.test(m), type = active ? 'application/octet-stream' : m; return { type, disp: active ? 'attachment' : 'inline' }; };
  for (const m of ['text/html', 'text/html; charset=utf-8', 'image/svg+xml', 'application/xhtml+xml', 'text/xml', 'application/javascript', 'text/javascript', 'TEXT/HTML', '']) { const r = fn(m); ok(`active type "${m}" is forced to attachment/octet-stream`, r.disp === 'attachment' && r.type === 'application/octet-stream'); }
  for (const m of ['image/png', 'image/jpeg', 'application/pdf', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']) { const r = fn(m); ok(`normal type "${m}" unchanged`, r.disp === 'inline' && r.type === m); }
}
ok('server.ts serves files via fileResponseHeaders', /\.\.\.fileResponseHeaders\(/.test(fs.readFileSync(root + 'server/src/server.ts', 'utf8')));
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log('\nServer hardening smoke passed');

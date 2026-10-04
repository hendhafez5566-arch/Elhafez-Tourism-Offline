// Part 6 — XSS safety smoke (static + unit). No browser needed.
// 1) esc() neutralises hostile payloads in text and quoted-attribute contexts.
// 2) No HTML attribute in src/ interpolates a raw record field (id/page/key/type/value/no/status/kind/code).
// 3) No document.write / eval / new Function in src/.
// 4) Inline event handlers with interpolated data stay at the documented baseline (1: forms.ts opts.onchange, developer-supplied).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let failed = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ' ' + extra}`); if (!cond) failed++; };
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (p.endsWith('.ts')) o.push(p); } return o; }
const files = walk(path.join(root, 'src'));

// 1) pull the real esc implementations out of the source and exercise them
const escSources = [
  [ 'src/core/runtime.ts', /const esc=s=>S\(s\)\.replace\(\/\[&<>"'\]\/g,m=>\(\{[^}]+\}\[m\]\)\);/ ],
  [ 'src/core/umrah/runtime.ts', /const UmrahCore_esc = s => UmrahCore_S\(s\)\.replace\(\/\[&<>"'\]\/g, m => \(\{[^}]+\}\[m\]\)\);/ ]
];
const payloads = ['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', 'javascript:alert(1)', "' onmouseover='alert(1)", '"</td><td onclick="x()', '&lt;already&gt;'];
for (const [file, re] of escSources) {
  const src = fs.readFileSync(path.join(root, file), 'utf8'), m = src.match(re);
  ok(`${file}: esc definition found`, !!m);
  if (!m) continue;
  const S = x => (x == null ? '' : String(x));
  const fn = new Function('S', 'UmrahCore_S', m[0].replace(/^const (\w+)=?\s*/, 'return ').replace(/^return =\s*/, 'return ').replace(/;$/, ''))(S, S);
  for (const p of payloads) {
    const out = fn(p);
    ok(`${file}: neutralises ${JSON.stringify(p).slice(0, 40)}`, !/[<>"']/.test(out), out);
    const attr = `<a data-x="${out}">`;
    ok(`${file}: stays inside quoted attribute for ${JSON.stringify(p).slice(0, 30)}`, (attr.match(/"/g) || []).length === 2);
  }
  ok(`${file}: normal ids unchanged`, fn('inv_2026-0001') === 'inv_2026-0001' && fn('ع-١٢٣') === 'ع-١٢٣' && fn(null) === '');
}

// 2) raw record fields inside attributes
const attrRe = /(=\\?")\$\{((?:[A-Za-z_]\w*)(?:\??\.[A-Za-z_]\w*)*\??\.(?:id|page|key|type|value|no|status|kind|code))\}(\\?")/g;
// Internal route keys asserted verbatim by v32514-auth-ui-delegation-smoke (x.page comes from the static page registry, not user data).
const INTERNAL_ALLOW = ['data-ui-search-result="${x.page}"'];
const raw = [];
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(attrRe)) if (!INTERNAL_ALLOW.some(a => s.slice(Math.max(0, m.index - 30), m.index + m[0].length).includes(a))) raw.push(`${path.relative(root, f)}: ${m[0]}`); }
ok('no raw record field interpolated into an HTML attribute', raw.length === 0, `\n  ${raw.slice(0, 10).join('\n  ')} (${raw.length} total)`);

// 3) dangerous APIs
const bad = [];
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const re of [/document\.write\s*\(/, /\beval\s*\(/, /new Function\s*\(/]) if (re.test(s)) bad.push(`${path.relative(root, f)}: ${re}`); }
ok('no document.write / eval / new Function in src/', bad.length === 0, bad.join(', '));

// 4) inline handlers with interpolation
let inline = 0; const hre = /\bon(?:click|change|input|submit|keyup|keydown)=\\?"([^"]*)/g;
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(hre)) if (m[1].includes('${')) inline++; }
ok('inline handlers with interpolated data <= baseline (1)', inline <= 1, `found ${inline}`);

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nXSS safety smoke passed');

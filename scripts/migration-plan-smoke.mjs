// Part 5 — tests the pure migration plan + round trip (payload -> rows+stripped -> hydrate) on synthetic Arabic data. No DB.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPlan, hydrate } from './lib/migration-plan.mjs';
import { fingerprint, compare, COLLECTIONS } from './lib/state-verify.mjs';
let failed = 0; const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) failed++; };
const root = fileURLToPath(new URL('../', import.meta.url));
const core = fs.readFileSync(root + 'server/src/entity-mirror-core.ts', 'utf8');
const keys = [...core.match(/MIRRORED_COLLECTION_KEYS=\[([\s\S]*?)\] as const/)[1].matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
ok('COLLECTIONS list equals server MIRRORED_COLLECTION_KEYS (same names, same order)', JSON.stringify(keys) === JSON.stringify(COLLECTIONS), `server=${keys.length} tool=${COLLECTIONS.length}`);

const names = ['محمد الحافظ', 'فاطمة السيد', 'أحمد عبد العال', 'نور <b>x</b>', 'عُمر "القاضي"', 'يوسف\nالشناوي'];
const payload = { settings: { baseCurrency: 'EGP' }, users: [{ id: 'u1', name: 'admin' }], license: { k: 1 },
  customers: names.map((n, i) => ({ id: 'c' + i, name: n, balance: 0, extra: { a: [1, 2, { b: null }] } })), suppliers: [], invoices: [{ id: 'inv1', no: 'INV-1', total: 1500.5, currency: 'SAR' }],
  journals: [{ id: 'j1', lines: [{ accountId: '1300', debit: 1500.5, currency: 'SAR', partyType: 'customer', partyId: 'c0' }, { accountId: '4100', credit: 1500.5, currency: 'SAR' }] }] };
const plan = buildPlan(payload);
ok('plan is safe for clean data', plan.safe, plan.reasons.join(';'));
ok('row count = sum of mirrored collections', plan.rowCount === 6 + 0 + 1 + 1 && plan.rows.length === 8);
ok('stripped payload keeps settings/users/license and drops mirrored collections', plan.stripped.settings && plan.stripped.users && plan.stripped.license && !('customers' in plan.stripped) && !('journals' in plan.stripped));
ok('present keys keep empty collections (suppliers)', plan.presentKeys.includes('suppliers'));
const back = hydrate(plan.stripped, plan.rows, plan.presentKeys);
ok('round trip: before == after (counts, content, trial balance, party balances)', compare(fingerprint(payload), fingerprint(back)).ok);
ok('round trip preserves record order', back.customers.map(c => c.id).join() === payload.customers.map(c => c.id).join());
ok('round trip preserves Arabic/newline/quote text exactly', back.customers.every((c, i) => c.name === names[i]));
const shuffled = [...plan.rows].reverse(); ok('hydrate is independent of row fetch order', compare(fingerprint(payload), fingerprint(hydrate(plan.stripped, shuffled, plan.presentKeys))).ok);
ok('original payload not mutated by plan', 'customers' in payload && payload.customers.length === 6);
const noId = buildPlan({ customers: [{ id: 'a' }, { name: 'بلا id' }] }); ok('unsafe: missing id is reported, not guessed', !noId.safe && noId.reasons[0].includes('missing id'));
const dup = buildPlan({ customers: [{ id: 'a' }, { id: 'a' }] }); ok('unsafe: duplicate id reported', !dup.safe && dup.reasons[0].includes('duplicate'));
const bad = buildPlan({ customers: { id: 'a' } }); ok('unsafe: non-array collection reported', !bad.safe);
const empty = buildPlan({}); ok('empty payload: safe, zero rows', empty.safe && empty.rowCount === 0);
if (failed) { console.error(failed + ' failed'); process.exit(1); } console.log('\nMigration plan smoke passed');
